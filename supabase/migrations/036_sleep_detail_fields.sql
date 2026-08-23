-- ─────────────────────────────────────────────────────────────
-- 036 – Sleep quality / position / how baby fell asleep
-- Run this in Supabase → SQL Editor
--
-- Extra optional detail fields for sleep log entries: how well she slept,
-- what position, and how she fell asleep - shown when editing a sleep row
-- from the tracker timeline.
-- ─────────────────────────────────────────────────────────────

alter table public.baby_logs
  add column if not exists sleep_quality text check (sleep_quality in ('light', 'short', 'good', null)),
  add column if not exists sleep_position text check (sleep_position in ('stomach', 'back', null)),
  add column if not exists fell_asleep_by text check (fell_asleep_by in ('nursing', 'alone', 'stroller', 'arms', 'carrier', 'other', null));
