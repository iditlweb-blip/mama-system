-- ─────────────────────────────────────────────────────────────
-- 027 – Cover images for the starter blog posts
-- Run this in Supabase → SQL Editor (after 023_seed_blog.sql).
--
-- The images were generated with Magnific (on-brand cream/mauve photography)
-- and committed under public/blog/, so they are served from the site itself
-- (fast, permanent, good for SEO). Safe to re-run.
-- ─────────────────────────────────────────────────────────────

update public.blog_posts set cover_image_url = '/blog/sleep-windows-newborn.jpg'  where slug = 'sleep-windows-newborn';
update public.blog_posts set cover_image_url = '/blog/breastfeeding-start.jpg'     where slug = 'breastfeeding-start';
update public.blog_posts set cover_image_url = '/blog/first-week-home.jpg'          where slug = 'first-week-home';
update public.blog_posts set cover_image_url = '/blog/postpartum-self-care.jpg'     where slug = 'postpartum-self-care';
