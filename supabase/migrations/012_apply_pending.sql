-- Consolidated "catch-up" migration.
--
-- A live probe (2026-07-20) found the following objects MISSING from the
-- production database, even though their source migrations exist in this repo:
--   * baby_logs.is_night        (migration 009 never applied)   -> this is why
--       stopping the sleep timer failed silently: the insert referenced a
--       column that didn't exist, the error was swallowed, no log was written.
--   * storage bucket whatsapp-docs   (migration 010 applied only partially:
--       its tables exist, but the storage section did not run)
--   * storage bucket pregnancy-tests (migration 011 never applied)
--
-- This file re-applies just those three pieces. Every statement is written to
-- be safe to run more than once (idempotent): "add column if not exists",
-- "on conflict do nothing", and "drop policy if exists" before each create.
-- Running it will NOT touch data or duplicate anything already present.

------------------------------------------------------------------------
-- 009: day/night distinction on sleep logs
------------------------------------------------------------------------
alter table public.baby_logs
  add column if not exists is_night boolean default false;

------------------------------------------------------------------------
-- 010 (storage only): private WhatsApp documents bucket
------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('whatsapp-docs', 'whatsapp-docs', false)
on conflict (id) do nothing;

drop policy if exists "Users read own whatsapp docs" on storage.objects;
create policy "Users read own whatsapp docs"
  on storage.objects for select
  using (bucket_id = 'whatsapp-docs' and (auth.uid())::text = (storage.foldername(name))[1]);

drop policy if exists "Users manage own whatsapp docs" on storage.objects;
create policy "Users manage own whatsapp docs"
  on storage.objects for all
  using (bucket_id = 'whatsapp-docs' and (auth.uid())::text = (storage.foldername(name))[1]);

------------------------------------------------------------------------
-- 011: public pregnancy-tests bucket (scan/photo/PDF per test)
------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('pregnancy-tests', 'pregnancy-tests', true)
on conflict (id) do nothing;

drop policy if exists "Public read pregnancy tests" on storage.objects;
create policy "Public read pregnancy tests"
  on storage.objects for select
  using (bucket_id = 'pregnancy-tests');

drop policy if exists "Users upload own pregnancy tests" on storage.objects;
create policy "Users upload own pregnancy tests"
  on storage.objects for insert
  with check (bucket_id = 'pregnancy-tests' and (auth.uid())::text = (storage.foldername(name))[1]);

drop policy if exists "Users update own pregnancy tests" on storage.objects;
create policy "Users update own pregnancy tests"
  on storage.objects for update
  using (bucket_id = 'pregnancy-tests' and (auth.uid())::text = (storage.foldername(name))[1]);

drop policy if exists "Users delete own pregnancy tests" on storage.objects;
create policy "Users delete own pregnancy tests"
  on storage.objects for delete
  using (bucket_id = 'pregnancy-tests' and (auth.uid())::text = (storage.foldername(name))[1]);
