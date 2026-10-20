-- 019: let the public read approved seller storefronts
--
-- public.sellers had no SELECT policy for anon/authenticated - only
-- "Sellers can read own profile" (user_id = auth.uid()). Every public
-- storefront page 404'd because the row was filtered out by RLS:
--   /sellers/<store_slug> -> notFound()
-- and the sellers embedded in product queries came back empty, so the seller
-- name was missing under each product card.
--
-- Approved stores are public marketplace data. Pending and suspended stores
-- stay private, and a seller can always read their own row.

create policy "Public can view approved sellers"
on public.sellers
for select
to anon, authenticated
using (status = 'approved' or user_id = auth.uid());

notify pgrst, 'reload schema';
