# התראות פוש - הפעלה (חד-פעמי)

כדי שהתראות באמת יגיעו לטלפון (גם כשהאפליקציה סגורה), צריך להשלים 3 דברים.
כל השלבים הם חד-פעמיים.

## 1. להריץ מיגרציה
ב-Supabase SQL Editor: `supabase/migrations/029_push_notifications.sql`

## 2. להוסיף משתני סביבה ב-Vercel
Project → Settings → Environment Variables → Production, להוסיף בדיוק את אלה
(הערכים כבר נוצרו ונמצאים גם ב-.env.local המקומי שלך):

```
VAPID_PUBLIC_KEY=BIwDqYPqXWsJ7dLoHFocsAXxD0nnW6QFk9vzH858nK6uA5uDdMpch5AhzNHi5of4LV4wPLQqET861Vzk2vfR994
VAPID_PRIVATE_KEY=jNFLK4E80Ys6ToYS7EpzQTyl-KAv6iy8ySiZy7IwO7E
VAPID_SUBJECT=mailto:momsok100@gmail.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BIwDqYPqXWsJ7dLoHFocsAXxD0nnW6QFk9vzH858nK6uA5uDdMpch5AhzNHi5of4LV4wPLQqET861Vzk2vfR994
CRON_SECRET=5271957e26d89d4724f931fe2025e84ef0047948080410ee
```

**חשוב:** `VAPID_PRIVATE_KEY` ו-`CRON_SECRET` הם סודות - אף פעם לא לשתף אותם או להדביק
אותם בשום מקום חוץ מ-Vercel. `NEXT_PUBLIC_VAPID_PUBLIC_KEY` לעומת זאת חייב להתחיל
ב-`NEXT_PUBLIC_` כדי שהדפדפן יוכל להשתמש בו - זה בסדר, המפתח הציבורי הזה לא סודי.

אחרי ההוספה - **Redeploy** לפרויקט.

## 3. להפעיל "שעון" חיצוני שמפעיל את בדיקת התזכורות

התזכורות (משימות, בדיקות הריון, תנומה ארוכה) לא נשלחות לבד - צריך "מישהו" שיבדוק כל
כמה דקות אם הגיע הזמן. בגלל שהתוכנית החינמית של Vercel מריצה cron רק פעם ביום (לא
מספיק לתזכורות מדויקות), הפתרון הפשוט והחינמי הוא שירות חיצוני שפשוט "מצלצל"
בכתובת שלנו כל 5 דקות.

1. להיכנס ל-[cron-job.org](https://cron-job.org) (חינמי, בלי צורך בכרטיס אשראי) ולהירשם.
2. **Create cronjob**:
   - **URL:**
     ```
     https://moms-ok.com/api/cron/notifications?secret=5271957e26d89d4724f931fe2025e84ef0047948080410ee
     ```
   - **Schedule:** כל 5 דקות (Every 5 minutes)
3. לשמור. זהו - מעכשיו זה רץ לבד.

(אם בעתיד תעברי לתוכנית Pro של Vercel, אפשר להחליף את זה ב-Vercel Cron מובנה - תגידי לי ואני אעביר.)

---

## איך זה מתנהג בפועל

- **בכניסה ראשונה לאפליקציה**, כל משתמשת תתבקש (חלון קטן) להפעיל התראות. אם תסרב
  או תדלג, לא ננסה שוב באותו מכשיר.
- **הרשמה מהחנות של iPhone (Safari):** התראות פוש עובדות ב-iPhone רק אם האפליקציה
  **הותקנה** למסך הבית (או הורדה מ-Google Play כ-TWA באנדרואיד - זה תמיד עובד). ב-Safari
  רגיל בלי התקנה, הדפדפן לא תומך בזה - זו מגבלה של אפל, לא של האפליקציה.
- **סוגי ההתראות שהופעלו:**
  1. משימה שהגיע הזמן שלה (`remind_at`)
  2. בדיקת הריון שהחלון שלה מתקרב לסיום
  3. תנומה שנמשכת מעבר לזמן המומלץ לגיל
  4. שאלה חדשה בקהילה - **אלייך בלבד** (הבעלים)
