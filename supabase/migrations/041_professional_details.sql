-- 041 – Full professional profile (matches the "הצטרפות לעמוד אנשי המקצוע" Google Form)
-- Run this in Supabase → SQL Editor
--
-- Until now a professional had only name/title/phone/region. The admin panel
-- now edits every field from the sign-up form (about, services, benefit,
-- social links, profile photo…) and the products page shows them as a full
-- card. All columns are nullable and added with IF NOT EXISTS, so this is safe
-- to re-run and safe regardless of which 005 variant created the table.
--
-- Profile photos are uploaded from the admin panel into the existing
-- `blog-images` bucket (admin-only write, public read — see 026 + 040), so no
-- new storage bucket is needed.

ALTER TABLE professionals ADD COLUMN IF NOT EXISTS title               text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS phone               text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS region              text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS image_url           text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS email               text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS category            text;  -- תחום עיקרי
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS service_mode        text;  -- פרונטלי / אונליין
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS tagline             text;  -- משפט אחד שמתאר אותך
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS about               text;  -- קצת עליי
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS credentials         text;  -- הכשרה והסמכות
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS services            text;  -- one service per line
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS price_range         text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS response_time       text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS benefit             text;  -- ההטבה
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS coupon_code         text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS benefit_terms       text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS benefit_valid_until date;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS instagram           text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS website             text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS facebook            text;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS is_active           boolean DEFAULT true;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS sort_order          integer DEFAULT 0;

-- The original (non-"fixed") 005 made specialty/region NOT NULL; the admin
-- form doesn't send `specialty`, so relax those if they exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'professionals' AND column_name = 'specialty') THEN
    ALTER TABLE professionals ALTER COLUMN specialty DROP NOT NULL;
  END IF;
  ALTER TABLE professionals ALTER COLUMN region DROP NOT NULL;
END $$;

UPDATE professionals SET is_active = true WHERE is_active IS NULL;

-- First professional from the form responses (18/09/2026). Inserted only once;
-- edit or delete her from the admin panel like any other row.
INSERT INTO professionals (
  name, title, phone, email, category, region, service_mode, tagline, about,
  credentials, services, response_time, benefit, benefit_valid_until,
  instagram, website, is_active, sort_order
)
SELECT
  'סנדרה גהוזי', 'יועצת שינה הוליסטית', '053-4519155', 'sandragahuzi@gmail.com',
  'שינה', 'השרון', 'פרונטלי ואונליין',
  'מלווה משפחות לשינה טובה והרדמה עצמאית – וללא בכי.',
  'אני סנדרה, יועצת שינה הוליסטית ואמא לשתיים. אני מלווה משפחות שרוצות לשפר את השינה בבית בדרך הדרגתית, שמותאמת לתינוק ולמשפחה, בלי להשאיר תינוק לבכות לבד ובלי שיטות של אימוני שינה.',
  'יועצת שינה בגישה ההוליסטית',
  E'ליווי שינה אישי למשפחות\nפגישות ייעוץ ומיקוד\nליווי ניו־בורן\nמדריכים וקורסים דיגיטליים',
  'תוך יומיים', '15% הנחה על ליווי ייעוץ שינה', '2026-10-05',
  'https://www.instagram.com/sandra_gahuzi', 'https://linktr.ee/gahuzisandra', true, 1
WHERE NOT EXISTS (SELECT 1 FROM professionals WHERE email = 'sandragahuzi@gmail.com');
