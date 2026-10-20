-- 021: payment webhook + rider metrics
--
-- Two RPCs the app calls were never created on the live database, and the
-- payment one had to be written against the live schema rather than
-- migration 008, because the live database uses different column and enum
-- names:
--
--   * orders tracks payment state with the boolean payment_confirmed, and has
--     no payment_status / payment_provider_reference / paid_at columns.
--   * payment_provider is an enum of (mpesa, airtel_money, tigo_pesa,
--     cash_on_delivery, manual) - there is no 'flutterwave'.
--   * payment_status is an enum of (initiated, pending, completed, failed,
--     cancelled, refunded) - there is no 'successful'.
--   * payment_transactions has provider_payload, not raw_payload, and has no
--     provider_transaction_id.
--
-- Without this, the Flutterwave callback route could never confirm a payment:
-- the RPC did not exist, and the columns it referenced did not exist either.
--
-- get_rider_metrics was also missing. The rider dashboard expects
-- todayEarnings / weekEarnings / monthEarnings / completedToday /
-- completedWeek / avgRating, so it is written against the live rider_profiles
-- and deliveries columns. Rider earnings are taken from deliveries.delivery_fee
-- because the live database has no rider_earnings table.

-- ── schema ────────────────────────────────────────────────────────────────

alter type public.payment_provider add value if not exists 'flutterwave';

alter table public.orders
  add column if not exists payment_provider_reference text;
alter table public.orders
  add column if not exists paid_at timestamptz;

alter table public.payment_transactions
  add column if not exists provider_transaction_id text;
alter table public.payment_transactions
  add column if not exists raw_payload jsonb;

create unique index if not exists payment_transactions_provider_tx_idx
  on public.payment_transactions(provider_transaction_id)
  where provider_transaction_id is not null;

-- ── process_payment_webhook ───────────────────────────────────────────────

create or replace function public.process_payment_webhook(
  p_provider text,
  p_provider_reference text,
  p_transaction_id text,
  p_status text,
  p_amount integer,
  p_currency text default 'TZS',
  p_raw_payload jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_order_id uuid;
  v_order record;
  v_txn_id uuid;
  v_already_processed boolean := false;
  v_new_status public.payment_status;
  v_provider public.payment_provider;
begin
  v_provider := case
    when p_provider in ('mpesa','airtel_money','tigo_pesa','cash_on_delivery','flutterwave')
      then p_provider::public.payment_provider
    else 'manual'::public.payment_provider
  end;

  v_new_status := case p_status
    when 'successful' then 'completed'::public.payment_status
    when 'completed'  then 'completed'::public.payment_status
    when 'failed'     then 'failed'::public.payment_status
    when 'cancelled'  then 'cancelled'::public.payment_status
    else 'pending'::public.payment_status
  end;

  -- Idempotency: one transaction row per provider transaction id
  select id into v_txn_id
  from payment_transactions
  where provider_transaction_id = p_transaction_id;

  if found then
    v_already_processed := true;
  end if;

  -- Match the order by the reference the app stored on it
  select id into v_order_id
  from orders
  where payment_reference = p_provider_reference
     or payment_provider_reference = p_provider_reference
  limit 1;

  if not found then
    raise exception 'Could not match payment to order: provider_reference=%', p_provider_reference;
  end if;

  select id, total_amount, payment_confirmed, status, buyer_id
  into v_order
  from orders
  where id = v_order_id;

  if v_order.payment_confirmed then
    return jsonb_build_object(
      'success', true,
      'already_processed', true,
      'order_id', v_order_id
    );
  end if;

  if v_order.total_amount <> p_amount then
    raise exception 'Amount mismatch: expected %, got %', v_order.total_amount, p_amount;
  end if;

  if v_already_processed then
    update payment_transactions
    set status = v_new_status,
        completed_at = case when v_new_status = 'completed' then now() else completed_at end,
        raw_payload = coalesce(p_raw_payload, raw_payload)
    where id = v_txn_id;
  else
    insert into payment_transactions (
      order_id, provider, provider_reference, provider_transaction_id,
      status, amount, currency, raw_payload, completed_at
    ) values (
      v_order_id, v_provider, p_provider_reference, p_transaction_id,
      v_new_status, p_amount, coalesce(p_currency, 'TZS'), p_raw_payload,
      case when v_new_status = 'completed' then now() else null end
    )
    returning id into v_txn_id;
  end if;

  if v_new_status = 'completed' then
    update orders
    set payment_confirmed = true,
        paid_at = now(),
        status = case when status = 'pending' then 'confirmed'::public.order_status else status end
    where id = v_order_id;
  elsif v_new_status in ('failed', 'cancelled') then
    update orders
    set status = case when status = 'pending' then 'cancelled'::public.order_status else status end
    where id = v_order_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'already_processed', v_already_processed,
    'order_id', v_order_id,
    'transaction_id', v_txn_id,
    'payment_status', v_new_status
  );
end;
$function$;

grant execute on function public.process_payment_webhook(text, text, text, text, integer, text, jsonb) to authenticated, service_role;

-- ── get_rider_metrics ─────────────────────────────────────────────────────

create or replace function public.get_rider_metrics(p_rider_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'todayEarnings', coalesce((select sum(d.delivery_fee) from deliveries d
        where d.rider_id = p_rider_id and d.status::text = 'delivered'
          and d.delivered_at >= date_trunc('day', now())), 0),
    'weekEarnings', coalesce((select sum(d.delivery_fee) from deliveries d
        where d.rider_id = p_rider_id and d.status::text = 'delivered'
          and d.delivered_at >= now() - interval '7 days'), 0),
    'monthEarnings', coalesce((select sum(d.delivery_fee) from deliveries d
        where d.rider_id = p_rider_id and d.status::text = 'delivered'
          and d.delivered_at >= now() - interval '30 days'), 0),
    'completedToday', coalesce((select count(*) from deliveries d
        where d.rider_id = p_rider_id and d.status::text = 'delivered'
          and d.delivered_at >= date_trunc('day', now())), 0),
    'completedWeek', coalesce((select count(*) from deliveries d
        where d.rider_id = p_rider_id and d.status::text = 'delivered'
          and d.delivered_at >= now() - interval '7 days'), 0),
    'avgRating', coalesce((select rp.rating_average from rider_profiles rp
        where rp.id = p_rider_id), 0),
    'ratingCount', coalesce((select count(*) from rider_reviews rr
        where rr.rider_id = p_rider_id), 0),
    'totalDeliveries', coalesce((select rp.total_deliveries from rider_profiles rp
        where rp.id = p_rider_id), 0),
    'walletBalance', coalesce((select rp.wallet_balance from rider_profiles rp
        where rp.id = p_rider_id), 0),
    'totalEarnings', coalesce((select sum(d.delivery_fee) from deliveries d
        where d.rider_id = p_rider_id and d.status::text = 'delivered'), 0),
    'pendingPayout', coalesce((select sum(d.delivery_fee) from deliveries d
        where d.rider_id = p_rider_id and d.status::text = 'delivered'), 0)
  ) into v_result;

  if v_result is null then
    return jsonb_build_object(
      'todayEarnings', 0, 'weekEarnings', 0, 'monthEarnings', 0,
      'completedToday', 0, 'completedWeek', 0, 'avgRating', 0,
      'ratingCount', 0, 'totalDeliveries', 0, 'walletBalance', 0,
      'totalEarnings', 0, 'pendingPayout', 0
    );
  end if;

  return v_result;
end;
$function$;

grant execute on function public.get_rider_metrics(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
