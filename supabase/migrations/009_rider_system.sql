-- ============================================================
-- Duka Janja — Migration 009: Complete Rider System
-- Creates rider profiles, deliveries, reviews, and status tables
-- Run AFTER 001-008
-- ============================================================

-- Rider profiles
create table if not exists rider_profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references profiles(id) on delete cascade,
  full_name       text not null,
  phone           text not null,
  emergency_name  text not null,
  emergency_phone text not null,
  vehicle_type    text not null check (vehicle_type in ('boda', 'car', 'tricycle')),
  vehicle_reg     text not null,
  license_number  text not null,
  license_expiry  date not null,
  id_doc_url      text not null,
  license_doc_url text not null,
  selfie_url      text not null,
  status          text not null default 'pending' check (status in ('pending', 'approved', 'suspended', 'rejected')),
  is_online       boolean not null default false,
  current_lat     numeric(10, 8),
  current_lng     numeric(11, 8),
  last_location_at timestamptz,
  rating          numeric(3,2) default 0,
  total_deliveries integer default 0,
  total_earnings  bigint default 0,
  wallet_balance  bigint default 0,
  verified_at     timestamptz,
  rejected_reason text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists rider_profiles_status_idx on rider_profiles(status);
create index if not exists rider_profiles_online_idx on rider_profiles(is_online) where is_online = true;
create index if not exists rider_profiles_location_idx on rider_profiles(current_lat, current_lng) where is_online = true;

-- Rider documents (for verification)
create table if not exists rider_documents (
  id           uuid primary key default uuid_generate_v4(),
  rider_id     uuid not null references rider_profiles(id) on delete cascade,
  doc_type     text not null check (doc_type in ('id_card', 'license', 'vehicle_reg', 'selfie')),
  file_url     text not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_id  uuid,
  reviewer_note text,
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);

