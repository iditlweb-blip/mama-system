-- ─────────────────────────────────────────────────────────────
-- 005 – New features (FIXED – no IF NOT EXISTS on policies)
-- Run this in Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Fix chat mode constraint (add pregnancy)
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_mode_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_mode_check
  CHECK (mode IN ('baby','time','business','emotional','pregnancy'));

-- 2. Add new columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS setup_complete   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS setup_step       integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_goal        text CHECK (user_goal IN ('learn','organize','recommendations')),
  ADD COLUMN IF NOT EXISTS due_date         date,
  ADD COLUMN IF NOT EXISTS tracking_type    text CHECK (tracking_type IN ('pregnancy','baby')) DEFAULT 'baby',
  ADD COLUMN IF NOT EXISTS has_given_birth  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS birth_date       date,
  ADD COLUMN IF NOT EXISTS birth_baby_name  text,
  ADD COLUMN IF NOT EXISTS birth_baby_gender text CHECK (birth_baby_gender IN ('boy','girl')),
  ADD COLUMN IF NOT EXISTS pwa_installed_at timestamptz;

-- 3. Products table
CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  image_url   text,
  coupon_code text,
  buy_link    text,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- 4. Professionals table
CREATE TABLE IF NOT EXISTS professionals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  title      text,
  phone      text,
  region     text,
  image_url  text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 5. User analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  page             text NOT NULL,
  duration_seconds integer DEFAULT 0,
  session_date     date DEFAULT CURRENT_DATE,
  created_at       timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_analytics_user_id_idx ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS user_analytics_date_idx    ON user_analytics(session_date);
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own analytics" ON user_analytics;
CREATE POLICY "Users can insert own analytics" ON user_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own analytics" ON user_analytics;
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- 6. Pregnancy tests table
CREATE TABLE IF NOT EXISTS pregnancy_tests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  test_name      text NOT NULL,
  scheduled_week integer,
  file_url       text,
  notes          text,
  completed      boolean DEFAULT false,
  completed_at   timestamptz,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE pregnancy_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own pregnancy tests" ON pregnancy_tests;
CREATE POLICY "Users own pregnancy tests" ON pregnancy_tests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
