-- 029: seller reviews, and ratings that actually stay up to date
--
-- The schema already had everything a review needs: sellers.average_rating,
-- sellers.review_count, products.average_rating, products.review_count and a
-- reviews.seller_reply column - but there was no way for a buyer to review a
-- seller, nothing kept the rating columns in step with the reviews that did
-- exist, and no policy let a seller answer a review.
--
-- This migration adds:
--   * seller_reviews - a buyer rates and comments on a seller for a
--     delivered order
--   * triggers that keep sellers.average_rating / review_count and
--     products.average_rating / review_count in step with the reviews
--   * a trigger that stops a seller from rewriting the rating they were
--     given when they reply
--   * a policy that lets the seller reply to a product review
--
-- A review is only for a delivered order the reviewer actually bought from
-- that seller, one review per order per seller.

create table if not exists public.seller_reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  seller_id uuid not null references public.sellers(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  seller_reply text,
  created_at timestamptz not null default now(),
  unique (order_id, seller_id, buyer_id)
);

create index if not exists seller_reviews_seller_idx on public.seller_reviews(seller_id, created_at desc);
create index if not exists seller_reviews_buyer_idx on public.seller_reviews(buyer_id, created_at desc);

alter table public.seller_reviews enable row level security;

-- Everyone can read them - they show on the public store page.
drop policy if exists "Seller reviews are public" on public.seller_reviews;
create policy "Seller reviews are public"
on public.seller_reviews for select to public
using (true);

-- A buyer can review a seller for a delivered order they placed with them.
drop policy if exists "Buyers can review sellers for delivered orders" on public.seller_reviews;
create policy "Buyers can review sellers for delivered orders"
on public.seller_reviews for insert to authenticated
with check (
  auth.uid() = buyer_id
  and exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.buyer_id = auth.uid()
      and o.status = 'delivered'
      and exists (
        select 1 from public.order_items i
        where i.order_id = o.id and i.seller_id = seller_reviews.seller_id
      )
  )
);

-- The buyer can edit their own review.
drop policy if exists "Buyers can update own seller reviews" on public.seller_reviews;
create policy "Buyers can update own seller reviews"
on public.seller_reviews for update to authenticated
using (auth.uid() = buyer_id)
with check (auth.uid() = buyer_id);

-- The seller can answer a review of theirs.
drop policy if exists "Sellers can reply to their reviews" on public.seller_reviews;
create policy "Sellers can reply to their reviews"
on public.seller_reviews for update to authenticated
using (exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid()))
with check (exists (select 1 from public.sellers s where s.id = seller_id and s.user_id = auth.uid()));

drop policy if exists "Admins manage seller reviews" on public.seller_reviews;
create policy "Admins manage seller reviews"
on public.seller_reviews for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- A reply must not be able to change the rating, the reviewer or the order.
create or replace function public.protect_review_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := false;
  v_is_buyer boolean := false;
  v_is_seller boolean := false;
begin
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') into v_is_admin;
  if v_is_admin then return new; end if;

  v_is_buyer := auth.uid() = old.buyer_id;

  -- A seller review names its seller and order; a product review names its
  -- product. Each table only has the columns it actually has.
  if TG_TABLE_NAME = 'seller_reviews' then
    v_is_seller := exists (select 1 from public.sellers s where s.id = old.seller_id and s.user_id = auth.uid());
  else
    v_is_seller := exists (
      select 1
      from public.products p
      join public.sellers s on s.id = p.seller_id
      where p.id = old.product_id and s.user_id = auth.uid()
    );
  end if;

  -- A review can never be moved to a different order, seller or buyer.
  if TG_TABLE_NAME = 'seller_reviews' then
    new.order_id := old.order_id;
    new.seller_id := old.seller_id;
  else
    new.product_id := old.product_id;
  end if;
  new.buyer_id := old.buyer_id;
  new.created_at := old.created_at;

  -- A seller answering a review may only add the reply.
  if v_is_seller and not v_is_buyer then
    new.rating := old.rating;
    new.comment := old.comment;
  end if;

  return new;
end;
$$;

drop trigger if exists seller_reviews_protect on public.seller_reviews;
create trigger seller_reviews_protect
before update on public.seller_reviews
for each row
execute function public.protect_review_columns();

-- The same protection for a product review: the seller answers, but does not
-- get to change the rating.
drop trigger if exists reviews_protect on public.reviews;
create trigger reviews_protect
before update on public.reviews
for each row
execute function public.protect_review_columns();

-- Let the seller answer a product review.
drop policy if exists "Sellers can reply to product reviews" on public.reviews;
create policy "Sellers can reply to product reviews"
on public.reviews for update to authenticated
using (
  exists (
    select 1
    from public.sellers s
    join public.products p on p.seller_id = s.id
    where p.id = product_id and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.sellers s
    join public.products p on p.seller_id = s.id
    where p.id = product_id and s.user_id = auth.uid()
  )
);

-- Keep the seller's rating in step with their reviews.
create or replace function public.recalc_seller_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid := coalesce(new.seller_id, old.seller_id);
begin
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

  return null;
end;
$$;

drop trigger if exists seller_reviews_recalc on public.seller_reviews;
create trigger seller_reviews_recalc
after insert or update or delete on public.seller_reviews
for each row
execute function public.recalc_seller_rating();

-- Keep the product's rating in step with its reviews.
create or replace function public.recalc_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
  set average_rating = coalesce((
        select round(avg(r.rating)::numeric, 2)
        from public.reviews r
        where r.product_id = v_product_id
      ), 0),
      review_count = (
        select count(*) from public.reviews r
        where r.product_id = v_product_id
      )
  where p.id = v_product_id;

  return null;
end;
$$;

drop trigger if exists reviews_recalc on public.reviews;
create trigger reviews_recalc
after insert or update or delete on public.reviews
for each row
execute function public.recalc_product_rating();

-- Bring the existing rows in line with the triggers.
do $$
declare
  r record;
begin
  for r in select id, product_id from public.reviews loop
    update public.reviews set rating = rating where id = r.id;
  end loop;
end;
$$;

notify pgrst, 'reload schema';
