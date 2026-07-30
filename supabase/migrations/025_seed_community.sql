-- ─────────────────────────────────────────────────────────────
-- 025 – Starter community content (sample Q&A so the page isn't empty)
-- Run this AFTER 024_community.sql, in Supabase → SQL Editor.
--
-- All sample rows are attached to the OWNER account (momsok100@gmail.com) as
-- user_id, with friendly display names. They are ordinary rows - the owner can
-- edit or delete any of them from the admin panel. Safe to re-run: fixed UUIDs
-- + ON CONFLICT (id) DO NOTHING.
--
-- If the owner account doesn't exist yet, the cross join yields no rows and
-- nothing is inserted (no error).
-- ─────────────────────────────────────────────────────────────

with owner as (
  select id from auth.users where lower(email) = 'momsok100@gmail.com' limit 1
)
insert into public.community_questions (id, user_id, author_name, title, body, category, status, created_at)
select v.id, owner.id, v.author_name, v.title, v.body, v.category, 'published', now() - v.age
from owner, (values
  ('a1111111-0000-4000-8000-000000000001'::uuid, 'מיטל', 'התינוקת שלי מתעוררת כל שעה בלילה, זה נורמלי?',
   'בת חודשיים, מתעוררת המון בלילה ואני מותשת. יש למישהי טיפ שעזר?', 'שינה', interval '3 days'),
  ('a1111111-0000-4000-8000-000000000002'::uuid, 'רותם', 'כאב בהנקה גם אחרי שבועיים - למי לפנות?',
   'ההנקה עדיין כואבת לי למרות שניסיתי לתקן תפיסה. שווה יועצת הנקה?', 'הנקה', interval '2 days'),
  ('a1111111-0000-4000-8000-000000000003'::uuid, 'נועה', 'מתי הכנסתן שגרה לתינוק?',
   'שומעת הרבה על "שגרה" ולא בטוחה מאיזה גיל זה רלוונטי. שתפו מהניסיון שלכן.', 'התפתחות', interval '1 day')
) as v(id, author_name, title, body, category, age)
on conflict (id) do nothing;

with owner as (
  select id from auth.users where lower(email) = 'momsok100@gmail.com' limit 1
)
insert into public.community_answers (id, question_id, user_id, author_name, body, status, created_at)
select v.id, v.question_id, owner.id, v.author_name, v.body, 'published', now() - v.age
from owner, (values
  ('b2222222-0000-4000-8000-000000000001'::uuid, 'a1111111-0000-4000-8000-000000000001'::uuid, 'שירן',
   'אצלי זה נרגע סביב 3-4 חודשים. בינתיים ניסיתי להאריך את חלון הערות האחרון קצת. חיזוק גדול, זה שלב!', interval '2 days'),
  ('b2222222-0000-4000-8000-000000000002'::uuid, 'a1111111-0000-4000-8000-000000000001'::uuid, 'דנה',
   'התייעצתי עם טיפת חלב וזה עזר לי לוודא שהיא אוכלת מספיק ביום. לפעמים זה קשור.', interval '1 day'),
  ('b2222222-0000-4000-8000-000000000003'::uuid, 'a1111111-0000-4000-8000-000000000002'::uuid, 'אור',
   'ממש כן. פגישה אחת עם יועצת הנקה מוסמכת שינתה לי הכל. אל תחכי אם כואב.', interval '1 day')
) as v(id, question_id, author_name, body, age)
on conflict (id) do nothing;
