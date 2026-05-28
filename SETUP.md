# MamaFlow — הוראות הגדרה

## 1. Supabase (מסד נתונים + אימות)

1. לכי ל-[supabase.com](https://supabase.com) → יצרי פרויקט חינמי
2. לכי ל-**Settings → API** → העתיקי:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. לכי ל-**SQL Editor** → הריצי את הקובץ `supabase/migrations/001_initial.sql`
4. לכי ל-**Authentication → Providers** → הפעילי Google:
   - [צרי Google OAuth credentials](https://console.cloud.google.com/)
   - הזיני `Client ID` ו-`Client Secret` ב-Supabase

## 2. Anthropic API (צ'אטבוט AI)

1. לכי ל-[console.anthropic.com](https://console.anthropic.com)
2. צרי API key → הכניסי כ-`ANTHROPIC_API_KEY`

## 3. .env.local

העתיקי את `.env.example` ל-`.env.local` ומלאי את הערכים:

```bash
cp .env.example .env.local
# ערכי את .env.local עם הפרטים שלך
```

## 4. הפעלה

```bash
npm run dev
# פתחי http://localhost:3000
```

## 5. Supabase — Auth Callback URL

ב-Supabase → **Authentication → URL Configuration** → הוסיפי:
```
http://localhost:3000/api/auth/callback
```
(בהמשך לפרודאקשן: `https://yourdomain.com/api/auth/callback`)

---

## מבנה הפרויקט

```
app/
  (app)/          ← עמודים מוגנים (דורשים כניסה)
    dashboard/    ← דשבורד ראשי
    tracker/      ← מעקב תינוק יומי
    tasks/        ← Kanban + Pomodoro
    development/  ← התפתחות 0-12 חודשים
    chat/         ← צ'אטבוט AI
  auth/           ← דף כניסה/הרשמה
  api/chat/       ← Claude API endpoint
lib/
  milestones.ts   ← כל תוכן ההתפתחות
  motivations.ts  ← 50+ משפטי מוטיבציה
  claude.ts       ← Anthropic SDK wrapper
```

## דיפלוי ל-Vercel

```bash
npx vercel
# הוסיפי Environment Variables ב-Vercel Dashboard
```
