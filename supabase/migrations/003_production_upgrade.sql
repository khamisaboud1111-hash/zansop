-- ============================================================
-- Duka Janja — Production Upgrade
-- Run AFTER 001_initial_schema.sql and 002_storage_and_functions.sql
-- ============================================================

-- ─── PRODUCT VIDEOS ───────────────────────────────────────────────────────────

create table if not exists product_videos (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  url         text not null,
  thumbnail_url text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table product_videos enable row level security;

create policy "Product videos are public" on product_videos for select using (true);
create policy "Sellers can manage own product videos" on product_videos for all
  using (product_id in (select id from products where seller_id in (select id from sellers where user_id = auth.uid())));

-- ─── PRODUCT LOCATION / PICKUP INFO ───────────────────────────────────────────

alter table products add column if not exists location_area text;
alter table products add column if not exists pickup_available boolean not null default false;
alter table products add column if not exists delivery_available boolean not null default true;

-- ─── SELLER VERIFICATION ──────────────────────────────────────────────────────

create table if not exists seller_verification_documents (
  id             uuid primary key default uuid_generate_v4(),
  seller_id      uuid not null references sellers(id) on delete cascade,
  doc_type       text not null check (doc_type in ('national_id', 'business_license', 'tax_id', 'other')),
  file_url       text not null,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_note  text,
  created_at     timestamptz not null default now()
);

alter table seller_verification_documents enable row level security;

create policy "Sellers manage own verification docs" on seller_verification_documents for all
  using (seller_id in (select id from sellers where user_id = auth.uid()));
create policy "Admins manage all verification docs" on seller_verification_documents for all
  using (is_admin());

alter table sellers add column if not exists location_area text;
alter table sellers add column if not exists national_id_verified boolean not null default false;
alter table sellers add column if not exists business_license_verified boolean not null default false;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-videos', 'product-videos', true, 52428800, array['video/mp4','video/webm','video/quicktime']),
  ('seller-verification', 'seller-verification', false, 10485760, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do nothing;

create policy "Public read access for product videos"
  on storage.objects for select using (bucket_id = 'product-videos');
create policy "Authenticated users can upload product videos"
  on storage.objects for insert with check (bucket_id = 'product-videos' and auth.role() = 'authenticated');

create policy "Sellers can read own verification files"
  on storage.objects for select
  using (bucket_id = 'seller-verification' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Admins can read all verification files"
  on storage.objects for select using (bucket_id = 'seller-verification' and is_admin());
create policy "Authenticated users can upload verification files"
  on storage.objects for insert
  with check (bucket_id = 'seller-verification' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─── PAYMENT ARCHITECTURE (provider-agnostic, ready for M-Pesa/Airtel/Tigo) ──

create type payment_provider as enum ('mpesa', 'airtel_money', 'tigo_pesa', 'cash_on_delivery', 'manual');
create type payment_status as enum ('initiated', 'pending', 'completed', 'failed', 'cancelled', 'refunded');

create table if not exists payment_transactions (
  id                 uuid primary key default uuid_generate_v4(),
  order_id           uuid not null references orders(id) on delete cascade,
  provider           payment_provider not null,
  status             payment_status not null default 'initiated',
  amount             integer not null,
  currency           text not null default 'TZS',
  phone_number       text,
  provider_reference text,        -- transaction ID returned by the mobile money provider
  provider_payload   jsonb,        -- raw callback/webhook payload for auditing
  initiated_at       timestamptz not null default now(),
  completed_at       timestamptz,
  failure_reason     text
);

create index if not exists payment_transactions_order_idx on payment_transactions(order_id);
create index if not exists payment_transactions_status_idx on payment_transactions(status);

alter table payment_transactions enable row level security;

create policy "Buyers view own payment transactions" on payment_transactions for select
  using (order_id in (select id from orders where buyer_id = auth.uid()));
create policy "Admins manage payment transactions" on payment_transactions for all using (is_admin());
create policy "System can insert payment transactions" on payment_transactions for insert with check (true);
create policy "System can update payment transactions" on payment_transactions for update using (true);

-- ─── DELIVERY TRACKING (locations + courier assignment) ──────────────────────

create table if not exists delivery_tracking_events (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references orders(id) on delete cascade,
  status       order_status not null,
  note         text,
  latitude     numeric(9,6),
  longitude    numeric(9,6),
  created_at   timestamptz not null default now(),
  created_by   uuid references profiles(id)
);

create index if not exists delivery_tracking_order_idx on delivery_tracking_events(order_id);

alter table delivery_tracking_events enable row level security;

create policy "Order parties can view delivery tracking events" on delivery_tracking_events for select
  using (order_id in (select id from orders where buyer_id = auth.uid())
      or order_id in (select order_id from order_items where seller_id in (select id from sellers where user_id = auth.uid()))
      or is_admin());
create policy "Sellers and admins can add tracking events" on delivery_tracking_events for insert
  with check (
    order_id in (select order_id from order_items where seller_id in (select id from sellers where user_id = auth.uid()))
    or is_admin()
  );

-- ─── RECENTLY VIEWED ───────────────────────────────────────────────────────────

create table if not exists recently_viewed (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists recently_viewed_user_idx on recently_viewed(user_id, viewed_at desc);

alter table recently_viewed enable row level security;

create policy "Users manage own recently viewed" on recently_viewed for all using (auth.uid() = user_id);

-- Upsert helper so "viewed_at" bumps to top instead of erroring on duplicate
create or replace function track_recently_viewed(p_user_id uuid, p_product_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into recently_viewed (user_id, product_id, viewed_at)
  values (p_user_id, p_product_id, now())
  on conflict (user_id, product_id) do update set viewed_at = now();

  -- keep only the latest 50 per user
  delete from recently_viewed
  where user_id = p_user_id
    and product_id not in (
      select product_id from recently_viewed
      where user_id = p_user_id
      order by viewed_at desc
      limit 50
    );
end;
$$;

-- ─── TESTIMONIALS (curated, separate from product reviews) ──────────────────

create table if not exists testimonials (
  id            uuid primary key default uuid_generate_v4(),
  author_name   text not null,
  author_role   text,            -- e.g. "Buyer, Stone Town" / "Seller, Pemba"
  avatar_url    text,
  quote_en      text not null,
  quote_sw      text not null,
  rating        integer check (rating between 1 and 5),
  is_published  boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table testimonials enable row level security;

create policy "Published testimonials are public" on testimonials for select
  using (is_published = true or is_admin());
create policy "Admins manage testimonials" on testimonials for all using (is_admin());

-- ─── RETURN / REFUND POLICY (admin-editable content, per category optional) ──

create table if not exists policy_pages (
  slug        text primary key,     -- e.g. 'returns-refunds', 'shipping', 'terms'
  title_en    text not null,
  title_sw    text not null,
  content_en  text not null,
  content_sw  text not null,
  updated_at  timestamptz not null default now()
);

alter table policy_pages enable row level security;

create policy "Policy pages are public" on policy_pages for select using (true);
create policy "Admins manage policy pages" on policy_pages for all using (is_admin());

insert into policy_pages (slug, title_en, title_sw, content_en, content_sw) values
('returns-refunds', 'Returns & Refunds', 'Marejesho na Kurejesha Pesa',
 'Buyers may request a return within 3 days of delivery if the item is damaged, incorrect, or significantly not as described. Contact the seller first; unresolved disputes can be escalated to Duka Janja support.',
 'Wanunuzi wanaweza kuomba marejesho ndani ya siku 3 baada ya kupokea bidhaa ikiwa imeharibika, si sahihi, au tofauti kwa kiasi kikubwa na maelezo. Wasiliana na muuzaji kwanza; migogoro isiyotatuliwa inaweza kupelekwa kwa msaada wa Duka Janja.')
on conflict (slug) do nothing;

-- ─── VERIFIED BADGE LOGIC (computed) ──────────────────────────────────────────
-- A seller is "verified" once approved AND at least one verification doc is approved.

create or replace function seller_is_verified(p_seller_id uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from sellers s
    where s.id = p_seller_id
      and s.status = 'approved'
      and exists (
        select 1 from seller_verification_documents d
        where d.seller_id = s.id and d.status = 'approved'
      )
  );
$$;

-- Data API grants.
-- Supabase stops auto-granting Data API access to new public tables on
-- 2026-10-30, so every table this migration creates is granted explicitly.
-- Without these the API answers 'permission denied' and the app breaks on
-- fresh projects, preview branches and 'supabase db reset'.
grant select on public.product_videos to anon;
grant select, insert, update, delete on public.product_videos to authenticated;
grant select, insert, update, delete on public.product_videos to service_role;
grant select on public.seller_verification_documents to anon;
grant select, insert, update, delete on public.seller_verification_documents to authenticated;
grant select, insert, update, delete on public.seller_verification_documents to service_role;
grant select on public.payment_transactions to anon;
grant select, insert, update, delete on public.payment_transactions to authenticated;
grant select, insert, update, delete on public.payment_transactions to service_role;
grant select on public.delivery_tracking_events to anon;
grant select, insert, update, delete on public.delivery_tracking_events to authenticated;
grant select, insert, update, delete on public.delivery_tracking_events to service_role;
grant select on public.recently_viewed to anon;
grant select, insert, update, delete on public.recently_viewed to authenticated;
grant select, insert, update, delete on public.recently_viewed to service_role;
grant select on public.testimonials to anon;
grant select, insert, update, delete on public.testimonials to authenticated;
grant select, insert, update, delete on public.testimonials to service_role;
grant select on public.policy_pages to anon;
grant select, insert, update, delete on public.policy_pages to authenticated;
grant select, insert, update, delete on public.policy_pages to service_role;

