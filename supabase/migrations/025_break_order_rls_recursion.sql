-- 025: break the RLS recursion between orders and order_items
--
-- 024 added a seller clause to the orders policy that reads order_items, but
-- the order_items policies already read orders. Postgres evaluates the
-- policies of a table referenced by another table's policy, so the two
-- referenced each other and every query failed with:
--   ERROR: infinite recursion detected in policy for relation "order_items"
--
-- The link is broken with two SECURITY DEFINER helpers. They run as the
-- table owner, so RLS is not applied to the tables they read and no
-- recursion is possible. They take no user id - they use auth.uid()
-- internally - so they cannot be used to read somebody else's orders.

create or replace function public.my_buyer_order_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select o.id from orders o where o.buyer_id = auth.uid()
$$;

create or replace function public.my_seller_order_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select oi.order_id
  from order_items oi
  join sellers s on s.id = oi.seller_id
  where s.user_id = auth.uid()
$$;

revoke all on function public.my_buyer_order_ids() from public;
revoke all on function public.my_seller_order_ids() from public;
grant execute on function public.my_buyer_order_ids() to authenticated;
grant execute on function public.my_seller_order_ids() to authenticated;

-- orders -------------------------------------------------------------------

drop policy if exists "Buyers and sellers can read their orders" on public.orders;
drop policy if exists "Sellers can read their own orders" on public.orders;

create policy "Buyers and sellers can read their orders"
on public.orders
for select
to authenticated
using (
  buyer_id = auth.uid()
  or id in (select public.my_seller_order_ids())
  or is_admin()
);

drop policy if exists "Sellers can update their orders" on public.orders;

create policy "Sellers can update their orders"
on public.orders
for update
to authenticated
using (
  id in (select public.my_seller_order_ids())
  or is_admin()
)
with check (true);

-- order_items --------------------------------------------------------------

drop policy if exists "Buyers can view own order items" on public.order_items;

create policy "Buyers can view own order items"
on public.order_items
for select
to authenticated
using (
  order_id in (select public.my_buyer_order_ids())
  or seller_id in (select id from sellers where user_id = auth.uid())
);

drop policy if exists "Sellers can view own order items" on public.order_items;

create policy "Sellers can view own order items"
on public.order_items
for select
to authenticated
using (
  seller_id in (select id from sellers where user_id = auth.uid())
  or order_id in (select public.my_buyer_order_ids())
);

-- order_tracking -----------------------------------------------------------

drop policy if exists "Order parties can view tracking" on public.order_tracking;

create policy "Order parties can view tracking"
on public.order_tracking
for select
to authenticated
using (
  order_id in (select public.my_buyer_order_ids())
  or order_id in (select public.my_seller_order_ids())
  or is_admin()
);

drop policy if exists "Order parties can add tracking" on public.order_tracking;

create policy "Order parties can add tracking"
on public.order_tracking
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    order_id in (select public.my_buyer_order_ids())
    or order_id in (select public.my_seller_order_ids())
    or is_admin()
  )
);

notify pgrst, 'reload schema';
