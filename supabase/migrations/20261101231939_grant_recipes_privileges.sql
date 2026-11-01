-- The app's roles need table privileges before RLS policies can apply.
-- Signed-out visitors (anon) get nothing.
revoke all on table public.recipes from anon, authenticated;

-- Signed-in users get exactly the four operations; the RLS policies
-- still limit every one of them to the user's own rows.
grant select, insert, update, delete on table public.recipes to authenticated;
