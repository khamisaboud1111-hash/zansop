-- 020: grant execute on the remaining app RPCs
--
-- The same problem as 017, applied to the rest of the RPCs the app calls
-- from the browser. Without EXECUTE for `authenticated` the calls failed with
-- "permission denied for function ...":
--   /admin/deliveries  -> Failed to load online riders: permission denied for function list_online_riders
--   /rider/dashboard   -> get_active_delivery_for_rider
--   live delivery map  -> get_active_delivery_for_order
--   reels              -> toggle_video_like, record_video_view, add_video_comment
--   recently viewed    -> track_recently_viewed
--
-- Trigger functions (handle_new_user, sync_profile_email,
-- prevent_self_admin_promotion, recalc_rider_rating) are intentionally left
-- alone - they are not called over PostgREST.

grant execute on function public.list_online_riders() to authenticated;
grant execute on function public.get_active_delivery_for_rider(uuid) to authenticated;
grant execute on function public.get_active_delivery_for_order(uuid) to authenticated;
grant execute on function public.track_recently_viewed(uuid, uuid) to authenticated;
grant execute on function public.toggle_video_like(uuid) to authenticated;
grant execute on function public.record_video_view(uuid, integer, text) to authenticated;
grant execute on function public.add_video_comment(uuid, text, uuid) to authenticated;

notify pgrst, 'reload schema';
