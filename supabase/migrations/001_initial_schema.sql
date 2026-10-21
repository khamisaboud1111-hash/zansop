-- ============================================================
-- Duka Janja — Full Database Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── ENUMS ────────────────────────────────────────────────────────────────────

create type user_role as enum ('buyer', 'seller', 'admin');
create type seller_status as enum ('pending', 'approved', 'suspended');
create type product_status as enum ('draft', 'active', 'out_of_stock', 'rejected');
create type order_status as enum (
  'pending', 'confirmed', 'packed',
  'out_for_delivery', 'delivered', 'cancelled', 'refunded'
);
create type delivery_zone as enum (
  'stone_town', 'north_zanzibar', 'south_zanzibar',
  'east_zanzibar', 'west_zanzibar', 'pemba_island'
);
create type notification_type as enum (
  'order_placed', 'order_confirmed', 'order_packed',
  'order_out_for_delivery', 'order_delivered', 'order_cancelled',
  'new_review', 'seller_approved', 'seller_suspended',
  'product_approved', 'product_rejected', 'low_stock', 'payment_received'
);

-- ─── PROFILES ─────────────────────────────────────────────────────────────────

create table profiles (
  id                uuid primary key references auth.users on delete cascade,
  email             text not null,
  full_name         text not null default '',
  phone             text,
  avatar_url        text,
  role              user_role not null default 'buyer',
  preferred_language text not null default 'sw' check (preferred_language in ('en', 'sw')),
  delivery_zone     delivery_zone,
  delivery_address  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────

create table categories (
  id          uuid primary key default uuid_generate_v4(),
  name_en     text not null,
  name_sw     text not null,
  slug        text not null unique,
  icon        text not null default '🛍️',
  parent_id   uuid references categories(id) on delete set null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ─── DELIVERY ZONE CONFIG ─────────────────────────────────────────────────────

create table delivery_zones (
  zone            delivery_zone primary key,
  name_en         text not null,
  name_sw         text not null,
  fee             integer not null,  -- TZS
  estimated_days  integer not null default 1
);

insert into delivery_zones values
  ('stone_town',     'Stone Town',          'Stone Town (Mji Mkongwe)', 2000,  1),
  ('north_zanzibar', 'North Zanzibar',      'Kaskazini Unguja',         4000,  1),
  ('south_zanzibar', 'South Zanzibar',      'Kusini Unguja',            4000,  1),
  ('east_zanzibar',  'East Zanzibar',       'Mashariki Unguja',         5000,  2),
  ('west_zanzibar',  'West Zanzibar',       'Magharibi Unguja',         3500,  1),
  ('pemba_island',   'Pemba Island',        'Kisiwa cha Pemba',         15000, 3);

-- ─── SELLERS ──────────────────────────────────────────────────────────────────

create table sellers (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null unique references profiles(id) on delete cascade,
  store_name       text not null,
  store_slug       text not null unique,
  description      text,
  logo_url         text,
  banner_url       text,
  whatsapp_number  text not null,
  status           seller_status not null default 'pending',
  commission_rate  numeric(4,2) not null default 5.00,
  total_sales      integer not null default 0,
  total_revenue    bigint not null default 0,
  average_rating   numeric(3,2) not null default 0,
  review_count     integer not null default 0,
  is_featured      boolean not null default false,
  verified_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─── PRODUCTS ─────────────────────────────────────────────────────────────────

create table products (
  id                   uuid primary key default uuid_generate_v4(),
  seller_id            uuid not null references sellers(id) on delete cascade,
  category_id          uuid not null references categories(id),
  name                 text not null,
  slug                 text not null unique,
  description          text not null default '',
  price                integer not null,  -- TZS, store as integer (no decimals)
  compare_at_price     integer,
  stock_quantity       integer not null default 0,
  sku                  text,
  weight_grams         integer,
  status               product_status not null default 'draft',
  is_made_in_zanzibar  boolean not null default false,
  tags                 text[] not null default '{}',
  average_rating       numeric(3,2) not null default 0,
  review_count         integer not null default 0,
  total_sold           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table product_images (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  url         text not null,
  sort_order  integer not null default 0,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Only one primary image per product
create unique index product_images_primary_idx
  on product_images (product_id)
  where is_primary = true;

-- ─── ORDERS ───────────────────────────────────────────────────────────────────

create table orders (
  id                  uuid primary key default uuid_generate_v4(),
  buyer_id            uuid not null references profiles(id),
  status              order_status not null default 'pending',
  subtotal            integer not null,
  delivery_fee        integer not null,
  commission_amount   integer not null default 0,
  total_amount        integer not null,
  delivery_zone       delivery_zone not null,
  delivery_address    text not null,
  delivery_name       text not null,
  delivery_phone      text not null,
  payment_method      text not null,
  payment_reference   text,
  payment_confirmed   boolean not null default false,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid not null references products(id),
  seller_id   uuid not null references sellers(id),
  quantity    integer not null check (quantity > 0),
  unit_price  integer not null,
  total_price integer not null,
  created_at  timestamptz not null default now()
);

create table order_tracking (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references orders(id) on delete cascade,
  status      order_status not null,
  note        text,
  created_at  timestamptz not null default now(),
  created_by  uuid not null references profiles(id)
);

-- ─── COMMISSIONS ──────────────────────────────────────────────────────────────

create table commissions (
  id                uuid primary key default uuid_generate_v4(),
  order_id          uuid not null references orders(id),
  seller_id         uuid not null references sellers(id),
  order_amount      integer not null,
  commission_rate   numeric(4,2) not null,
  commission_amount integer not null,
  is_paid           boolean not null default false,
  paid_at           timestamptz,
  created_at        timestamptz not null default now()
);

-- ─── REVIEWS ──────────────────────────────────────────────────────────────────

create table reviews (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid not null references products(id) on delete cascade,
  buyer_id      uuid not null references profiles(id),
  order_id      uuid not null references orders(id),
  rating        integer not null check (rating between 1 and 5),
  comment       text,
  seller_reply  text,
  created_at    timestamptz not null default now(),
  unique (product_id, buyer_id, order_id)
);

-- Auto-update product average_rating when review is inserted/updated/deleted
create or replace function update_product_rating()
returns trigger language plpgsql as $$
begin
  update products set
    average_rating = (select avg(rating)::numeric(3,2) from reviews where product_id = coalesce(new.product_id, old.product_id)),
    review_count   = (select count(*) from reviews where product_id = coalesce(new.product_id, old.product_id))
  where id = coalesce(new.product_id, old.product_id);
  return null;
end;
$$;

create trigger on_review_change
  after insert or update or delete on reviews
  for each row execute procedure update_product_rating();

-- ─── WISHLIST ─────────────────────────────────────────────────────────────────

create table wishlists (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

create table notifications (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references profiles(id) on delete cascade,
  type      notification_type not null,
  title_en  text not null,
  title_sw  text not null,
  body_en   text not null,
  body_sw   text not null,
  is_read   boolean not null default false,
  link      text,
  created_at timestamptz not null default now()
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

create index products_seller_idx       on products(seller_id);
create index products_category_idx     on products(category_id);
create index products_status_idx       on products(status);
create index products_slug_idx         on products(slug);
create index orders_buyer_idx          on orders(buyer_id);
create index orders_status_idx         on orders(status);
create index order_items_order_idx     on order_items(order_id);
create index order_items_seller_idx    on order_items(seller_id);
create index reviews_product_idx       on reviews(product_id);
create index notifications_user_idx    on notifications(user_id, is_read);
create index wishlists_user_idx        on wishlists(user_id);
create index commissions_seller_idx    on commissions(seller_id, is_paid);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

alter table profiles           enable row level security;
alter table sellers            enable row level security;
alter table products           enable row level security;
alter table product_images     enable row level security;
alter table orders             enable row level security;
alter table order_items        enable row level security;
alter table order_tracking     enable row level security;
alter table reviews            enable row level security;
alter table wishlists          enable row level security;
alter table notifications      enable row level security;
alter table commissions        enable row level security;
alter table categories         enable row level security;
alter table delivery_zones     enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean language sql security definer as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Profiles
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Categories & delivery zones (public read)
create policy "Categories are public" on categories for select using (true);
create policy "Delivery zones are public" on delivery_zones for select using (true);

-- Sellers (public read approved; owners can update own)
create policy "Approved sellers are public" on sellers for select
  using (status = 'approved' or auth.uid() = user_id or is_admin());
create policy "Sellers can update own store" on sellers for update
  using (auth.uid() = user_id);
create policy "Users can create seller application" on sellers for insert
  with check (auth.uid() = user_id);
create policy "Admins can manage sellers" on sellers for all using (is_admin());

-- Products
create policy "Active products are public" on products for select
  using (status = 'active' or seller_id in (select id from sellers where user_id = auth.uid()) or is_admin());
create policy "Sellers can manage own products" on products for all
  using (seller_id in (select id from sellers where user_id = auth.uid()));
create policy "Admins can manage all products" on products for all using (is_admin());

-- Product images
create policy "Product images are public" on product_images for select using (true);
create policy "Sellers can manage own product images" on product_images for all
  using (product_id in (select id from products where seller_id in (select id from sellers where user_id = auth.uid())));

-- Orders
create policy "Buyers can view own orders" on orders for select
  using (auth.uid() = buyer_id);
create policy "Buyers can create orders" on orders for insert
  with check (auth.uid() = buyer_id);
create policy "Sellers can view orders containing their products" on orders for select
  using (id in (select order_id from order_items where seller_id in (select id from sellers where user_id = auth.uid())));
create policy "Admins can manage all orders" on orders for all using (is_admin());

-- Order items
create policy "Buyers can view own order items" on order_items for select
  using (order_id in (select id from orders where buyer_id = auth.uid()));
create policy "Sellers can view own order items" on order_items for select
  using (seller_id in (select id from sellers where user_id = auth.uid()));
create policy "Order items insert on order create" on order_items for insert
  with check (order_id in (select id from orders where buyer_id = auth.uid()));

-- Order tracking
create policy "Order parties can view tracking" on order_tracking for select
  using (order_id in (select id from orders where buyer_id = auth.uid())
      or order_id in (select order_id from order_items where seller_id in (select id from sellers where user_id = auth.uid()))
      or is_admin());

-- Reviews
create policy "Reviews are public" on reviews for select using (true);
create policy "Buyers can write reviews for delivered orders" on reviews for insert
  with check (auth.uid() = buyer_id and
    order_id in (select id from orders where buyer_id = auth.uid() and status = 'delivered'));
create policy "Buyers can update own reviews" on reviews for update
  using (auth.uid() = buyer_id);

-- Wishlists
create policy "Users manage own wishlist" on wishlists for all using (auth.uid() = user_id);

-- Notifications
create policy "Users view own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users mark own notifications read" on notifications for update using (auth.uid() = user_id);
create policy "System can insert notifications" on notifications for insert with check (true);

-- Commissions (admin and relevant seller only)
create policy "Sellers view own commissions" on commissions for select
  using (seller_id in (select id from sellers where user_id = auth.uid()) or is_admin());
create policy "Admins manage commissions" on commissions for all using (is_admin());

-- Data API grants.
-- Supabase stops auto-granting Data API access to new public tables on
-- 2026-10-30, so every table this migration creates is granted explicitly.
-- Without these the API answers 'permission denied' and the app breaks on
-- fresh projects, preview branches and 'supabase db reset'.
grant select on public.profiles to anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;
grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.categories to service_role;
grant select on public.delivery_zones to anon;
grant select, insert, update, delete on public.delivery_zones to authenticated;
grant select, insert, update, delete on public.delivery_zones to service_role;
grant select on public.sellers to anon;
grant select, insert, update, delete on public.sellers to authenticated;
grant select, insert, update, delete on public.sellers to service_role;
grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.products to service_role;
grant select on public.product_images to anon;
grant select, insert, update, delete on public.product_images to authenticated;
grant select, insert, update, delete on public.product_images to service_role;
grant select on public.orders to anon;
grant select, insert, update, delete on public.orders to authenticated;
grant select, insert, update, delete on public.orders to service_role;
grant select on public.order_items to anon;
grant select, insert, update, delete on public.order_items to authenticated;
grant select, insert, update, delete on public.order_items to service_role;
grant select on public.order_tracking to anon;
grant select, insert, update, delete on public.order_tracking to authenticated;
grant select, insert, update, delete on public.order_tracking to service_role;
grant select on public.commissions to anon;
grant select, insert, update, delete on public.commissions to authenticated;
grant select, insert, update, delete on public.commissions to service_role;
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant select, insert, update, delete on public.reviews to service_role;
grant select on public.wishlists to anon;
grant select, insert, update, delete on public.wishlists to authenticated;
grant select, insert, update, delete on public.wishlists to service_role;
grant select on public.notifications to anon;
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.notifications to service_role;