-- Deliveries
create table if not exists deliveries (
  id                    uuid primary key default uuid_generate_v4(),
  order_id              uuid not null references orders(id) on delete cascade,
  rider_id              uuid references rider_profiles(id) on delete set null,
  status                text not null default 'pending' check (status in ('pending', 'offered', 'accepted', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'expired')),
  pickup_lat            numeric(10, 8) not null,
  pickup_lng            numeric(11, 8) not null,
  pickup_address        text not null,
  dropoff_lat           numeric(10, 8) not null,
  dropoff_lng           numeric(11, 8) not null,
  dropoff_address       text not null,
  distance_km           numeric(6, 2),
  estimated_duration_min integer,
  fee                   integer not null default 0,
  rider_fee             integer not null default 0,
  platform_fee          integer not null default 0,
  offered_at            timestamptz,
  accepted_at           timestamptz,
  picked_up_at          timestamptz,
  out_for_delivery_at   timestamptz,
  delivered_at          timestamptz,
  cancelled_at          timestamptz,
  cancel_reason         text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists deliveries_rider_status_idx on deliveries(rider_id, status) where status in ('offered', 'accepted', 'picked_up', 'out_for_delivery');
create index if not exists deliveries_order_idx on deliveries(order_id);
create index if not exists deliveries_status_idx on deliveries(status) where status in ('offered', 'accepted');
create index if not exists deliveries_rider_online_idx on deliveries(rider_id) where status in ('offered', 'accepted', 'picked_up', 'out_for_delivery');

-- Rider reviews
create table if not exists rider_reviews (
  id              uuid primary key default uuid_generate_v4(),
  delivery_id     uuid not null unique references deliveries(id) on delete cascade,
  buyer_id        uuid not null references profiles(id) on delete cascade,
  rider_id        uuid not null references rider_profiles(id) on delete cascade,
  rating          integer not null check (rating between 1 and 5),
  comment         text,
  created_at      timestamptz not null default now()
);

-- Rider public status (for live tracking)
create table if not exists rider_public_status (
  rider_id     uuid primary key references rider_profiles(id) on delete cascade,
  is_online    boolean not null default false,
  is_available boolean not null default false,
  current_lat  numeric(10, 8),
  current_lng  numeric(11, 8),
  last_update  timestamptz not null default now(),
  current_delivery_id uuid references deliveries(id) on delete set null
);

-- Rider earnings (payouts)
create table if not exists rider_earnings (
  id              uuid primary key default uuid_generate_v4(),
  rider_id        uuid not null references rider_profiles(id) on delete cascade,
  delivery_id     uuid not null references deliveries(id) on delete cascade,
  amount          integer not null,
  platform_fee    integer not null default 0,
  net_amount      integer not null,
  status          text not null default 'pending' check (status in ('pending', 'available', 'paid_out')),
  paid_out_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists rider_earnings_rider_status_idx on rider_earnings(rider_id, status);

-- RLS Policies
alter table rider_profiles enable row level security;
alter table rider_documents enable row level security;
alter table deliveries enable row level security;
alter table rider_reviews enable row level security;
alter table rider_public_status enable row level security;
alter table rider_earnings enable row level security;

-- Rider profiles: rider sees own, admin sees all
create policy "Riders can view own profile" on rider_profiles for select using (user_id = auth.uid() or is_admin());
create policy "Riders can update own profile" on rider_profiles for update using (user_id = auth.uid());
create policy "Admins can insert riders" on rider_profiles for insert with check (is_admin());

-- Documents
create policy "Riders can view own documents" on rider_documents for select using (
  rider_id in (select id from rider_profiles where user_id = auth.uid()) or is_admin()
);
create policy "Riders can insert own documents" on rider_documents for insert with check (
  rider_id in (select id from rider_profiles where user_id = auth.uid())
);
create policy "Admins can manage documents" on rider_documents for all using (is_admin()) with check (is_admin());

-- Deliveries: buyer, seller, rider, admin can see
create policy "Delivery participants can view" on deliveries for select using (
  is_admin() or
  rider_id = (select id from rider_profiles where user_id = auth.uid()) or
  order_id in (select id from orders where buyer_id = auth.uid()) or
  order_id in (select o.id from orders o join order_items oi on o.id = oi.order_id join products p on oi.product_id = p.id where p.seller_id in (select id from sellers where user_id = auth.uid()))
);
create policy "Riders can update own deliveries" on deliveries for update using (
  rider_id = (select id from rider_profiles where user_id = auth.uid())
);
create policy "Admins can manage deliveries" on deliveries for all using (is_admin()) with check (is_admin());

-- Reviews: buyer and rider can view, buyer can create
create policy "Participants can view rider reviews" on rider_reviews for select using (
  buyer_id = auth.uid() or rider_id = (select id from rider_profiles where user_id = auth.uid()) or is_admin()
);
create policy "Buyers can create reviews" on rider_reviews for insert with check (
  buyer_id = auth.uid() and delivery_id in (select id from deliveries where status = 'delivered' and order_id in (select id from orders where buyer_id = auth.uid()))
);

-- Public status: rider and admin can update, everyone can read for active deliveries
create policy "Public can view active rider status" on rider_public_status for select using (
  is_online = true and is_available = true
);
create policy "Riders can update own status" on rider_public_status for update using (
  rider_id = (select id from rider_profiles where user_id = auth.uid())
);
create policy "Admins can manage public status" on rider_public_status for all using (is_admin()) with check (is_admin());

-- Earnings: rider and admin
create policy "Riders can view own earnings" on rider_earnings for select using (
  rider_id = (select id from rider_profiles where user_id = auth.uid()) or is_admin()
);

-- Grant execute on RPCs
grant execute on function find_nearest_available_rider(numeric, numeric, integer) to authenticated;
grant execute on function get_rider_metrics(uuid) to authenticated;
grant execute on function get_active_delivery_for_rider(uuid) to authenticated;
grant execute on function list_online_riders(numeric, numeric, integer) to authenticated;
grant execute on function get_active_delivery_for_order(uuid) to authenticated;
-- Data API grants.
-- Supabase stops auto-granting Data API access to new public tables on
-- 2026-10-30, so every table this migration creates is granted explicitly.
-- Without these the API answers 'permission denied' and the app breaks on
-- fresh projects, preview branches and 'supabase db reset'.
grant select on public.rider_profiles to anon;
grant select, insert, update, delete on public.rider_profiles to authenticated;
grant select, insert, update, delete on public.rider_profiles to service_role;
grant select on public.rider_documents to anon;
grant select, insert, update, delete on public.rider_documents to authenticated;
grant select, insert, update, delete on public.rider_documents to service_role;
grant select on public.deliveries to anon;
grant select, insert, update, delete on public.deliveries to authenticated;
grant select, insert, update, delete on public.deliveries to service_role;
grant select on public.rider_reviews to anon;
grant select, insert, update, delete on public.rider_reviews to authenticated;
grant select, insert, update, delete on public.rider_reviews to service_role;
grant select on public.rider_public_status to anon;
grant select, insert, update, delete on public.rider_public_status to authenticated;
grant select, insert, update, delete on public.rider_public_status to service_role;
grant select on public.rider_earnings to anon;
grant select, insert, update, delete on public.rider_earnings to authenticated;
grant select, insert, update, delete on public.rider_earnings to service_role;

