-- ─────────────────────────────────────────────────────────────
-- 030 – Midday "no nap timer running" push reminder
-- Run this in Supabase → SQL Editor
--
-- Dedupe column: the cron check runs every few minutes during the target
-- hour, so this stops it from sending the same nudge more than once a day.
-- ─────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists midday_nap_reminder_date date;
