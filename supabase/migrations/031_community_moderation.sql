-- ─────────────────────────────────────────────────────────────
-- 031 – Community questions require approval before publishing
-- Run this in Supabase → SQL Editor
--
-- New questions are now inserted with status='pending' (app-level change, no
-- schema change needed - status was already free-form text). They stay
-- invisible to everyone (including the asker's own feed) until the owner
-- approves them from the admin panel - EXCEPT the asker herself, who can
-- still read her own row right after posting (the insert action does
-- `.select()` on the row it just created, which RLS would otherwise block
-- for a non-published row).
-- ─────────────────────────────────────────────────────────────

drop policy if exists "Users read own questions" on public.community_questions;
create policy "Users read own questions" on public.community_questions
  for select using (auth.uid() = user_id);
