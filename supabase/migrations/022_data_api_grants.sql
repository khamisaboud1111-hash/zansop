-- 022: Data API grants for every public table
--
-- Supabase announced that from 2026-10-30 it stops automatically granting Data
-- API access to new tables in the public schema of existing projects. Existing
-- tables keep their grants, but anything created after that date - including
-- migrations that recreate the schema on fresh projects, preview branches and
-- "supabase db reset" - needs an explicit GRANT or the API answers
-- "permission denied" and the app stops working.
--
-- The individual table-creating migrations now carry their own grants. This
-- migration is the safety net:
--   1. re-assert the default privileges, so a table added later still gets
--      them without anyone remembering to write a GRANT;
--   2. grant every table that exists right now, so the live database and a
--      fresh reset end up in exactly the same state.
--
-- RLS still decides who can see which rows. These grants only say the table
-- is reachable through the Data API at all.

alter default privileges in schema public
  grant select on tables to anon;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant usage, select, update on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;

-- Note: the equivalent defaults for the supabase_admin role are already
-- installed on this project, and ALTER DEFAULT PRIVILEGES ... FOR ROLE needs
-- privileges this migration role does not have, so they are left alone.

-- Grant every table that exists in this schema right now.
do $$
declare
  t record;
begin
  for t in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  loop
    execute format('grant select on public.%I to anon', t.relname);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t.relname);
    execute format('grant select, insert, update, delete on public.%I to service_role', t.relname);
  end loop;
end $$;

notify pgrst, 'reload schema';
