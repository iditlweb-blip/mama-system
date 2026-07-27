-- Task notes + file attachments (checklist rework).
-- Safe to re-run: columns use IF NOT EXISTS and policies are dropped first
-- (Postgres has no CREATE POLICY IF NOT EXISTS, so a second run would fail
-- with 42710 "policy already exists" otherwise).

-- 1. Columns (this part is all the app needs for notes; files need the bucket).
alter table public.tasks
  add column if not exists notes text,
  add column if not exists file_url text;

-- 2. Storage bucket for task attachments.
insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', true)
on conflict (id) do nothing;

-- 3. Policies. If this section errors with 42501 "must be owner of table
--    objects", create the bucket + policies from the Supabase Storage UI
--    instead - the app works the same either way.
drop policy if exists "Public read task files"      on storage.objects;
drop policy if exists "Users upload own task files" on storage.objects;
drop policy if exists "Users update own task files" on storage.objects;
drop policy if exists "Users delete own task files" on storage.objects;

create policy "Public read task files"
  on storage.objects for select
  using (bucket_id = 'task-files');

create policy "Users upload own task files"
  on storage.objects for insert
  with check (bucket_id = 'task-files' and (auth.uid())::text = (storage.foldername(name))[1]);

create policy "Users update own task files"
  on storage.objects for update
  using (bucket_id = 'task-files' and (auth.uid())::text = (storage.foldername(name))[1]);

create policy "Users delete own task files"
  on storage.objects for delete
  using (bucket_id = 'task-files' and (auth.uid())::text = (storage.foldername(name))[1]);
