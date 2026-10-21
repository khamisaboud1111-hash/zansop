-- ============================================================
-- Duka Janja — Migration 006: Rider Profiles & Deliveries
-- Run AFTER 001_initial_schema.sql through 005_create_order_rpc.sql
-- ============================================================

-- ─── RIDER ROLE ─────────────────────────────────────────────────────────────

-- Extend user_role enum to include 'rider'
alter type user_role add value if not exists 'rider' after 'admin';

-- ─── RIDER PROFILES ────────────────────────────────────────────────────────

create table if not exists rider_profiles (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid not null unique references profiles(id) on delete cascade,
  national_id            text not null,
  driving_license        text not null,
  motorcycle_registration text not null,
  emergency_contact      text not null,
  payout_method          text not null default 'mobile_money',
  payout_account_number  text not null,
  selfie_url             text,
  license_scan_url       text,
  is_verified            boolean not null default false,
  is_online              boolean not null default false,
  account_status         text not null default 'active' check (account_status in ('active', 'suspended')),
  rating_average         numeric(3,2) not null default 0,
  total_deliveries       integer not null default 0,
  current_lat            numeric(9,6),
  current_lng            numeric(9,6),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table rider_profiles enable row level security;

create policy "Riders view own profile" on rider_profiles for select
  using (auth.uid() = user_id);
create policy "Riders update own profile" on rider_profiles for update
  using (auth.uid() = user_id);
create policy "Riders can create own profile" on rider_profiles for insert
  with check (auth.uid() = user_id);
create policy "Admins manage all rider profiles" on rider_profiles for all
  using (is_admin());

create index if not exists rider_profiles_user_idx on rider_profiles(user_id);
create index if not exists rider_profiles_online_idx on rider_profiles(is_online) where is_online = true;

-- ─── DELIVERIES ────────────────────────────────────────────────────────────

create type delivery_status as enum (
  'pending_dispatch', 'accepted', 'picked_up',
  'in_transit', 'delivered', 'failed', 'cancelled'
);

create table if not exists deliveries (
  id               uuid primary key default uuid_generate_v4(),
  order_id         uuid not null references orders(id) on delete cascade,
  rider_id         uuid references rider_profiles(id) on delete set null,
  status           delivery_status not null default 'pending_dispatch',
  pickup_location  jsonb,           -- { "type": "Point", "coordinates": [lng, lat] }
  delivery_location jsonb,
  pickup_lat       numeric(9,6),
  pickup_lng       numeric(9,6),
  delivery_lat     numeric(9,6),
  delivery_lng     numeric(9,6),
  picked_up_at     timestamptz,
  delivered_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table deliveries enable row level security;

create policy "Admins manage all deliveries" on deliveries for all using (is_admin());
create policy "Riders view assigned deliveries" on deliveries for select
  using (rider_id in (select id from rider_profiles where user_id = auth.uid()));
create policy "Riders update assigned deliveries" on deliveries for update
  using (rider_id in (select id from rider_profiles where user_id = auth.uid()));
create policy "Buyers view own deliveries" on deliveries for select
  using (order_id in (select id from orders where buyer_id = auth.uid()));

create index if not exists deliveries_order_idx on deliveries(order_id);
create index if not exists deliveries_rider_idx on deliveries(rider_id);
create index if not exists deliveries_status_idx on deliveries(status);

-- ─── RPC: list_online_riders ────────────────────────────────────────────────

create or replace function list_online_riders()
returns table (
  rider_id            uuid,
  full_name           text,
  lat                 numeric,
  lng                 numeric,
  is_verified         boolean,
  rating_average      numeric,
  total_deliveries    integer,
  active_delivery_id  uuid,
  active_delivery_status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    rp.id as rider_id,
    p.full_name,
    rp.current_lat as lat,
    rp.current_lng as lng,
    rp.is_verified,
    rp.rating_average,
    rp.total_deliveries,
    d.id as active_delivery_id,
    d.status::text as active_delivery_status
  from rider_profiles rp
  join profiles p on p.id = rp.user_id
  left join deliveries d on d.rider_id = rp.id and d.status not in ('delivered', 'failed', 'cancelled')
  where rp.is_online = true
    and rp.is_verified = true
    and rp.account_status = 'active'
  order by rp.updated_at desc;
end;
$$;

grant execute on function list_online_riders() to authenticated;

-- Data API grants.
-- Supabase stops auto-granting Data API access to new public tables on
-- 2026-10-30, so every table this migration creates is granted explicitly.
-- Without these the API answers 'permission denied' and the app breaks on
-- fresh projects, preview branches and 'supabase db reset'.
grant select on public.rider_profiles to anon;
grant select, insert, update, delete on public.rider_profiles to authenticated;
grant select, insert, update, delete on public.rider_profiles to service_role;
grant select on public.deliveries to anon;
grant select, insert, update, delete on public.deliveries to authenticated;
grant select, insert, update, delete on public.deliveries to service_role;

