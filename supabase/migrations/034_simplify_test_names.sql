-- ─────────────────────────────────────────────────────────────
-- 034 – Simplify pregnancy test names
-- Run this in Supabase → SQL Editor
--
-- lib/pregnancy.ts's STANDARD_TESTS names were simplified (dropped jargon
-- acronyms like HCG/TSH/OGTT/CVS/NST, fixed a mislabeled test at week 28
-- that was wrongly called GBS). The test name is used as the matching key
-- against pregnancy_tests.test_name / exam_push_notified.test_id (there's
-- no separate id column), so existing rows need remapping to the new
-- names too - otherwise a woman's already-added or already-completed test
-- would silently stop matching and reappear as "not done".
-- ─────────────────────────────────────────────────────────────

update public.pregnancy_tests set test_name = 'בדיקות דם ראשונות'      where test_name = 'בדיקת דם ראשונה (HCG, TSH, ספירת דם)';
update public.pregnancy_tests set test_name = 'בדיקת סיסי שליה'        where test_name = 'בדיקת סיסי שליה (CVS)';
update public.pregnancy_tests set test_name = 'בדיקת סקר משולבת'       where test_name = 'בדיקת טרי-טסט / ביוכימיה';
update public.pregnancy_tests set test_name = 'בדיקת מי שפיר'          where test_name = 'בדיקת מי שפיר (אמניוצנטזה)';
update public.pregnancy_tests set test_name = 'סקירת מערכות מפורטת'    where test_name = 'אקו מורפולוגי מפורט';
update public.pregnancy_tests set test_name = 'בדיקת סוכר בהריון'      where test_name = 'העמסת סוכר (OGTT)';
update public.pregnancy_tests set test_name = 'בדיקת דם ונוגדנים'      where test_name = 'בדיקת GBS + אנטיגלובולין';
update public.pregnancy_tests set test_name = 'בדיקת GBS'              where test_name = 'בדיקה וגינלית, תרבית GBS';
update public.pregnancy_tests set test_name = 'מוניטור'                where test_name = 'NST (מוניטור)';
update public.pregnancy_tests set test_name = 'ביקור אחרון לפני הלידה' where test_name = 'ביקור אחרון + תיאום לידה';

update public.exam_push_notified set test_id = 'בדיקות דם ראשונות'      where test_id = 'בדיקת דם ראשונה (HCG, TSH, ספירת דם)';
update public.exam_push_notified set test_id = 'בדיקת סיסי שליה'        where test_id = 'בדיקת סיסי שליה (CVS)';
update public.exam_push_notified set test_id = 'בדיקת סקר משולבת'       where test_id = 'בדיקת טרי-טסט / ביוכימיה';
update public.exam_push_notified set test_id = 'בדיקת מי שפיר'          where test_id = 'בדיקת מי שפיר (אמניוצנטזה)';
update public.exam_push_notified set test_id = 'סקירת מערכות מפורטת'    where test_id = 'אקו מורפולוגי מפורט';
update public.exam_push_notified set test_id = 'בדיקת סוכר בהריון'      where test_id = 'העמסת סוכר (OGTT)';
update public.exam_push_notified set test_id = 'בדיקת דם ונוגדנים'      where test_id = 'בדיקת GBS + אנטיגלובולין';
update public.exam_push_notified set test_id = 'בדיקת GBS'              where test_id = 'בדיקה וגינלית, תרבית GBS';
update public.exam_push_notified set test_id = 'מוניטור'                where test_id = 'NST (מוניטור)';
update public.exam_push_notified set test_id = 'ביקור אחרון לפני הלידה' where test_id = 'ביקור אחרון + תיאום לידה';
