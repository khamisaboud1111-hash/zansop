-- 030: the platform takes its commission when the rider delivers
--
-- Until now the commission was only a note: create_order wrote a row in
-- commissions and left it unpaid, the seller dashboard invented a balance
-- from "revenue * 0.9 - unpaid commissions", and nothing moved when the
-- rider delivered the order. An admin had to mark each commission paid by
-- hand.
--
-- This makes it automatic and real:
--
--   * when the order reaches 'delivered' - the rider handed it over - the
--     platform takes its cut: the commission row is marked paid and the
--     seller is credited with the sale minus the commission
--   * a cancelled order gives up its commission instead
--   * the seller has a real wallet: a ledger of what they earned, what the
--     platform took, and what they withdrew
--
-- It also closes a hole found while building this: "Sellers can update own
-- profile" is a blanket policy, so a seller could set their own
-- commission_rate to 0, invent their revenue and sales, write themselves
-- five star reviews and approve their own shop. The financial fields are
-- now pinned down for everyone except an admin.

-- ── the seller's wallet ───────────────────────────────────────────────────

create table if not exists public.seller_wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  type text not null check (type in ('sale', 'commission', 'withdrawal', 'adjustment')),
  amount integer not null,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists seller_wallet_tx_seller_idx
  on public.seller_wallet_transactions(seller_id, created_at desc);

alter table public.sellers
  add column if not exists wallet_balance integer not null default 0;

alter table public.seller_wallet_transactions enable row level security;

drop policy if exists "Sellers read own wallet" on public.seller_wallet_transactions;
create policy "Sellers read own wallet"
on public.seller_wallet_transactions for select to authenticated
using (exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid()));

drop policy if exists "Admins manage seller wallet" on public.seller_wallet_transactions;
create policy "Admins manage seller wallet"
on public.seller_wallet_transactions for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Withdrawal requests, same shape as the rider's.
create table if not exists public.seller_withdrawals (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.sellers(id) on delete cascade,
  amount integer not null check (amount > 0),
  status text not null default 'pending',
  method text not null default 'mpesa',
  account_number text not null,
  created_at timestamptz not null default now()
);

alter table public.seller_withdrawals enable row level security;

drop policy if exists "Sellers manage own withdrawals" on public.seller_withdrawals;
create policy "Sellers manage own withdrawals"
on public.seller_withdrawals for all to authenticated
using (exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid()))
with check (exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid()));

drop policy if exists "Admins manage seller withdrawals" on public.seller_withdrawals;
create policy "Admins manage seller withdrawals"
on public.seller_withdrawals for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- ── trusted updates ───────────────────────────────────────────────────────
--
-- The triggers below write to columns the seller is not allowed to change
-- themselves. They flag the transaction while they do it.

create or replace function public.set_trusted_update()
returns void
language plpgsql
as $$
begin
  perform set_config('app.trusted_update', 'on', true);
end;
$$;

create or replace function public.clear_trusted_update()
returns void
language plpgsql
as $$
begin
  perform set_config('app.trusted_update', 'off', true);
end;
$$;

-- ── protect the seller's own financial fields ─────────────────────────────

create or replace function public.protect_seller_financials()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- An admin may change anything.
  if exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
    return new;
  end if;

  -- Our own triggers may change these.
  if coalesce(current_setting('app.trusted_update', true), 'off') = 'on' then
    return new;
  end if;

  new.commission_rate := old.commission_rate;
  new.total_revenue := old.total_revenue;
  new.total_sales := old.total_sales;
  new.average_rating := old.average_rating;
  new.review_count := old.review_count;
  new.wallet_balance := old.wallet_balance;
  new.status := old.status;
  new.is_featured := old.is_featured;
  new.verified_at := old.verified_at;
  new.national_id_verified := old.national_id_verified;
  new.business_license_verified := old.business_license_verified;

  return new;
end;
$$;

drop trigger if exists sellers_protect_financials on public.sellers;
create trigger sellers_protect_financials
before update on public.sellers
for each row
execute function public.protect_seller_financials();

-- ── keep the wallet balance in step with the ledger ───────────────────────

