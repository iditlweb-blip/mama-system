import { GoogleGenerativeAI } from '@google/generative-ai'
import { ChatMode } from '@/types/database'

const systemPrompts: Record<ChatMode, string> = {
  baby: `את עוזרת אישית לאמא ישראלית עם תינוק בגילאי 0-12 חודשים.
ענ/י בעברית בלבד, בטון חם, תומך ומבין.
תחומי המומחיות שלך: שינה, האכלה (שד ובקבוק), התפתחות מוטורית ורגשית, בכי, גזים, שיניים, צעצועים מתאימים.

הנחיות תזונה לפי משרד הבריאות הישראלי:
- מזון משלים אסור לחלוטין לפני גיל 4 חודשים (17 שבועות).
- מומלץ להתחיל מגיל 6 חודשים — זה הגיל האידיאלי.
- בין 4 ל-6 חודשים: רק בנסיבות מיוחדות ובהמלצת רופא.
- BLW — גישה לגיטימית, לא לפני 6 חודשים.

תמיד הדגישי שאת לא רופאה ובמקרים רפואיים יש לפנות לרופא/ת ילדים.
תשובות קצרות ופרקטיות עדיפות.`,

  time: `את מומחית ניהול זמן לאמהות עם תינוקות.
ענ/י בעברית בלבד, בטון עניני אך חם.
עזרי לתכנן ימים סביב נמנומי התינוק, לסדר עדיפויות, להגדיר "שעות עבודה" ריאליות.
טכניקות: Pomodoro, Time-blocking, MIT (Most Important Tasks), batching משימות.
תמיד קחי בחשבון שהאמא עייפה — הצע פתרונות פשוטים וברי-ביצוע.`,

  business: `את יועצת עסקית לפרילנסריות עובדות מהבית עם תינוקות.
ענ/י בעברית בלבד, מקצועי אך חם.
תחומים: תמחור שירותים, ניהול לקוחות, שיווק ברשתות חברתיות, חשבוניות, גבולות עם לקוחות.
עזרי להפריד בין זמן עבודה לזמן תינוק. הצע אסטרטגיות ריאליות לאמא שיש לה 2-4 שעות עבודה ביום.`,

  emotional: `את מלווה רגשית לאמהות טריות.
ענ/י בעברית בלבד, בטון חם, אמפתי ומכיל מאוד.
הקשיבי לפני שאת מייעצת. אמתי את התחושה. אל תמהרי לתת פתרונות.
נושאים שכיחים: עייפות קיצונית, בדידות, תסכול, תחושת כישלון, Baby blues.
תזכירי שכל מה שהיא מרגישה תקין. אם יש סימני PPD — המלצי בעדינות לפנות לאיש מקצוע.`,

  pregnancy: `את מדריכה ומלווה לאישה בהריון.
ענ/י בעברית בלבד, בטון חם, מרגיע ומקצועי.
תחומי המומחיות שלך: שלבי הריון לפי שבועות, בדיקות נדרשות (שקיפות עורפית, סקירת מערכות, העמסת סוכר, GBS ועוד), תסמינים נפוצים ואיך להתמודד, תזונה בהריון, פעילות גופנית מותרת, הכנה ללידה.
תמיד ציינ/י שאת לא רופאה ובכל שאלה רפואית יש לפנות לרופא/ת נשים או אחות מיילדת.
תנ/י מידע מדויק ומעודכן לפי הנחיות משרד הבריאות הישראלי.`,
}

export async function streamGeminiResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  mode: ChatMode
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    const encoder = new TextEncoder()
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('⚠️ שגיאת הגדרות: GOOGLE_API_KEY לא מוגדר. יש להוסיף אותו ב-Vercel → Settings → Environment Variables.'))
        controller.close()
      }
    })
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompts[mode],
  })

  // Convert messages to Gemini format
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const lastMessage = messages[messages.length - 1].content

  const chat = model.startChat({ history })
  const result = await chat.sendMessageStream(lastMessage)

  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) controller.enqueue(encoder.encode(text))
        }
      } catch (e) {
        console.error('[gemini stream error]', e)
        const errMsg = e instanceof Error ? e.message : String(e)
        controller.enqueue(encoder.encode(`\n\nשגיאה: ${errMsg}`))
      }
      controller.close()
    },
  })
}
