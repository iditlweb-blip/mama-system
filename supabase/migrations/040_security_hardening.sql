-- 040 – Security hardening
--
-- Closes gaps where a signed-in user could bypass the app and talk to the
-- Supabase API directly with the public anon key (RLS was checking ownership
-- only, not WHICH columns / values a user may write):
--
--   1. security_rate_limit()   – shared rate-limit counter used by lib/security.ts
--   2. Community moderation    – a user could insert a question already
--                                'published' (skipping approval), re-publish a
--                                rejected one, or post under someone else's name
--   3. profiles.whatsapp_number – a user could claim another mother's phone
--                                number and receive her WhatsApp messages/files
--   4. Storage                 – the "public read" policies let ANYONE list every
--                                file in pregnancy-tests / task-files (medical
--                                documents). Public file links keep working;
--                                only listing/browsing is removed.
--   5. Upload limits           – size + file-type caps per bucket; only the admin
--                                may upload blog images.
--
-- Safe to run more than once. Run in the Supabase SQL Editor on project
-- tbhlefurogrzbhnxebjo.

-- Service role / SQL editor bypass: server code (service-role key) and the
-- owner in the SQL editor are trusted; only end-user API calls are restricted.
create or replace function public.is_trusted_role()
returns boolean language sql stable as $$
  select current_user in ('postgres', 'service_role', 'supabase_admin')
      or coalesce(auth.role(), '') = 'service_role'
$$;

-- ─── 1. Rate limiting ───────────────────────────────────────────────────────
create table if not exists public.security_rate_limits (
  key          text primary key,
  count        integer not null default 0,
  window_start timestamptz not null default now()
);
alter table public.security_rate_limits enable row level security;
-- No policies: only the service role (which bypasses RLS) touches this table.

