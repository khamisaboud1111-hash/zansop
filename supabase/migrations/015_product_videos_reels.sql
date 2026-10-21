-- ============================================================
-- Duka Janja — Migration 015: Product Videos & Reels Feed
-- Short videos for products + Instagram Reels style feed
-- Run AFTER 014
-- ============================================================

-- Product videos table (short videos for products)
create table if not exists product_videos (
  id                uuid primary key default uuid_generate_v4(),
  product_id        uuid not null references products(id) on delete cascade,
  seller_id         uuid not null references sellers(id) on delete cascade,
  video_url         text not null,
  thumbnail_url     text,
  duration_seconds  integer not null default 0,
  caption           text,
  hashtags          text[] not null default '{}',
  view_count        bigint not null default 0,
  like_count        integer not null default 0,
  comment_count     integer not null default 0,
  share_count       integer not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists product_videos_product_idx on product_videos(product_id);
create index if not exists product_videos_seller_idx on product_videos(seller_id);
create index if not exists product_videos_created_idx on product_videos(created_at desc);
create index if not exists product_videos_active_idx on product_videos(is_active, created_at desc) where is_active = true;

-- Video likes (users who liked a video)
create table if not exists video_likes (
  id          uuid primary key default uuid_generate_v4(),
  video_id    uuid not null references product_videos(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (video_id, user_id)
);

create index if not exists video_likes_video_idx on video_likes(video_id);
create index if not exists video_likes_user_idx on video_likes(user_id);

-- Video comments
create table if not exists video_comments (
  id          uuid primary key default uuid_generate_v4(),
  video_id    uuid not null references product_videos(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  parent_id   uuid references video_comments(id) on delete cascade,
  body        text not null,
  like_count  integer not null default 0,
  is_pinned   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists video_comments_video_idx on video_comments(video_id, created_at desc);
create index if not exists video_comments_user_idx on video_comments(user_id);
create index if not exists video_comments_parent_idx on video_comments(parent_id);

-- Video views (for analytics)
create table if not exists video_views (
  id          uuid primary key default uuid_generate_v4(),
  video_id    uuid not null references product_videos(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,
  ip_hash     text, -- hashed IP for anonymous views
  watch_duration_seconds integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists video_views_video_idx on video_views(video_id, created_at desc);
create index if not exists video_views_user_idx on video_views(user_id);

-- ============================================================
-- RLS Policies
-- ============================================================

alter table product_videos enable row level security;
alter table video_likes enable row level security;
alter table video_comments enable row level security;
alter table video_views enable row level security;

-- Product videos: public read for active videos; sellers manage own
create policy "Active product videos are public" on product_videos for select using (is_active = true);
create policy "Sellers manage own product videos" on product_videos for all using (
  seller_id in (select id from sellers where user_id = auth.uid())
);
create policy "Admins manage all product videos" on product_videos for all using (is_admin());

-- Video likes: users manage own likes
create policy "Users view video likes" on video_likes for select using (true);
create policy "Users manage own video likes" on video_likes for all using (auth.uid() = user_id);

-- Video comments: public read; users manage own
create policy "Video comments are public" on video_comments for select using (true);
create policy "Users insert own video comments" on video_comments for insert with check (auth.uid() = user_id);
create policy "Users update own video comments" on video_comments for update using (auth.uid() = user_id);
create policy "Users delete own video comments" on video_comments for delete using (auth.uid() = user_id);
create policy "Admins manage all video comments" on video_comments for all using (is_admin());

-- Video views: system can insert; users can view own; admins view all
create policy "System can insert video views" on video_views for insert with check (true);
create policy "Users view own video views" on video_views for select using (auth.uid() = user_id);
create policy "Admins view all video views" on video_views for select using (is_admin());

-- ============================================================
-- Helper Functions
-- ============================================================

-- Get reels feed (active videos with product/seller info)
create or replace function get_reels_feed(
  p_limit integer default 20,
  p_cursor timestamptz default null,
  p_hashtag text default null,
  p_seller_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_user_id uuid := auth.uid();
begin
  select jsonb_agg(
    jsonb_build_object(
      'id', pv.id,
      'product_id', pv.product_id,
      'product_name', p.name,
      'product_slug', p.slug,
      'product_price', p.price,
      'product_image', pi.url,
      'seller_id', pv.seller_id,
      'seller_name', s.store_name,
      'seller_slug', s.store_slug,
      'seller_logo', s.logo_url,
      'video_url', pv.video_url,
      'thumbnail_url', pv.thumbnail_url,
      'duration_seconds', pv.duration_seconds,
      'caption', pv.caption,
      'hashtags', pv.hashtags,
      'view_count', pv.view_count,
      'like_count', pv.like_count,
      'comment_count', pv.comment_count,
      'share_count', pv.share_count,
      'created_at', pv.created_at,
      'is_liked', exists (
        select 1 from video_likes vl
        where vl.video_id = pv.id and vl.user_id = v_user_id
      ),
      'is_own', pv.seller_id in (select id from sellers where user_id = v_user_id)
    )
    order by pv.created_at desc
  ) into v_result
  from product_videos pv
  join products p on p.id = pv.product_id
  join sellers s on s.id = pv.seller_id
  left join product_images pi on pi.product_id = p.id and pi.is_primary = true
  where pv.is_active = true
    and p.status = 'active'
    and s.status = 'approved'
    and (p_cursor is null or pv.created_at < p_cursor)
    and (p_hashtag is null or p_hashtag = any(pv.hashtags))
    and (p_seller_id is null or pv.seller_id = p_seller_id)
  limit p_limit;

  if v_result is null then
    return '[]'::jsonb;
  end if;

  return v_result;
end;
$$;

-- Toggle video like
create or replace function toggle_video_like(p_video_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
  v_like_count integer;
begin
  -- Check if already liked
  select exists(select 1 from video_likes where video_id = p_video_id and user_id = auth.uid()) into v_exists;

  if v_exists then
    -- Unlike
    delete from video_likes where video_id = p_video_id and user_id = auth.uid();
  else
    -- Like
    insert into video_likes (video_id, user_id) values (p_video_id, auth.uid());
  end if;

  -- Get updated count
  select count(*) into v_like_count from video_likes where video_id = p_video_id;
  update product_videos set like_count = v_like_count where id = p_video_id;

  return jsonb_build_object('liked', not v_exists, 'like_count', v_like_count);
end;
$$;

-- Record video view
create or replace function record_video_view(
  p_video_id uuid,
  p_watch_duration_seconds integer default 0,
  p_ip_hash text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_view_count bigint;
begin
  insert into video_views (video_id, user_id, ip_hash, watch_duration_seconds)
  values (p_video_id, auth.uid(), p_ip_hash, p_watch_duration_seconds);

  select count(*) into v_view_count from video_views where video_id = p_video_id;
  update product_videos set view_count = v_view_count where id = p_video_id;

  return jsonb_build_object('view_count', v_view_count);
end;
$$;

-- Add video comment
create or replace function add_video_comment(
  p_video_id uuid,
  p_body text,
  p_parent_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comment record;
  v_comment_count integer;
begin
  insert into video_comments (video_id, user_id, parent_id, body)
  values (p_video_id, auth.uid(), p_parent_id, p_body)
  returning * into v_comment;

  select count(*) into v_comment_count from video_comments where video_id = p_video_id;
  update product_videos set comment_count = v_comment_count where id = p_video_id;

  return jsonb_build_object(
    'id', v_comment.id,
    'video_id', v_comment.video_id,
    'user_id', v_comment.user_id,
    'parent_id', v_comment.parent_id,
    'body', v_comment.body,
    'like_count', v_comment.like_count,
    'created_at', v_comment.created_at,
    'user_name', (select full_name from profiles where id = auth.uid()),
    'user_avatar', (select avatar_url from profiles where id = auth.uid())
  );
end;
$$;

-- Get video comments
create or replace function get_video_comments(
  p_video_id uuid,
  p_limit integer default 20,
  p_cursor timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
  v_user_id uuid := auth.uid();
begin
  select jsonb_agg(
    jsonb_build_object(
      'id', vc.id,
      'video_id', vc.video_id,
      'user_id', vc.user_id,
      'user_name', p.full_name,
      'user_avatar', p.avatar_url,
      'parent_id', vc.parent_id,
      'body', vc.body,
      'like_count', vc.like_count,
      'is_pinned', vc.is_pinned,
      'created_at', vc.created_at,
      'is_own', vc.user_id = v_user_id
    )
    order by vc.created_at asc
  ) into v_result
  from video_comments vc
  join profiles p on p.id = vc.user_id
  where vc.video_id = p_video_id
    and vc.parent_id is null
    and (p_cursor is null or vc.created_at < p_cursor)
  limit p_limit;

  if v_result is null then
    return '[]'::jsonb;
  end if;

  return v_result;
end;
$$;

-- Grant execute
grant execute on function get_reels_feed(integer, timestamptz, text, uuid) to authenticated;
grant execute on function toggle_video_like(uuid) to authenticated;
grant execute on function record_video_view(uuid, integer, text) to authenticated;
grant execute on function add_video_comment(uuid, text, uuid) to authenticated;
grant execute on function get_video_comments(uuid, integer, timestamptz) to authenticated;
-- Data API grants.
-- Supabase stops auto-granting Data API access to new public tables on
-- 2026-10-30, so every table this migration creates is granted explicitly.
-- Without these the API answers 'permission denied' and the app breaks on
-- fresh projects, preview branches and 'supabase db reset'.
grant select on public.product_videos to anon;
grant select, insert, update, delete on public.product_videos to authenticated;
grant select, insert, update, delete on public.product_videos to service_role;
grant select on public.video_likes to anon;
grant select, insert, update, delete on public.video_likes to authenticated;
grant select, insert, update, delete on public.video_likes to service_role;
grant select on public.video_comments to anon;
grant select, insert, update, delete on public.video_comments to authenticated;
grant select, insert, update, delete on public.video_comments to service_role;
grant select on public.video_views to anon;
grant select, insert, update, delete on public.video_views to authenticated;
grant select, insert, update, delete on public.video_views to service_role;

