-- ─────────────────────────────────────────────────────────────
-- 006 – Enable RLS + public read policies for products/professionals
-- Run this in Supabase → SQL Editor
--
-- Why: the `products` and `professionals` tables were created without RLS
-- ever being explicitly enabled. Depending on how the table ended up in its
-- current state, that means one of two things:
--   (a) RLS is OFF entirely — the public "מוצרים ובעלי מקצוע" page still
--       works, but it also means the public anon key (which ships inside
--       the app's client-side JS, so anyone can find it) can insert/update/
--       delete rows directly via the REST API, completely bypassing the
--       admin panel's login check. That's a real write-access hole.
--   (b) RLS is ON but has zero policies (this happens automatically if the
--       table was ever touched via the Supabase Table Editor UI instead of
--       SQL) — which silently hides ALL rows from anon/authenticated
--       reads, even though the admin panel (which uses the service_role
--       key and therefore bypasses RLS) can insert/see rows just fine.
--       This exactly matches the symptom of "I added a product in admin,
--       it says success, but it never shows on the public products page."
--
-- This migration fixes both scenarios at once: turn RLS ON, and add an
-- explicit "anyone can read" policy. No INSERT/UPDATE/DELETE policy is
-- added on purpose — only the service_role key (used exclusively by
-- app/admin/actions.ts) can write, which is exactly the intended behavior.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read products" ON products;
CREATE POLICY "Anyone can read products" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read professionals" ON professionals;
CREATE POLICY "Anyone can read professionals" ON professionals
  FOR SELECT USING (true);