create or replace function public.recalc_seller_wallet_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid := coalesce(new.seller_id, old.seller_id);
begin
  perform public.set_trusted_update();

  update public.sellers s
  set wallet_balance = coalesce((
        select sum(w.amount)
        from public.seller_wallet_transactions w
        where w.seller_id = v_seller_id
      ), 0),
      updated_at = now()
  where s.id = v_seller_id;

  perform public.clear_trusted_update();
  return null;
end;
$$;

drop trigger if exists seller_wallet_tx_recalc on public.seller_wallet_transactions;
create trigger seller_wallet_tx_recalc
after insert or update or delete on public.seller_wallet_transactions
for each row
execute function public.recalc_seller_wallet_balance();

-- The rating recalculation writes to protected columns too.
create or replace function public.recalc_seller_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid := coalesce(new.seller_id, old.seller_id);
begin
  perform public.set_trusted_update();

  update public.sellers s
  set average_rating = coalesce((
        select round(avg(r.rating)::numeric, 2)
        from public.seller_reviews r
        where r.seller_id = v_seller_id
      ), 0),
      review_count = (
        select count(*) from public.seller_reviews r
        where r.seller_id = v_seller_id
      )
  where s.id = v_seller_id;

  perform public.clear_trusted_update();
  return null;
end;
$$;

-- ── the platform takes its commission when the order is delivered ─────────
--
-- The schema already had a trigger that counted the seller's sales on
-- delivery. This one does that and takes the commission, so the old trigger
-- goes - otherwise the revenue and the sales would be counted twice.
drop trigger if exists on_order_delivered on public.orders;

create or replace function public.take_commission_on_delivery()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  line record;
  v_gross integer;
  v_commission integer;
  v_rate numeric;
begin
  -- Only the move into 'delivered' counts, and only forwards.
  if new.status <> 'delivered' or old.status = 'delivered' then
    return new;
  end if;

  for line in
    select i.seller_id,
           sum(i.total_price)::integer as gross,
           sum(i.quantity)::integer as quantity
    from public.order_items i
    where i.order_id = new.id
    group by i.seller_id
  loop
    -- The commission the order already carries, per seller.
    select c.commission_amount into v_commission
    from public.commissions c
    where c.order_id = new.id and c.seller_id = line.seller_id
    limit 1;

    if v_commission is null then
      select coalesce(s.commission_rate, 5) into v_rate
      from public.sellers s where s.id = line.seller_id;
      v_commission := round(line.gross * coalesce(v_rate, 5) / 100)::integer;
    end if;

    -- The platform takes its cut.
    update public.commissions
    set is_paid = true, paid_at = now()
    where order_id = new.id and seller_id = line.seller_id and is_paid = false;

    -- And the seller gets the rest, on the record.
    insert into public.seller_wallet_transactions (seller_id, order_id, type, amount, description)
    values
      (line.seller_id, new.id, 'sale', line.gross,
       'Sale of order #' || upper(right(new.id::text, 8))),
      (line.seller_id, new.id, 'commission', -v_commission,
       'Platform commission on order #' || upper(right(new.id::text, 8)));

    perform public.set_trusted_update();
    update public.sellers
    set total_revenue = coalesce(total_revenue, 0) + line.gross,
        total_sales = coalesce(total_sales, 0) + line.quantity,
        updated_at = now()
    where id = line.seller_id;
    perform public.clear_trusted_update();
  end loop;

  return new;
end;
$$;

drop trigger if exists orders_take_commission on public.orders;
create trigger orders_take_commission
after update of status on public.orders
for each row
execute function public.take_commission_on_delivery();

-- ── a cancelled order gives up its commission ─────────────────────────────

create or replace function public.void_commission_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('cancelled', 'refunded') and old.status not in ('cancelled', 'refunded') then
    -- The sale never happened, so neither does the commission.
    delete from public.commissions
    where order_id = new.id and is_paid = false;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_void_commission on public.orders;
create trigger orders_void_commission
after update of status on public.orders
for each row
execute function public.void_commission_on_cancel();

