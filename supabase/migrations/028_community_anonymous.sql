-- ─────────────────────────────────────────────────────────────
-- 028 – Community: anonymous posting + author avatar
-- Run this in Supabase → SQL Editor
--
-- A poster can choose to stay anonymous. When she doesn't, her profile picture
-- is denormalized onto the row (author_avatar_url) so the public/anon read can
-- show it without needing access to other users' profiles rows (which RLS
-- blocks). Anonymous rows store no avatar and show a default icon.
-- ─────────────────────────────────────────────────────────────

alter table public.community_questions
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists author_avatar_url text;

alter table public.community_answers
  add column if not exists is_anonymous boolean not null default false,
  add column if not exists author_avatar_url text;
