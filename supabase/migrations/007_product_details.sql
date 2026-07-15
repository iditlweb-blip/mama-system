-- ─────────────────────────────────────────────────────────────────────────────
-- 007 – Product categories + full detail page content
--
-- Adds two optional columns to `products`:
--   • category  – used for the category filter on the recommendations page
--   • details   – long-form info shown on the per-product detail page
--
-- Safe to run multiple times (IF NOT EXISTS). Run this in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'כללי',
  ADD COLUMN IF NOT EXISTS details  text;

-- Backfill any existing rows that predate the category column.
UPDATE products SET category = 'כללי' WHERE category IS NULL;
