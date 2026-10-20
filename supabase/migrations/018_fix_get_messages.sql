-- 018: fix public.get_messages
--
-- The function aggregated with jsonb_agg(...) and then applied
-- "order by m.created_at desc limit p_limit" to the same query level. With an
-- aggregate in the select list, PostgreSQL rejects the ORDER BY:
--   ERROR: column "m.created_at" must appear in the GROUP BY clause
--        or be used in an aggregate function (42803)
-- So every read of the message list failed and the chat stayed empty.
--
-- The fix moves ORDER BY / LIMIT into a subquery and aggregates over it, and
-- returns the messages oldest-first: the chat UI renders the array in order
-- and appends incoming realtime messages at the end.

create or replace function public.get_messages(
  p_room_id uuid,
  p_limit integer default 50,
  p_before timestamp with time zone default null
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_result jsonb;
begin
  if not exists (
    select 1 from chat_rooms
    where id = p_room_id
      and (buyer_id = auth.uid()
           or seller_id in (select id from sellers where user_id = auth.uid())
           or rider_id = auth.uid())
  ) then
    raise exception 'Access denied to this chat room';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'id', t.id,
      'room_id', t.room_id,
      'sender_id', t.sender_id,
      'sender_name', t.full_name,
      'sender_avatar', t.avatar_url,
      'body', t.body,
      'message_type', t.message_type,
      'attachment_url', t.attachment_url,
      'read_at', t.read_at,
      'created_at', t.created_at,
      'is_own', t.sender_id = auth.uid()
    )
    order by t.created_at
  ) into v_result
  from (
    select m.*, p.full_name, p.avatar_url
    from messages m
    join profiles p on p.id = m.sender_id
    where m.room_id = p_room_id
      and (p_before is null or m.created_at < p_before)
    order by m.created_at desc
    limit p_limit
  ) t;

  if v_result is null then return '[]'::jsonb; end if;
  return v_result;
end;
$function$;

grant execute on function public.get_messages(uuid, integer, timestamptz) to authenticated;

notify pgrst, 'reload schema';
