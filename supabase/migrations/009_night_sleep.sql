-- Add a "night sleep" flag to baby_logs so the sleep timer can distinguish
-- night sleep (started via the "night timer") from daytime naps. Night
-- sleeps are excluded from the daily nap count and don't drive the
-- "time until next nap" wake-window prediction.
alter table public.baby_logs
  add column if not exists is_night boolean default false;
