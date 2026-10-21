-- ============================================================
-- Duka Janja — Migration 013: Chat System (Buyer-Seller Messaging)
-- Real-time chat with Realtime, RLS, and proper indexing
-- Run AFTER 001-012
-- ============================================================

-- Chat rooms (one per buyer-seller pair)
create table if not exists chat_rooms (
  id              uuid primary key default uuid_generate_v4(),
  buyer_id        uuid not null references profiles(id) on delete cascade,
  seller_id       uuid not null references sellers(id) on delete cascade,
  product_id      uuid references products(id) on delete set null, -- optional context
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (buyer_id, seller_id, product_id) -- one room per buyer-seller-product combo
);

create index if not exists chat_rooms_buyer_idx on chat_rooms(buyer_id);
create index if not exists chat_rooms_seller_idx on chat_rooms(seller_id);
create index if not exists chat_rooms_last_msg_idx on chat_rooms(last_message_at desc);

-- Messages
create table if not exists messages (
  id              uuid primary key default uuid_generate_v4(),
  room_id         uuid not null references chat_rooms(id) on delete cascade,
  sender_id       uuid not null references profiles(id) on delete cascade,
  body            text not null,
  message_type    text not null default 'text' check (message_type in ('text', 'image', 'product_card', 'system')),
  attachment_url  text,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists messages_room_created_idx on messages(room_id, created_at desc);
create index if not exists messages_sender_idx on messages(sender_id);
create index if not exists messages_unread_idx on messages(room_id, read_at) where read_at is null;

-- Realtime publication (run in Supabase Dashboard -> Realtime)
-- alter publication supabase_realtime add table messages;
-- alter publication supabase_realtime add table chat_rooms;

-- RLS Policies
alter table chat_rooms enable row level security;
alter table messages enable row level security;

-- Chat rooms: buyer and seller can view their rooms
create policy "Participants can view their chat rooms" on chat_rooms for select using (
  buyer_id = auth.uid() or
  seller_id in (select id from sellers where user_id = auth.uid()) or
  is_admin()
);

-- Participants can create chat rooms (e.g., from product page)
create policy "Buyers can create chat rooms" on chat_rooms for insert with check (
  buyer_id = auth.uid() and
  exists (select 1 from sellers where id = seller_id and status = 'approved')
);

-- Messages: participants can view messages in their rooms
create policy "Participants can view messages" on messages for select using (
  room_id in (
    select id from chat_rooms
    where buyer_id = auth.uid() or seller_id in (select id from sellers where user_id = auth.uid())
  )
);

-- Participants can send messages
create policy "Participants can send messages" on messages for insert with check (
  sender_id = auth.uid() and
  room_id in (
    select id from chat_rooms
    where buyer_id = auth.uid() or seller_id in (select id from sellers where user_id = auth.uid())
  )
);

-- Messages can be marked as read by recipient
create policy "Recipient can mark as read" on messages for update using (
  room_id in (
    select id from chat_rooms
    where buyer_id = auth.uid() or seller_id in (select id from sellers where user_id = auth.uid())
  ) and sender_id != auth.uid()
) with check (read_at is not null);

-- Sellers can update their own messages (for editing)
create policy "Senders can update own messages" on messages for update using (
  sender_id = auth.uid()
);

-- Grant execute
grant execute on function get_chat_rooms(uuid) to authenticated;
grant execute on function get_messages(uuid, integer, integer) to authenticated;
grant execute on function send_message(uuid, text, text, text) to authenticated;
grant execute on function mark_messages_read(uuid) to authenticated;

-- Helper function to get user's chat rooms
create or replace function get_chat_rooms(p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_agg(
    jsonb_build_object(
      'id', cr.id,
      'buyer_id', cr.buyer_id,
      'seller_id', cr.seller_id,
      'seller_name', s.store_name,
      'seller_slug', s.store_slug,
      'seller_logo', s.logo_url,
      'product_id', cr.product_id,
      'product_name', p.name,
      'product_image', pi.url,
      'last_message_at', cr.last_message_at,
      'unread_count', (
        select count(*) from messages m
        where m.room_id = cr.id
          and m.sender_id != p_user_id
          and m.read_at is null
      )
    )
    order by cr.last_message_at desc
  ) into v_result
  from chat_rooms cr
  join sellers s on s.id = cr.seller_id
  left join products p on p.id = cr.product_id
  left join product_images pi on pi.product_id = p.id and pi.is_primary = true
  where cr.buyer_id = p_user_id or cr.seller_id in (select id from sellers where user_id = p_user_id);

  if v_result is null then
    return '[]'::jsonb;
  end if;

  return v_result;
end;
$$;

-- Get messages for a room
create or replace function get_messages(
  p_room_id uuid,
  p_limit integer default 50,
  p_before timestamptz default null
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
  -- Verify user has access to this room
  if not exists (
    select 1 from chat_rooms
    where id = p_room_id
      and (buyer_id = auth.uid() or seller_id in (select id from sellers where user_id = auth.uid()))
  ) then
    raise exception 'Access denied to this chat room';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'room_id', m.room_id,
      'sender_id', m.sender_id,
      'sender_name', p.full_name,
      'sender_avatar', p.avatar_url,
      'body', m.body,
      'message_type', m.message_type,
      'attachment_url', m.attachment_url,
      'read_at', m.read_at,
      'created_at', m.created_at,
      'is_own', m.sender_id = auth.uid()
    )
    order by m.created_at desc
  ) into v_result
  from messages m
  join profiles p on p.id = m.sender_id
  where m.room_id = p_room_id
    and (p_before is null or m.created_at < p_before)
  order by m.created_at desc
  limit p_limit;

  if v_result is null then
    return '[]'::jsonb;
  end if;

  return v_result;
end;
$$;

-- Send a message
create or replace function send_message(
  p_room_id uuid,
  p_body text,
  p_message_type text default 'text',
  p_attachment_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room record;
  v_message record;
begin
  -- Verify access to room
  select * into v_room
  from chat_rooms
  where id = p_room_id
    and (buyer_id = auth.uid() or seller_id in (select id from sellers where user_id = auth.uid()));

  if not found then
    raise exception 'Access denied to this chat room';
  end if;

  insert into messages (room_id, sender_id, body, message_type, attachment_url)
  values (p_room_id, auth.uid(), p_body, p_message_type, p_attachment_url)
  returning * into v_message;

  -- Update room's last_message_at
  update chat_rooms set last_message_at = now() where id = p_room_id;

  return jsonb_build_object(
    'id', v_message.id,
    'room_id', v_message.room_id,
    'sender_id', v_message.sender_id,
    'body', v_message.body,
    'message_type', v_message.message_type,
    'attachment_url', v_message.attachment_url,
    'created_at', v_message.created_at,
    'is_own', true
  );
end;
$$;

-- Mark messages as read
create or replace function mark_messages_read(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  -- Verify access to room
  if not exists (
    select 1 from chat_rooms
    where id = p_room_id
      and (buyer_id = auth.uid() or seller_id in (select id from sellers where user_id = auth.uid()))
  ) then
    raise exception 'Access denied to this chat room';
  end if;

  update messages
  set read_at = now()
  where room_id = p_room_id
    and sender_id != auth.uid()
    and read_at is null;

  get diagnostics v_count = row_count;

  return jsonb_build_object('marked_read', v_count);
end;
$$;

grant execute on function get_chat_rooms(uuid) to authenticated;
grant execute on function get_messages(uuid, integer, timestamptz) to authenticated;
grant execute on function send_message(uuid, text, text, text) to authenticated;
grant execute on function mark_messages_read(uuid) to authenticated;
-- Data API grants.
-- Supabase stops auto-granting Data API access to new public tables on
-- 2026-10-30, so every table this migration creates is granted explicitly.
-- Without these the API answers 'permission denied' and the app breaks on
-- fresh projects, preview branches and 'supabase db reset'.
grant select on public.chat_rooms to anon;
grant select, insert, update, delete on public.chat_rooms to authenticated;
grant select, insert, update, delete on public.chat_rooms to service_role;
grant select on public.messages to anon;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.messages to service_role;

