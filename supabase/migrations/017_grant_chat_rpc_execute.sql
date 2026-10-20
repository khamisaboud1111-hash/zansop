-- 017: grant execute on the chat RPCs
--
-- Migrations 013/014 declare these grants, but they were never applied on the
-- live database - every chat function was owned by postgres with EXECUTE only
-- for postgres and service_role. The browser client calls them with the anon
-- key plus the user JWT (role `authenticated`), so every call was rejected:
--   send_message   -> 404 PGRST202 (PostgREST hides functions the role cannot run)
--   get_chat_rooms -> 403 permission denied for function get_chat_rooms
-- The chat page could list conversations (a plain table select, allowed by RLS)
-- but could never send or read a message.

grant execute on function public.get_chat_rooms(uuid) to authenticated;
grant execute on function public.get_messages(uuid, integer, timestamptz) to authenticated;
grant execute on function public.send_message(uuid, text, text, text) to authenticated;
grant execute on function public.mark_messages_read(uuid) to authenticated;
grant execute on function public.create_buyer_seller_room(uuid, uuid, uuid) to authenticated;
grant execute on function public.create_buyer_rider_room(uuid, uuid) to authenticated;
grant execute on function public.create_seller_rider_room(uuid, uuid) to authenticated;

-- PostgREST caches the schema; the new grants are invisible until it reloads.
notify pgrst, 'reload schema';
