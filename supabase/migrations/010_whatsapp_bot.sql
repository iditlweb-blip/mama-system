-- WhatsApp bot support:
--   1. profiles.whatsapp_number — the E.164 number (e.g. 972501234567) a user
--      has linked to the bot. Set once the OTP-link flow below succeeds.
--   2. whatsapp_link_codes — short-lived one-time codes generated from the
--      in-app Settings page ("קישור וואטסאפ"). The user sends the code as a
--      WhatsApp message to the bot number; the webhook matches it and stamps
--      profiles.whatsapp_number with the sender's phone number.
--   3. whatsapp_documents — files (lab results, photos, etc.) a user sends
--      to the bot, downloaded from Meta's Graph API and re-uploaded to the
--      `whatsapp-docs` storage bucket, optionally linked to a health_event.
--   4. `whatsapp-docs` storage bucket, private (accessed via signed URLs),
--      following the same per-user-folder convention as `avatars` /
--      `pregnancy-tests`.

alter table public.profiles
  add column if not exists whatsapp_number text unique;

-- Shared "is a sleep timer currently running" state. Until now this lived
-- only in the browser's localStorage (see lib/useSleepTimer.ts), which the
-- WhatsApp bot can't reach. Promoting it to a table makes it a single source
-- of truth: the mother can start a timer in the app and stop it from
-- WhatsApp (or vice-versa), and every open tab / the global timer bar
-- reflect the same running session. One row per user (primary key) = at most
-- one active timer at a time.
create table if not exists public.active_sleep_timers (
  user_id uuid references auth.users on delete cascade primary key,
  start_time timestamptz not null default now(),
  is_night boolean default false,
  source text default 'app'
);

alter table public.active_sleep_timers enable row level security;
create policy "Users manage own active_sleep_timers" on public.active_sleep_timers for all using (auth.uid() = user_id);

create table if not exists public.whatsapp_link_codes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  code text not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);

alter table public.whatsapp_link_codes enable row level security;
create policy "Users manage own whatsapp_link_codes" on public.whatsapp_link_codes for all using (auth.uid() = user_id);
-- The webhook (service-role key) bypasses RLS entirely, so no extra policy
-- is needed for the server-side lookup-by-code step.

create index if not exists whatsapp_link_codes_code_idx on public.whatsapp_link_codes (code) where used_at is null;

create table if not exists public.whatsapp_documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  health_event_id uuid references public.health_events on delete set null,
  file_path text not null,
  file_name text,
  mime_type text,
  caption text,
  created_at timestamptz default now()
);

alter table public.whatsapp_documents enable row level security;
create policy "Users manage own whatsapp_documents" on public.whatsapp_documents for all using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('whatsapp-docs', 'whatsapp-docs', false)
on conflict (id) do nothing;

create policy "Users read own whatsapp docs"
  on storage.objects for select
  using (bucket_id = 'whatsapp-docs' and (auth.uid())::text = (storage.foldername(name))[1]);

create policy "Users manage own whatsapp docs"
  on storage.objects for all
  using (bucket_id = 'whatsapp-docs' and (auth.uid())::text = (storage.foldername(name))[1]);
