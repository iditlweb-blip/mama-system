-- Task notes + file attachments (checklist rework).
alter table public.tasks
  add column if not exists notes text,
  add column if not exists file_url text;

-- Storage for task attachments (public bucket, per-user folders), mirroring
-- the pregnancy-tests bucket convention from migration 011.
insert into storage.buckets (id, name, public)
values ('task-files', 'task-files', true)
on conflict (id) do nothing;

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
