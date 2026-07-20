-- Pregnancy test-document storage.
--
-- The pregnancy tracker ("מעקב הריון") lets a mother attach a scan / photo /
-- PDF to each standard test. The client (app/(app)/pregnancy/PregnancyClient.tsx)
-- uploads to a `pregnancy-tests` bucket under `<user_id>/pregnancy/<test_id>.<ext>`
-- and then stores the resulting public URL on pregnancy_tests.file_url.
--
-- Until now that bucket never existed, so every upload failed with
-- "שגיאה בהעלאה — ודאי שאחסון ה-storage מוגדר". This migration creates it.
--
-- The bucket is PUBLIC so the stored file_url (a getPublicUrl result) can be
-- opened, shared to WhatsApp, or downloaded directly from the phone without a
-- signed-URL round-trip. Paths embed a random test UUID, so they are not
-- guessable. Writes/updates/deletes are still restricted per-user via the
-- policies below (first path segment must equal the caller's uid), following
-- the same convention as the `avatars` and `whatsapp-docs` buckets.

insert into storage.buckets (id, name, public)
values ('pregnancy-tests', 'pregnancy-tests', true)
on conflict (id) do nothing;

-- Anyone can READ (bucket is public); this keeps public URLs working.
create policy "Public read pregnancy tests"
  on storage.objects for select
  using (bucket_id = 'pregnancy-tests');

-- Only the owner may INSERT into her own folder.
create policy "Users upload own pregnancy tests"
  on storage.objects for insert
  with check (bucket_id = 'pregnancy-tests' and (auth.uid())::text = (storage.foldername(name))[1]);

-- Only the owner may UPDATE her own files (needed for upsert).
create policy "Users update own pregnancy tests"
  on storage.objects for update
  using (bucket_id = 'pregnancy-tests' and (auth.uid())::text = (storage.foldername(name))[1]);

-- Only the owner may DELETE her own files.
create policy "Users delete own pregnancy tests"
  on storage.objects for delete
  using (bucket_id = 'pregnancy-tests' and (auth.uid())::text = (storage.foldername(name))[1]);