create or replace function public.security_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.security_rate_limits as r (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count into v_count;

  -- Opportunistic cleanup of stale keys (~1% of calls).
  if random() < 0.01 then
    delete from public.security_rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_max;
end;
$$;
revoke all on function public.security_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.security_rate_limit(text, integer, integer) to service_role;

-- ─── 2. Community moderation ────────────────────────────────────────────────
create or replace function public.community_question_guard()
returns trigger language plpgsql set search_path = public as $$
declare
  v_name text;
  v_avatar text;
begin
  if public.is_trusted_role() then return new; end if;

  if tg_op = 'INSERT' then
    new.status := 'pending';                -- always goes through approval
    new.user_id := auth.uid();
  else
    new.status := old.status;               -- only the admin changes status
    new.user_id := old.user_id;
    new.created_at := old.created_at;
  end if;

  -- The displayed author always comes from the poster's own profile.
  if coalesce(new.is_anonymous, false) then
    new.author_name := 'אנונימית';
    new.author_avatar_url := null;
  else
    select name, profile_picture_url into v_name, v_avatar from public.profiles where id = new.user_id;
    new.author_name := coalesce(nullif(v_name, ''), 'אמא מהקהילה');
    new.author_avatar_url := v_avatar;
  end if;

  if length(coalesce(new.title, '')) > 200 or length(coalesce(new.body, '')) > 5000 then
    raise exception 'text too long';
  end if;
  return new;
end;
$$;
drop trigger if exists community_question_guard on public.community_questions;
create trigger community_question_guard
  before insert or update on public.community_questions
  for each row execute function public.community_question_guard();

create or replace function public.community_answer_guard()
returns trigger language plpgsql set search_path = public as $$
declare
  v_name text;
  v_avatar text;
begin
  if public.is_trusted_role() then return new; end if;

  if tg_op = 'INSERT' then
    -- Answers only on questions the owner approved.
    if not exists (select 1 from public.community_questions q where q.id = new.question_id and q.status = 'published') then
      raise exception 'question not open for answers';
    end if;
    new.status := 'published';
    new.user_id := auth.uid();
  else
    new.status := old.status;
    new.user_id := old.user_id;
    new.question_id := old.question_id;
    new.created_at := old.created_at;
  end if;

  if coalesce(new.is_anonymous, false) then
    new.author_name := 'אנונימית';
    new.author_avatar_url := null;
  else
    select name, profile_picture_url into v_name, v_avatar from public.profiles where id = new.user_id;
    new.author_name := coalesce(nullif(v_name, ''), 'אמא מהקהילה');
    new.author_avatar_url := v_avatar;
  end if;

  if length(coalesce(new.body, '')) > 5000 then
    raise exception 'text too long';
  end if;
  return new;
end;
$$;
drop trigger if exists community_answer_guard on public.community_answers;
create trigger community_answer_guard
  before insert or update on public.community_answers
  for each row execute function public.community_answer_guard();

-- ─── 3. Protected profile columns ───────────────────────────────────────────
-- whatsapp_number is set only by the WhatsApp webhook (service role) after the
-- number proves itself with a link code. A user may still clear her own.
create or replace function public.profiles_guard()
returns trigger language plpgsql as $$
begin
  if public.is_trusted_role() then return new; end if;
  if new.whatsapp_number is distinct from old.whatsapp_number and new.whatsapp_number is not null then
    new.whatsapp_number := old.whatsapp_number;
  end if;
  new.id := old.id;
  return new;
end;
$$;
drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();

create or replace function public.profiles_insert_guard()
returns trigger language plpgsql as $$
begin
  if public.is_trusted_role() then return new; end if;
  new.whatsapp_number := null;
  return new;
end;
$$;
drop trigger if exists profiles_insert_guard on public.profiles;
create trigger profiles_insert_guard
  before insert on public.profiles
  for each row execute function public.profiles_insert_guard();

-- ─── 4. Storage: no public listing ──────────────────────────────────────────
-- In a public bucket the /object/public/... file links work WITHOUT any
-- storage.objects policy, so dropping the "anyone can SELECT" policies stops
-- listing/browsing every user's files while keeping existing links working.
do $$
declare
  p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and cmd = 'SELECT'
      and qual not ilike '%auth.uid%'
      and (qual ilike '%pregnancy-tests%' or qual ilike '%task-files%'
           or qual ilike '%avatars%' or qual ilike '%blog-images%' or qual ilike '%whatsapp-docs%')
  loop
    execute format('drop policy %I on storage.objects', p.policyname);
  end loop;
end $$;

-- Each user can still list/read her own folder (needed for upsert uploads).
drop policy if exists "Owners read own files" on storage.objects;
create policy "Owners read own files" on storage.objects for select
  using (
    bucket_id in ('pregnancy-tests', 'task-files', 'avatars', 'blog-images')
    and (auth.uid())::text = (storage.foldername(name))[1]
  );

-- WhatsApp documents (lab results etc.) must never be public.
update storage.buckets set public = false where id = 'whatsapp-docs';

-- ─── 5. Upload limits ───────────────────────────────────────────────────────
update storage.buckets
  set file_size_limit = 10485760,  -- 10 MB
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','application/pdf']
  where id in ('pregnancy-tests', 'whatsapp-docs');

update storage.buckets
  set file_size_limit = 5242880,   -- 5 MB
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif']
  where id in ('avatars', 'blog-images');

update storage.buckets
  set file_size_limit = 10485760,
      allowed_mime_types = array[
        'image/jpeg','image/png','image/webp','image/gif','image/heic','image/heif','application/pdf',
        'text/plain','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
  where id = 'task-files';

-- Blog images: only the admin account may upload/replace/delete. Anyone else
-- could otherwise use the public bucket to host arbitrary files.
drop policy if exists "Users upload own blog images" on storage.objects;
drop policy if exists "Users update own blog images" on storage.objects;
drop policy if exists "Users delete own blog images" on storage.objects;
drop policy if exists "Admin manages blog images" on storage.objects;
create policy "Admin manages blog images" on storage.objects for all
  using (bucket_id = 'blog-images' and lower(auth.jwt() ->> 'email') = 'momsok100@gmail.com')
  with check (bucket_id = 'blog-images' and lower(auth.jwt() ->> 'email') = 'momsok100@gmail.com');
