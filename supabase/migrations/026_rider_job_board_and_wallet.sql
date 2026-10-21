-- 026: rider job board, wallet tables and an atomic delivery claim
--
-- The rider pages were hitting four separate failures:
--
--   /rider/wallet      -> rider_transactions and rider_withdrawals do not
--                          exist, so both reads 404 and the withdraw
--                          request 404s as well. The page swallowed the
--                          errors and showed a wallet of zeroes.
--   /rider/available   -> the query selected delivery_type, customer_name
--                          and customer_rating, none of which exist on
--                          deliveries, and filtered on status = 'available',
--                          which is not a value of the delivery_status enum
--                          (the real value is pending_dispatch). Every
--                          request answered 400.
--   /rider/deliveries  -> embedded buyer:profiles!deliveries_buyer_id_fkey,
--                          but deliveries has no buyer_id column, so the
--                          whole request answered 400.
--
-- A rider also could not see the job board at all: the only SELECT policies
-- on deliveries cover rows where the rider is already assigned, the buyer
-- owns the order, or the seller owns the store. Unassigned deliveries were
-- invisible.
--
-- Claiming a job was also unsafe: the app did a plain
-- "update deliveries set rider_id = me where status = 'available'", which two
-- riders can race on. claim_delivery() locks the row and does it atomically.

-- ── deliveries.delivery_type ─────────────────────────────────────────────────
-- The rider job board filters on express vs standard. Nothing in the app
-- stored it, so the filter could never match anything.

alter table public.deliveries
  add column if not exists delivery_type text not null default 'standard';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.deliveries'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%delivery_type%'
  ) then
    alter table public.deliveries
      add constraint deliveries_delivery_type_check
      check (delivery_type in ('express', 'standard'));
  end if;
end $$;

-- ── rider_transactions (wallet ledger) ───────────────────────────────────────

create table if not exists public.rider_transactions (
  id           uuid primary key default uuid_generate_v4(),
  rider_id     uuid not null references public.rider_profiles(id) on delete cascade,
  type         text not null default 'earning'
                 check (type in ('earning', 'withdrawal', 'bonus', 'penalty')),
  amount       integer not null default 0,
  description  text,
  delivery_id  uuid references public.deliveries(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists rider_transactions_rider_idx
  on public.rider_transactions(rider_id, created_at desc);

-- ── rider_withdrawals ───────────────────────────────────────────────────────

create table if not exists public.rider_withdrawals (
  id             uuid primary key default uuid_generate_v4(),
  rider_id       uuid not null references public.rider_profiles(id) on delete cascade,
  amount         integer not null check (amount > 0),
  status         text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  method         text not null default 'mpesa',
  account_number text,
  created_at     timestamptz not null default now()
);

create index if not exists rider_withdrawals_rider_idx
  on public.rider_withdrawals(rider_id, created_at desc);

-- ── row level security ─────────────────────────────────────────────────────

alter table public.rider_transactions enable row level security;
alter table public.rider_withdrawals enable row level security;

drop policy if exists "Riders view own transactions" on public.rider_transactions;
create policy "Riders view own transactions"
on public.rider_transactions for select to authenticated
using (auth.uid() = rider_id);

drop policy if exists "Admins manage rider transactions" on public.rider_transactions;
create policy "Admins manage rider transactions"
on public.rider_transactions for all to authenticated
using (is_admin()) with check (is_admin());

drop policy if exists "Riders view own withdrawals" on public.rider_withdrawals;
create policy "Riders view own withdrawals"
on public.rider_withdrawals for select to authenticated
using (auth.uid() = rider_id);

drop policy if exists "Riders request withdrawals" on public.rider_withdrawals;
create policy "Riders request withdrawals"
on public.rider_withdrawals for insert to authenticated
with check (auth.uid() = rider_id);

drop policy if exists "Admins manage rider withdrawals" on public.rider_withdrawals;
create policy "Admins manage rider withdrawals"
on public.rider_withdrawals for all to authenticated
using (is_admin()) with check (is_admin());

-- ── the job board ──────────────────────────────────────────────────────────
-- A rider must be able to see deliveries that are waiting for a rider.

drop policy if exists "Riders can view unassigned deliveries" on public.deliveries;
create policy "Riders can view unassigned deliveries"
on public.deliveries for select to authenticated
using (status = 'pending_dispatch' and rider_id is null);

-- A rider working a delivery has to see the order behind it - that is where
-- the customer's name and address come from. The orders policy only let the
-- buyer, the seller and admins through, so the rider's job list came back
-- without any customer details.
--
-- It goes through a SECURITY DEFINER helper for the same reason as the
-- others: the orders and deliveries policies reference each other, so reading
-- one from the other directly would recurse.

create or replace function public.my_rider_order_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select d.order_id from public.deliveries d where d.rider_id = auth.uid()
$$;

revoke all on function public.my_rider_order_ids() from public;
grant execute on function public.my_rider_order_ids() to authenticated;

drop policy if exists "Buyers and sellers can read their orders" on public.orders;

create policy "Buyers and sellers can read their orders"
on public.orders
for select
to authenticated
using (
  buyer_id = auth.uid()
  or id in (select public.my_seller_order_ids())
  or id in (select public.my_rider_order_ids())
  or is_admin()
);

-- ── atomic claim ───────────────────────────────────────────────────────────
-- The row is locked FOR UPDATE, so only one rider can win the job.

create or replace function public.claim_delivery(p_delivery_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.deliveries%rowtype;
begin
  select * into v_row
  from public.deliveries
  where id = p_delivery_id
  for update;

  if not found then
    raise exception 'Delivery not found';
  end if;

  if v_row.status <> 'pending_dispatch' or v_row.rider_id is not null then
    raise exception 'Delivery is no longer available';
  end if;

  update public.deliveries
  set rider_id = auth.uid(),
      status = 'accepted',
      accepted_at = now()
  where id = p_delivery_id
  returning * into v_row;

  insert into public.rider_transactions (rider_id, type, amount, description, delivery_id)
  values (auth.uid(), 'earning', coalesce(v_row.delivery_fee, 0), 'Delivery accepted', v_row.id);

  return to_jsonb(v_row);
end;
$$;

grant execute on function public.claim_delivery(uuid) to authenticated;

-- ── Data API grants ────────────────────────────────────────────────────────

grant select on public.rider_transactions to anon;
grant select, insert, update, delete on public.rider_transactions to authenticated;
grant select, insert, update, delete on public.rider_transactions to service_role;

grant select on public.rider_withdrawals to anon;
grant select, insert, update, delete on public.rider_withdrawals to authenticated;
grant select, insert, update, delete on public.rider_withdrawals to service_role;

notify pgrst, 'reload schema';
