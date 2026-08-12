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

-- exam_push_notified has a primary key on (user_id, test_id), so a plain
-- rename can collide: the cron may already have written a NEW-named row for
-- a user (deployed code) before this migration renamed her OLD-named row to
-- match. Each rename is guarded to skip when that collision would happen,
-- then a cleanup pass drops the now-redundant old-named leftovers (a user
-- who already has the new-named row doesn't need the old one too - both
-- meant "already notified about this test").
do $$
declare
  pair record;
begin
  for pair in
    select * from (values
      ('בדיקת דם ראשונה (HCG, TSH, ספירת דם)', 'בדיקות דם ראשונות'),
      ('בדיקת סיסי שליה (CVS)',                 'בדיקת סיסי שליה'),
      ('בדיקת טרי-טסט / ביוכימיה',              'בדיקת סקר משולבת'),
      ('בדיקת מי שפיר (אמניוצנטזה)',            'בדיקת מי שפיר'),
      ('אקו מורפולוגי מפורט',                    'סקירת מערכות מפורטת'),
      ('העמסת סוכר (OGTT)',                      'בדיקת סוכר בהריון'),
      ('בדיקת GBS + אנטיגלובולין',               'בדיקת דם ונוגדנים'),
      ('בדיקה וגינלית, תרבית GBS',               'בדיקת GBS'),
      ('NST (מוניטור)',                          'מוניטור'),
      ('ביקור אחרון + תיאום לידה',               'ביקור אחרון לפני הלידה')
    ) as t(old_name, new_name)
  loop
    update public.exam_push_notified t
    set test_id = pair.new_name
    where t.test_id = pair.old_name
      and not exists (
        select 1 from public.exam_push_notified t2
        where t2.user_id = t.user_id and t2.test_id = pair.new_name
      );

    delete from public.exam_push_notified where test_id = pair.old_name;
  end loop;
end $$;
