-- 028: rider wallet ledger - policy, and derive the balance from the ledger
--
-- Two problems with the rider wallet:
--
-- 1. rider_transactions had a SELECT policy and an admin policy but no
--    INSERT policy, so when api/delivery/update-status credited a delivery
--    the ledger insert was rejected by RLS. The wallet balance went up but
--    the transaction history stayed empty, and the "Mapato Jumla" total on
--    the wallet page did not match the balance.
--
--    The insert now runs as the service role from api/delivery/update-status,
--    which has already checked that the delivery belongs to the caller, so
--    riders still have no INSERT policy here. Giving them one would let a
--    rider write an "earning" row for any amount and have the balance
--    trigger credit it.
--
-- 2. rider_profiles had a blanket "Riders can update own profile" UPDATE
--    policy covering every column, including wallet_balance and
--    total_deliveries. A rider could set their own wallet balance to any
--    number with a single update. The balance is now derived from the
--    ledger instead, and a rider's direct write to it is overwritten with
--    the real sum.
--
-- The wallet balance is maintained by a trigger on the ledger:
--   insert a ledger row -> the balance and delivery count are recomputed
--   update a rider_profiles row -> the balance is recomputed from the ledger
-- so the two can never drift apart, and the ledger can only be written by
-- the server.

-- ── keep the balance in step with the ledger ──────────────────────────────

create or replace function public.recompute_rider_wallet_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only the ledger decides what the balance is. Whatever the row was
  -- trying to set is replaced with the sum of the rider's transactions.
  new.wallet_balance := coalesce((
    select sum(rt.amount)
    from public.rider_transactions rt
    where rt.rider_id = new.id
  ), 0);
  return new;
end;
$$;

drop trigger if exists rider_profiles_wallet_from_ledger on public.rider_profiles;
create trigger rider_profiles_wallet_from_ledger
before update on public.rider_profiles
for each row
execute function public.recompute_rider_wallet_balance();

create or replace function public.apply_rider_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rider_profiles rp
  set wallet_balance = coalesce((
         select sum(rt.amount)
         from public.rider_transactions rt
         where rt.rider_id = new.rider_id
       ), 0),
      total_deliveries = (
         select count(*)
         from public.rider_transactions rt
         where rt.rider_id = new.rider_id
           and rt.type = 'earning'
           and rt.delivery_id is not null
       ),
      updated_at = now()
  where rp.id = new.rider_id;

  return new;
end;
$$;

drop trigger if exists rider_transactions_apply on public.rider_transactions;
create trigger rider_transactions_apply
after insert on public.rider_transactions
for each row
execute function public.apply_rider_transaction();

notify pgrst, 'reload schema';
