-- ─────────────────────────────────────────────────────────────
-- 029 – Push notifications (Web Push)
-- Run this in Supabase → SQL Editor
--
-- Enables real phone push notifications (arrive even when the app/tab is
-- closed) for: task reminders, pregnancy test windows closing, long-running
-- sleep timers, and new community questions (to the owner).
-- ─────────────────────────────────────────────────────────────

-- One row per subscribed browser/device. A user can have several (phone +
-- desktop, or after reinstalling).
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  endpoint   text not null unique,
  p256dh     text not null,
  auth_key   text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;
create policy "Users manage own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tracks whether a task's remind_at push has already been sent, separate from
-- the existing `reminded` flag (which drives the in-app popup while the app is
-- open) so the two channels don't interfere with each other.
alter table public.tasks
  add column if not exists push_sent boolean not null default false;

-- Same idea for the sleep-timer-running-long alert.
alter table public.active_sleep_timers
  add column if not exists push_sent boolean not null default false;

-- Dedupes the "pregnancy test window closing" push per user per test, since
-- that check has no natural "already handled" row to flag (unlike tasks).
create table if not exists public.exam_push_notified (
  user_id     uuid references auth.users on delete cascade not null,
  test_id     text not null,
  notified_at timestamptz not null default now(),
  primary key (user_id, test_id)
);

alter table public.exam_push_notified enable row level security;
-- Service-role only (the cron route uses the admin client) - no policies for
-- regular users, matching the admin_* back-office table pattern.
