import Groq from 'groq-sdk'
import { ChatMode } from '@/types/database'

// Groq retires models with little notice, and this has now bitten the chat
// twice: first `llama-3.3-70b-versatile`, then `groq/compound-mini` - both
// vanished and every chat turn came back as a 404 model_not_found. Keeping
// the ids here (and importing them where they're needed) means the next
// retirement is a one-line fix instead of a hunt.
//
// To check what the account can actually serve right now:
//   curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
//
// CHAT_MODEL is the best Hebrew model left on the account. The two
// alternatives were measured and rejected: `qwen/qwen3.8-27b` writes broken
// Hebrew (and puts the fetal anatomy scan at weeks 34-36), and
// `openai/gpt-oss-20b` spends its whole token budget on reasoning and
// returns an empty message. gpt-oss-120b on its own mistranslates
// Israeli-specific terms - it read "סקירת מערכות" as a general review of
// the mother's body systems - so ISRAELI_TERMS below pins those down in the
// system prompt instead of relying on the model knowing them.
export const CHAT_MODEL = 'openai/gpt-oss-120b'

// The WhatsApp agent needs function calling, which the retired compound
// models rejected outright ("tool calling is not supported with this
// model"). gpt-oss-120b does support it, so chat and tools now happen to
// share one model - but the two names stay separate so a future retirement
// can move one without disturbing the other.
export const TOOL_MODEL = 'openai/gpt-oss-120b'

// gpt-oss is a reasoning model: its hidden reasoning tokens are billed
// against max_tokens, and on the 20b variant they consumed the entire
// budget and left no answer at all. 'low' keeps reasoning at ~15 tokens a
// turn, and the ceiling is generous enough that a long Hebrew answer isn't
// truncated mid-sentence by reasoning overhead.
const REASONING_EFFORT = 'low' as const
const MAX_TOKENS = 2048

// gpt-oss-120b knows these phrases only as literal Hebrew, so it translates
// them back into whatever the English words suggest. Spelling out what they
// actually mean in Israel is what keeps answers about tests and schedules
// correct - verified against both pregnancy modes before shipping.
const ISRAELI_TERMS = `מונחים ישראליים - זו המשמעות שלהם בישראל, אל תתרגמי אותם מאנגלית:
- "סקירת מערכות" = בדיקת אולטרסאונד של איברי העובר. סקירה מוקדמת בשבועות 14-16, סקירה מאוחרת בשבועות 20-24.
- "שקיפות עורפית" = אולטרסאונד בשבועות 11-13+6 להערכת סיכון לתסמונת דאון.
- "סוכר העמסה" = בדיקת העמסת גלוקוז לאיתור סוכרת הריון, בשבועות 24-28.
- "טיפת חלב" = מרפאת בריאות המשפחה (חיסונים ומעקב התפתחות).
- "קופת חולים" = מבטח הבריאות (כללית / מכבי / מאוחדת / לאומית).
- "חופשת לידה" = דמי לידה מהביטוח הלאומי.`