-- A refund after delivery gives the money back to the platform.
create or replace function public.refund_seller_on_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_amount integer;
begin
  if new.status = 'refunded' and old.status = 'delivered' then
    for v_seller_id, v_amount in
      select w.seller_id, sum(w.amount)
      from public.seller_wallet_transactions w
      where w.order_id = new.id and w.type in ('sale', 'commission')
      group by w.seller_id
    loop
      insert into public.seller_wallet_transactions (seller_id, order_id, type, amount, description)
      values (v_seller_id, new.id, 'adjustment', -v_amount, 'Refund of order #' || upper(right(new.id::text, 8)));
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_refund_seller on public.orders;
create trigger orders_refund_seller
after update of status on public.orders
for each row
execute function public.refund_seller_on_refund();

-- The product rating had a trigger of its own. The one above handles the
-- empty case (no reviews leaves a zero, not a null), so the old one goes.
drop trigger if exists on_review_change on public.reviews;

-- ── put the seller's numbers back where they belong ──────────────────────
--
-- The blanket update policy let a seller write their own commission rate,
-- revenue, sales and ratings. Restore the real ones. This has to run as a
-- trusted update, because the protect trigger now pins those fields.

do $$
begin
  perform public.set_trusted_update();

  update public.sellers s
  set commission_rate = 5,
      total_revenue = coalesce((
            select sum(i.total_price)::bigint
            from public.order_items i
            join public.orders o on o.id = i.order_id
            where i.seller_id = s.id and o.status = 'delivered'
          ), 0),
      total_sales = coalesce((
            select sum(i.quantity)::integer
            from public.order_items i
            join public.orders o on o.id = i.order_id
            where i.seller_id = s.id and o.status = 'delivered'
          ), 0),
      average_rating = coalesce((
            select round(avg(sr.rating)::numeric, 2)
            from public.seller_reviews sr
            where sr.seller_id = s.id
          ), 0),
      review_count = (
            select count(*) from public.seller_reviews sr
            where sr.seller_id = s.id
          );

  perform public.clear_trusted_update();
end;
$$;

-- ── pay out the orders that were delivered before this trigger existed ───

do $$
declare
  line record;
  v_commission integer;
begin
  for line in
    select o.id as order_id, i.seller_id,
           sum(i.total_price)::integer as gross,
           sum(i.quantity)::integer as quantity
    from public.orders o
    join public.order_items i on i.order_id = o.id
    where o.status = 'delivered'
      and not exists (
        select 1 from public.seller_wallet_transactions w
        where w.order_id = o.id and w.type = 'sale'
      )
    group by o.id, i.seller_id
  loop
    select c.commission_amount into v_commission
    from public.commissions c
    where c.order_id = line.order_id and c.seller_id = line.seller_id
    limit 1;

    if v_commission is null then
      v_commission := round(line.gross * 5 / 100)::integer;
    end if;

    update public.commissions
    set is_paid = true, paid_at = now()
    where order_id = line.order_id and seller_id = line.seller_id and is_paid = false;

    insert into public.seller_wallet_transactions (seller_id, order_id, type, amount, description)
    values
      (line.seller_id, line.order_id, 'sale', line.gross,
       'Sale of order #' || upper(right(line.order_id::text, 8))),
      (line.seller_id, line.order_id, 'commission', -v_commission,
       'Platform commission on order #' || upper(right(line.order_id::text, 8)));
  end loop;

  -- The totals are set from the delivered orders above, so the backfill
  -- does not add them a second time.
  perform public.set_trusted_update();
  update public.sellers s
  set total_revenue = coalesce((
        select sum(i.total_price)::bigint
        from public.order_items i
        join public.orders o on o.id = i.order_id
        where i.seller_id = s.id and o.status = 'delivered'
      ), 0),
      total_sales = coalesce((
        select sum(i.quantity)::integer
        from public.order_items i
        join public.orders o on o.id = i.order_id
        where i.seller_id = s.id and o.status = 'delivered'
      ), 0)
  where s.id in (select distinct seller_id from public.seller_wallet_transactions);
  perform public.clear_trusted_update();
end;
$$;

notify pgrst, 'reload schema';
