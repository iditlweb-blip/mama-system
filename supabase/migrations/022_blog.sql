-- ─────────────────────────────────────────────────────────────
-- 022 – Blog posts
-- Run this in Supabase → SQL Editor
--
-- Public blog for new mothers. The owner writes posts through the admin panel
-- (service_role client, bypasses RLS). The public /blog pages read only
-- PUBLISHED posts via the anon key, enforced by the SELECT policy below.
-- No INSERT/UPDATE/DELETE policy on purpose - only service_role can write.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  title           text not null,
  excerpt         text,
  body            text not null default '',      -- markdown
  cover_image_url text,
  category        text,
  status          text not null default 'draft', -- 'draft' | 'published'
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists blog_posts_status_published_idx
  on public.blog_posts (status, published_at desc);

alter table public.blog_posts enable row level security;

-- Anyone (even signed-out) may read PUBLISHED posts. Drafts stay invisible to
-- the anon/authenticated keys; the owner still sees them via service_role.
drop policy if exists "Anyone can read published posts" on public.blog_posts;
create policy "Anyone can read published posts" on public.blog_posts
  for select using (status = 'published');

-- Keep updated_at fresh on every write.
create or replace function public.touch_blog_posts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists blog_posts_touch_updated_at on public.blog_posts;
create trigger blog_posts_touch_updated_at
  before update on public.blog_posts
  for each row execute function public.touch_blog_posts_updated_at();