const systemPrompts: Record<ChatMode, string> = {
  baby: `את עוזרת אישית לאמא ישראלית עם תינוק בגילאי 0-12 חודשים.
ענ/י בעברית בלבד, בטון חם, תומך ומבין.
תחומי המומחיות שלך: שינה, האכלה (שד ובקבוק), התפתחות מוטורית ורגשית, בכי, גזים, שיניים, צעצועים מתאימים.

הנחיות תזונה לפי משרד הבריאות הישראלי:
- מזון משלים אסור לחלוטין לפני גיל 4 חודשים (17 שבועות).
- מומלץ להתחיל מגיל 6 חודשים - זה הגיל האידיאלי.
- בין 4 ל-6 חודשים: רק בנסיבות מיוחדות ובהמלצת רופא.
- BLW - גישה לגיטימית, לא לפני 6 חודשים.

${ISRAELI_TERMS}

תמיד הדגישי שאת לא רופאה ובמקרים רפואיים יש לפנות לרופא/ת ילדים.
תשובות קצרות ופרקטיות עדיפות.`,

  time: `את מומחית ניהול זמן לאמהות עם תינוקות.
ענ/י בעברית בלבד, בטון עניני אך חם.
עזרי לתכנן ימים סביב נמנומי התינוק, לסדר עדיפויות, להגדיר "שעות עבודה" ריאליות.
טכניקות: Pomodoro, Time-blocking, MIT (Most Important Tasks), batching משימות.
תמיד קחי בחשבון שהאמא עייפה - הצע פתרונות פשוטים וברי-ביצוע.`,

  business: `את יועצת עסקית לפרילנסריות עובדות מהבית עם תינוקות.
ענ/י בעברית בלבד, מקצועי אך חם.
תחומים: תמחור שירותים, ניהול לקוחות, שיווק ברשתות חברתיות, חשבוניות, גבולות עם לקוחות.
עזרי להפריד בין זמן עבודה לזמן תינוק. הצע אסטרטגיות ריאליות לאמא שיש לה 2-4 שעות עבודה ביום.`,

  emotional: `את מלווה רגשית לאמהות טריות.
ענ/י בעברית בלבד, בטון חם, אמפתי ומכיל מאוד.
הקשיבי לפני שאת מייעצת. אמתי את התחושה. אל תמהרי לתת פתרונות.
נושאים שכיחים: עייפות קיצונית, בדידות, תסכול, תחושת כישלון, Baby blues.
תזכירי שכל מה שהיא מרגישה תקין. אם יש סימני PPD - המלצי בעדינות לפנות לאיש מקצוע.`,

  pregnancy: `את עוזרת לאמא בהריון בישראל - שאלות על תסמינים, שבועות, בדיקות, והכנה ללידה.
ענ/י בעברית בלבד, בחמלה ובמקצועיות.

${ISRAELI_TERMS}

את לא רופאה - במקרים רפואיים, או כשיש חשש, יש לפנות לרופא/ה המטפל/ת או למיילדת.
תשובות קצרות ופרקטיות עדיפות.`,
}

export async function streamGroqResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  mode: ChatMode
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    const encoder = new TextEncoder()
    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('⚠️ שגיאת הגדרות: GROQ_API_KEY לא מוגדר. יש להוסיף אותו ב-Vercel → Settings → Environment Variables.'))
        controller.close()
      }
    })
  }

  const groq = new Groq({ apiKey })

  const stream = await groq.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: 'system', content: systemPrompts[mode] },
      ...messages,
    ],
    stream: true,
    max_tokens: MAX_TOKENS,
    reasoning_effort: REASONING_EFFORT,
  })

  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let sentAnything = false
      try {
        for await (const chunk of stream) {
          // Reasoning models also emit `delta.reasoning`; only `delta.content`
          // is the answer, so the hidden chain-of-thought never reaches the UI.
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) {
            sentAnything = true
            controller.enqueue(encoder.encode(text))
          }
        }
        // A finished stream that produced no content means reasoning ate the
        // whole budget - say something rather than show an empty bubble.
        if (!sentAnything) {
          controller.enqueue(encoder.encode('לא הצלחתי לנסח תשובה הפעם, נסי לשאול שוב.'))
        }
      } catch (e) {
        console.error('[groq stream error]', e)
        // The raw provider error (model ids, quota text) isn't something to
        // show a mother mid-conversation; it goes to the server log above.
        controller.enqueue(encoder.encode(
          sentAnything ? '\n\n(התשובה נקטעה, נסי שוב)' : '⚠️ שגיאה זמנית בצ׳אט, נסי שוב בעוד רגע.'
        ))
      }
      controller.close()
    },
  })
}

// Non-streaming variant for server-to-server callers (e.g. the WhatsApp
// webhook) that need one complete reply to forward as a single message,
// rather than a token stream to render incrementally in the browser.
export async function getGroqReply(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  mode: ChatMode
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return '⚠️ שגיאת הגדרות: GROQ_API_KEY לא מוגדר.'

  const groq = new Groq({ apiKey })

  try {
    const completion = await groq.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: systemPrompts[mode] },
        ...messages,
      ],
      max_tokens: MAX_TOKENS,
      reasoning_effort: REASONING_EFFORT,
    })
    return completion.choices[0]?.message?.content?.trim() || 'לא הצלחתי לייצר תשובה, נסי שוב.'
  } catch (e) {
    console.error('[groq reply error]', e)
    // Raw provider errors used to be returned verbatim, so a retired model
    // showed up in WhatsApp as English 404 text.
    return 'שגיאה זמנית, נסי שוב בעוד רגע.'
  }
}
