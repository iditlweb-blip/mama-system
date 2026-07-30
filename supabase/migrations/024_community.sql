-- ─────────────────────────────────────────────────────────────
-- 024 – Community Q&A (questions + answers)
-- Run this in Supabase → SQL Editor
--
-- A public question-and-answer space for mothers. Anyone can READ published
-- content (even signed-out). Only a logged-in user can POST, and only as
-- herself (auth.uid() = user_id). The owner moderates everything through the
-- admin panel via the service_role client, which bypasses RLS.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.community_questions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  author_name text,
  title       text not null,
  body        text,
  category    text,
  status      text not null default 'published', -- 'published' | 'hidden'
  created_at  timestamptz not null default now()
);

create table if not exists public.community_answers (
  id          uuid primary key default gen_random_uuid(),
  question_id uuid references public.community_questions on delete cascade not null,
  user_id     uuid references auth.users on delete cascade not null,
  author_name text,
  body        text not null,
  status      text not null default 'published', -- 'published' | 'hidden'
  created_at  timestamptz not null default now()
);

create index if not exists community_questions_created_idx on public.community_questions (created_at desc);
create index if not exists community_answers_question_idx  on public.community_answers (question_id, created_at);

alter table public.community_questions enable row level security;
alter table public.community_answers   enable row level security;

-- ── Questions policies ──────────────────────────────────────────────────────
drop policy if exists "Anyone reads published questions" on public.community_questions;
create policy "Anyone reads published questions" on public.community_questions
  for select using (status = 'published');

drop policy if exists "Users insert own questions" on public.community_questions;
create policy "Users insert own questions" on public.community_questions
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own questions" on public.community_questions;
create policy "Users update own questions" on public.community_questions
  for update using (auth.uid() = user_id);

drop policy if exists "Users delete own questions" on public.community_questions;
create policy "Users delete own questions" on public.community_questions
  for delete using (auth.uid() = user_id);

-- ── Answers policies ────────────────────────────────────────────────────────
drop policy if exists "Anyone reads published answers" on public.community_answers;
create policy "Anyone reads published answers" on public.community_answers
  for select using (status = 'published');

drop policy if exists "Users insert own answers" on public.community_answers;
create policy "Users insert own answers" on public.community_answers
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own answers" on public.community_answers;
create policy "Users update own answers" on public.community_answers
  for update using (auth.uid() = user_id);

drop policy if exists "Users delete own answers" on public.community_answers;
create policy "Users delete own answers" on public.community_answers
  for delete using (auth.uid() = user_id);
