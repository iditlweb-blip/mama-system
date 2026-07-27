-- Task reminders (#4) + cross-device "dropped a nap" persistence (#1b).
-- remind_at: when to surface an in-app reminder popup for the task.
-- reminded:  set once the reminder has been shown, so it doesn't repeat.
alter table public.tasks
  add column if not exists remind_at timestamptz,
  add column if not exists reminded boolean default false;

-- Which sleep age-band the mother has marked as "dropped a nap" for. Null =
-- none. Persists the tracker checkbox across devices (was localStorage only).
alter table public.profiles
  add column if not exists nap_dropped_band text;
