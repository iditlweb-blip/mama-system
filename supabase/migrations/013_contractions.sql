-- Contraction tracker for pregnancy mode.
--
-- The pregnancy tracker gets a "מד צירים" (contraction timer) that works like
-- the sleep timer: the mother taps Start when a contraction begins and Stop
-- when it ends. Each completed contraction is stored here with its start/end
-- and duration. The app derives the interval between contractions (gap between
-- consecutive start_times) on the client, so we don't store it.
--
-- Regularity guidance (the 5-1-1 rule: contractions ~5 min apart, lasting ~1
-- min, for 1 hour) is computed client-side from these rows.
--
-- `hospital_address` on profiles feeds the "פתחי ב-Waze" button so tapping it
-- navigates straight to the mother's chosen delivery hospital.

create table if not exists public.contractions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  start_time   timestamptz not null,
  end_time     timestamptz not null,
  duration_sec integer not null,
  created_at   timestamptz default now()
);

alter table public.contractions enable row level security;

drop policy if exists "Users manage own contractions" on public.contractions;
create policy "Users manage own contractions"
  on public.contractions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists contractions_user_start_idx
  on public.contractions (user_id, start_time desc);

-- Delivery hospital address (used by the Waze button on the contraction page).
alter table public.profiles
  add column if not exists hospital_address text;
