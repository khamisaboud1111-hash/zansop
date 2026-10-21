-- 027: rider dashboard has to load the delivery the rider is already working on
--
-- useRiderTracking set activeDeliveryId only from a Supabase Realtime
-- postgres_changes event on the deliveries table. A realtime event fires when
-- a row changes, not when a page loads, so a rider who already had a job
-- accepted (or who simply refreshed the page) saw no trip at all: the
-- dashboard card stayed empty and the rider could not press "pick up" or
-- "delivered". The hook now reads the current delivery on mount as well,
-- and keeps realtime for live updates.
--
-- get_active_delivery_for_rider also did not return delivery_fee,
-- customer_name or customer_phone, which the dashboard's trip card renders,
-- so the rider never saw what they were being paid or who the customer was.
-- The return type changed, so the function has to be dropped and recreated
-- rather than replaced.

drop function if exists public.get_active_delivery_for_rider(uuid);

create function public.get_active_delivery_for_rider(p_rider_id uuid)
returns table(
  delivery_id uuid,
  status delivery_status,
  pickup_lat double precision,
  pickup_lng double precision,
  delivery_lat double precision,
  delivery_lng double precision,
  pickup_address text,
  delivery_address text,
  delivery_fee integer,
  customer_name text,
  customer_phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.id,
    d.status,
    st_y(d.pickup_location::geometry),
    st_x(d.pickup_location::geometry),
    case when d.delivery_location is not null then st_y(d.delivery_location::geometry) end,
    case when d.delivery_location is not null then st_x(d.delivery_location::geometry) end,
    d.pickup_address,
    d.delivery_address,
    coalesce(d.delivery_fee, 0),
    coalesce(o.delivery_name, bp.full_name, ''),
    coalesce(o.delivery_phone, bp.phone, '')
  from public.deliveries d
  left join public.orders o on o.id = d.order_id
  left join public.profiles bp on bp.id = o.buyer_id
  where d.rider_id = p_rider_id
    and d.status in ('accepted', 'picked_up')
  order by d.updated_at desc
  limit 1;
$$;

grant execute on function public.get_active_delivery_for_rider(uuid) to authenticated;

notify pgrst, 'reload schema';
