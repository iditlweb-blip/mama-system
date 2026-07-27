-- Per-side nursing durations + per-user popup/preference controls.
alter table public.baby_logs
  add column if not exists feed_left_min integer,
  add column if not exists feed_right_min integer;

alter table public.profiles
  -- 'mom' | 'dad' | null. When set, the app stops asking on entry.
  add column if not exists default_parent text,
  add column if not exists show_parent_popup boolean default true,
  add column if not exists show_sleep_timer boolean default true,
  add column if not exists show_reminders boolean default true;
