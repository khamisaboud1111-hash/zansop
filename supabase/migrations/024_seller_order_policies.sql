-- 024: let sellers read and update the orders that contain their products
--
-- public.orders had a single SELECT policy named
-- "Sellers can read their own orders" whose condition was
--   (buyer_id = auth.uid())
-- That is the buyer's check, not the seller's, so a seller could never read
-- any order: /seller/orders showed "0 maagizo" while the buyer's order sat
-- in the database with the seller's own order_items row.
--
-- The policy is replaced with one that covers all three parties, and the
-- missing write policies are added:
--   * orders UPDATE  - the seller needs it to move an order through
--                       pending -> confirmed -> packed -> out_for_delivery
--                       -> delivered
--   * order_tracking INSERT - the seller writes a tracking row for every
--                       status change
--
-- A seller only ever reaches orders that contain one of their own items.

drop policy if exists "Sellers can read their own orders" on public.orders;

create policy "Buyers and sellers can read their orders"
on public.orders
for select
to authenticated
using (
  buyer_id = auth.uid()
  or id in (
    select oi.order_id
    from order_items oi
    join sellers s on s.id = oi.seller_id
    where s.user_id = auth.uid()
  )
  or is_admin()
);

create policy "Sellers can update their orders"
on public.orders
for update
to authenticated
using (
  id in (
    select oi.order_id
    from order_items oi
    join sellers s on s.id = oi.seller_id
    where s.user_id = auth.uid()
  )
  or is_admin()
)
with check (true);

create policy "Order parties can add tracking"
on public.order_tracking
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    order_id in (select id from orders where buyer_id = auth.uid())
    or order_id in (
      select oi.order_id
      from order_items oi
      join sellers s on s.id = oi.seller_id
      where s.user_id = auth.uid()
    )
    or is_admin()
  )
);

notify pgrst, 'reload schema';
