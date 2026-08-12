-- ─────────────────────────────────────────────────────────────
-- 033 – Activity log type + quick-select tags
-- Run this in Supabase → SQL Editor
--
-- Adds a 4th baby_logs type ('activity', for outings/playtime/pool/family)
-- alongside feed/sleep/diaper, plus a tags array for the quick-select chips
-- (בחוץ / משטח פעילות / חברים / בריכה / משפחה) shown in the tracker UI.
-- ─────────────────────────────────────────────────────────────

-- Find and drop the existing check constraint on the `type` column
-- specifically - matched by which column it applies to (conkey), not by
-- searching its definition text, since a text search for "type" also
-- matches the feed_type / diaper_type check constraints on this same table.
do $$
declare
  con_name text;
  type_attnum smallint;
begin
  select attnum into type_attnum
  from pg_attribute
  where attrelid = 'public.baby_logs'::regclass
    and attname = 'type'
    and not attisdropped;

  select conname into con_name
  from pg_constraint
  where conrelid = 'public.baby_logs'::regclass
    and contype = 'c'
    and conkey = array[type_attnum];

  if con_name is not null then
    execute format('alter table public.baby_logs drop constraint %I', con_name);
  end if;
end $$;

alter table public.baby_logs
  add constraint baby_logs_type_check check (type in ('feed', 'sleep', 'diaper', 'activity'));

alter table public.baby_logs
  add column if not exists activity_tags text[];
