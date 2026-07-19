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

## 3. בוט וואטסאפ — העוזרת האישית "מאמא" (אופציונלי)

הבוט מאפשר לאמא לכתוב בשפה חופשית בוואטסאפ ("התינוק נרדם", "האכלתי בקבוק 120",
"כמה חיתולים היום?") והעוזרת מבצעת את הפעולה במעקב ועונה בעברית.

### א. מסד הנתונים
הריצי ב-**SQL Editor** את `supabase/migrations/010_whatsapp_bot.sql`
(מוסיף `profiles.whatsapp_number`, את הטבלאות `active_sleep_timers`,
`whatsapp_link_codes`, `whatsapp_documents`, ואת ה-Storage bucket `whatsapp-docs`).

### ב. Groq API (מנוע ה-AI)
1. לכי ל-[console.groq.com](https://console.groq.com) → צרי API key
2. הכניסי כ-`GROQ_API_KEY` ב-`.env.local`

### ג. WhatsApp Cloud API (Meta)
1. לכי ל-[developers.facebook.com](https://developers.facebook.com) → צרי App מסוג **Business**
2. הוסיפי את המוצר **WhatsApp** → **API Setup**:
   - העתיקי את **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - הפיקי **Access Token** (מומלץ System User token קבוע) → `WHATSAPP_ACCESS_TOKEN`
3. **Settings → Basic** → העתיקי **App Secret** → `WHATSAPP_APP_SECRET`
4. בחרי מחרוזת סודית כלשהי ל-`WHATSAPP_VERIFY_TOKEN`
5. הזיני את מספר הבוט (בפורמט בינלאומי, למשל `972501234567`) ל-`NEXT_PUBLIC_WHATSAPP_BOT_NUMBER`
6. **Configuration → Webhook** → הזיני:
   - **Callback URL**: `https://yourdomain.com/api/whatsapp/webhook`
   - **Verify Token**: אותה מחרוזת של `WHATSAPP_VERIFY_TOKEN`
   - הירשמי (Subscribe) לשדה **messages**

### ד. חיבור המספר של האמא
באפליקציה: **הגדרות → חיבור וואטסאפ → יצירת קוד חיבור**, ואז לשלוח את הקוד
לבוט בוואטסאפ. הקוד תקף ל-15 דקות.

## 4. .env.local

העתיקי את `.env.example` ל-`.env.local` ומלאי את הערכים:

```bash
cp .env.example .env.local
# ערכי את .env.local עם הפרטים שלך
```

## 5. הפעלה

```bash
npm run dev
# פתחי http://localhost:3000
```

## 6. Supabase — Auth Callback URL

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
