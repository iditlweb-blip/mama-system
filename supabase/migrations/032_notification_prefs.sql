-- ─────────────────────────────────────────────────────────────
-- 032 – Per-type push notification preferences
-- Run this in Supabase → SQL Editor
--
-- Lets each user turn specific push categories on/off from Settings, instead
-- of all-or-nothing. Defaults true (everyone gets everything until they
-- change it) so this doesn't silently mute anyone.
-- ─────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists notify_tasks     boolean not null default true,
  add column if not exists notify_exams     boolean not null default true,
  add column if not exists notify_sleep     boolean not null default true,
  add column if not exists notify_community boolean not null default true;
