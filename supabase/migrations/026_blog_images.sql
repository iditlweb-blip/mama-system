-- ─────────────────────────────────────────────────────────────
-- 026 – Storage bucket for blog cover images
-- Run this in Supabase → SQL Editor
--
-- The owner uploads a cover image (e.g. one created in Magnific) from the blog
-- editor. Files go to blog-images/<owner-uid>/<file>. Public read so the
-- images show on the public blog. Mirrors the task-files bucket pattern.
--
-- If step 2 errors with 42501 "must be owner of table objects", create the
-- bucket + policies from the Supabase Storage UI instead (New bucket named
-- "blog-images", Public; the app works the same either way).
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read blog images"      on storage.objects;
drop policy if exists "Users upload own blog images" on storage.objects;
drop policy if exists "Users update own blog images" on storage.objects;
drop policy if exists "Users delete own blog images" on storage.objects;

create policy "Public read blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

create policy "Users upload own blog images"
  on storage.objects for insert
  with check (bucket_id = 'blog-images' and (auth.uid())::text = (storage.foldername(name))[1]);

create policy "Users update own blog images"
  on storage.objects for update
  using (bucket_id = 'blog-images' and (auth.uid())::text = (storage.foldername(name))[1]);

create policy "Users delete own blog images"
  on storage.objects for delete
  using (bucket_id = 'blog-images' and (auth.uid())::text = (storage.foldername(name))[1]);
