-- ─────────────────────────────────────────────────────────────
-- 035 – Health fund (קופת חולים) selection
-- Run this in Supabase → SQL Editor
--
-- Lets a woman pick her health fund (Settings, and later onboarding) so the
-- pregnancy test cards can link straight to that fund's own eligibility/
-- test-info page instead of a generic disclaimer.
-- ─────────────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists kupat_cholim text check (kupat_cholim in ('clalit', 'maccabi', 'meuhedet', 'leumit', null));
