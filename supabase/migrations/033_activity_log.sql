-- ─────────────────────────────────────────────────────────────
-- 033 – Activity log type + quick-select tags
-- Run this in Supabase → SQL Editor
--
-- Adds a 4th baby_logs type ('activity', for outings/playtime/pool/family)
-- alongside feed/sleep/diaper, plus a tags array for the quick-select chips
-- (בחוץ / משטח פעילות / חברים / בריכה / משפחה) shown in the tracker UI.
-- ─────────────────────────────────────────────────────────────

-- Find and drop the existing type-check constraint by inspecting its actual
-- definition rather than assuming a name (it was auto-named by Postgres in
-- 001_initial.sql and never touched since).
do $$
declare
  con_name text;
begin
  select conname into con_name
  from pg_constraint
  where conrelid = 'public.baby_logs'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%type%=%any%'
  limit 1;

  if con_name is not null then
    execute format('alter table public.baby_logs drop constraint %I', con_name);
  end if;
end $$;

alter table public.baby_logs
  add constraint baby_logs_type_check check (type in ('feed', 'sleep', 'diaper', 'activity'));

alter table public.baby_logs
  add column if not exists activity_tags text[];
