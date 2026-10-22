-- 031: an order only moves forward
--
-- The status update routes took whatever status the seller asked for, and
-- the database had no rule of its own, so a seller could:
--
--   * mark an order delivered without a rider ever delivering it, which
--     made the platform take its commission and pay the seller for a trip
--     that never happened
--   * walk a delivered order back to packed
--   * cancel a delivered order
--
-- The rule is enforced in the database, where it cannot be bypassed by
-- writing to the REST API directly instead of going through the app.
--
--   pending -> confirmed -> packed -> out_for_delivery -> delivered
--
-- Cancelling is allowed from any live status. 'delivered' is only allowed
-- once a rider has actually delivered the order. Admins and the service
-- role are not restricted.

create or replace function public.guard_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := false;
  v_next order_status;
begin
  -- The service role and the admins manage orders as they please.
  if current_setting('role', true) = 'service_role' then
    return new;
  end if;

  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') into v_is_admin;
  if v_is_admin then
    return new;
  end if;

  -- Cancelling is allowed from any live status, but not from a finished one.
  if new.status = 'cancelled' then
    if old.status in ('delivered', 'refunded', 'cancelled') then
      raise exception 'This order is already finished (%)', old.status;
    end if;
    return new;
  end if;

  v_next := case old.status
    when 'pending' then 'confirmed'
    when 'confirmed' then 'packed'
    when 'packed' then 'out_for_delivery'
    when 'out_for_delivery' then 'delivered'
  end;

  if v_next is null then
    raise exception 'An order in state % cannot be moved', old.status;
  end if;

  if new.status <> v_next then
    raise exception 'An order only moves forward: % -> %', old.status, new.status;
  end if;

  -- The rider has to have handed the order over before the order counts as
  -- delivered, or the platform would pay out for a delivery that never
  -- happened.
  if new.status = 'delivered' and not exists (
    select 1 from public.deliveries d
    where d.order_id = new.id and d.status = 'delivered'
  ) then
    raise exception 'The rider has not delivered this order yet';
  end if;

  return new;
end;
$$;

drop trigger if exists orders_guard_status on public.orders;
create trigger orders_guard_status
before update of status on public.orders
for each row
execute function public.guard_order_status_change();

notify pgrst, 'reload schema';
