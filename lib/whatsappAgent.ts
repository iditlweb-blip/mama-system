import Groq from 'groq-sdk'
import { SupabaseClient } from '@supabase/supabase-js'
import { replyAsAssistant } from '@/lib/aiChat'

// ─── The MamaFlow WhatsApp assistant ("עוזרת אישית") ─────────────
// Ella-style: the mother writes in free natural language ("התינוק נרדם",
// "האכלתי בקבוק 120", "כמה חיתולים היום?") and an LLM with tool-calling
// decides which app action to run, executes it against the DB, then replies
// warmly in Hebrew. Anything that isn't an action falls through to the same
// AI chat that powers the in-app assistant (replyAsAssistant).

const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `את "מאמא" — עוזרת אישית חמה בוואטסאפ לאמא ישראלית עם תינוק.
את חלק מאפליקציית MamaFlow ויכולה לבצע פעולות אמיתיות במעקב של האמא.
דברי עברית בלבד, בטון חם, קצר ואישי. השתמשי באימוג'ים במידה.

כשהאמא מבקשת פעולה (שינה, האכלה, חיתול, משימה, שאלה על הנתונים) — הפעילי את הכלי המתאים.
- "נרדם"/"הלך לישון"/"מתחילה שינה" → start_sleep_timer (אם היא מציינת לילה/שנת לילה, night=true)
- "התעורר"/"קם"/"סיום שינה" → stop_sleep_timer
- "האכלתי"/"אכל" → log_feed (זהי אם שד או בקבוק, וכמות אם צוינה)
- "חיתול"/"החלפתי" → log_diaper (רטוב/מלוכלך/שניהם)
- "תזכירי לי"/"תוסיפי משימה"/"צריך" → add_task
- "כמה"/"מתי"/"סיכום"/שאלה על היום → get_today_summary
אל תמציאי נתונים. אם חסר פרט קריטי, שאלי בקצרה. אחרי פעולה — אשרי במשפט קצר וחמים.`

interface AgentCtx {
  supabase: SupabaseClient
  userId: string
}

// ─── Timezone helpers (all "today" math is in Israel local time) ──
function tzOffsetMs(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const parts = dtf.formatToParts(date)
  const m: Record<string, number> = {}
  for (const p of parts) if (p.type !== 'literal') m[p.type] = parseInt(p.value, 10)
  const asUTC = Date.UTC(m.year, m.month - 1, m.day, m.hour, m.minute, m.second)
  return asUTC - date.getTime()
}

function startOfTodayIsrael(): Date {
  const now = new Date()
  const off = tzOffsetMs(now, 'Asia/Jerusalem')
  const local = new Date(now.getTime() + off)
  local.setUTCHours(0, 0, 0, 0)
  return new Date(local.getTime() - off)
}

function fmtIsraelTime(iso: string): string {
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

// ─── Tool schemas exposed to the model ────────────────────────────
const tools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'start_sleep_timer',
      description: 'מתחילה טיימר שינה לתינוק. משתמשים כשהתינוק נרדם/הולך לישון.',
      parameters: {
        type: 'object',
        properties: {
          night: { type: 'boolean', description: 'true אם זו שנת לילה (טיימר לילה), false לנמנום יום' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'stop_sleep_timer',
      description: 'עוצרת את טיימר השינה הפעיל ורושמת את השינה. משתמשים כשהתינוק התעורר.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_feed',
      description: 'רושמת האכלה.',
      parameters: {
        type: 'object',
        properties: {
          feed_type: { type: 'string', enum: ['breast', 'bottle'], description: 'שד או בקבוק' },
          amount_ml: { type: 'number', description: 'כמות במ”ל (רק אם בקבוק וצוינה)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_diaper',
      description: 'רושמת החלפת חיתול.',
      parameters: {
        type: 'object',
        properties: {
          diaper_type: { type: 'string', enum: ['wet', 'dirty', 'both'], description: 'רטוב / מלוכלך / שניהם' },
        },
        required: ['diaper_type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_task',
      description: 'מוסיפה משימה לרשימת המשימות של האמא.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'תוכן המשימה' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_today_summary',
      description: 'מחזירה סיכום של היום: כמה האכלות, חיתולים, שינה, מתי האכלה אחרונה, והאם יש טיימר פעיל.',
      parameters: { type: 'object', properties: {} },
    },
  },
]

// ─── Tool executors (server-side, against the DB) ─────────────────
async function execTool(ctx: AgentCtx, name: string, args: Record<string, unknown>): Promise<string> {
  const { supabase, userId } = ctx
  switch (name) {
    case 'start_sleep_timer': {
      const night = !!args.night
      await supabase.from('active_sleep_timers').upsert({
        user_id: userId, start_time: new Date().toISOString(), is_night: night, source: 'whatsapp',
      })
      return JSON.stringify({ ok: true, night })
    }
    case 'stop_sleep_timer': {
      const { data: timer } = await supabase
        .from('active_sleep_timers')
        .select('start_time, is_night')
        .eq('user_id', userId)
        .maybeSingle()
      if (!timer?.start_time) return JSON.stringify({ ok: false, reason: 'no_active_timer' })
      const startMs = new Date(timer.start_time).getTime()
      const endMs = Date.now()
      const durationMin = Math.max(1, Math.floor((endMs - startMs) / 60000))
      await supabase.from('active_sleep_timers').delete().eq('user_id', userId)
      await supabase.from('baby_logs').insert({
        user_id: userId, type: 'sleep',
        start_time: new Date(startMs).toISOString(),
        end_time: new Date(endMs).toISOString(),
        duration_min: durationMin, is_night: !!timer.is_night,
      })
      return JSON.stringify({ ok: true, duration_min: durationMin, is_night: !!timer.is_night })
    }
    case 'log_feed': {
      const feedType = args.feed_type === 'bottle' || args.feed_type === 'breast' ? args.feed_type : null
      const amount = typeof args.amount_ml === 'number' ? args.amount_ml : null
      await supabase.from('baby_logs').insert({
        user_id: userId, type: 'feed', feed_type: feedType, amount_ml: amount,
        start_time: new Date().toISOString(),
      })
      return JSON.stringify({ ok: true, feed_type: feedType, amount_ml: amount })
    }
    case 'log_diaper': {
      const dt = ['wet', 'dirty', 'both'].includes(String(args.diaper_type)) ? args.diaper_type : 'wet'
      await supabase.from('baby_logs').insert({
        user_id: userId, type: 'diaper', diaper_type: dt,
        start_time: new Date().toISOString(),
      })
      return JSON.stringify({ ok: true, diaper_type: dt })
    }
    case 'add_task': {
      const title = String(args.title || '').trim()
      if (!title) return JSON.stringify({ ok: false, reason: 'empty_title' })
      await supabase.from('tasks').insert({
        user_id: userId, title, category: 'baby', status: 'todo', priority: 'medium',
      })
      return JSON.stringify({ ok: true, title })
    }
    case 'get_today_summary': {
      const since = startOfTodayIsrael().toISOString()
      const { data: logs } = await supabase
        .from('baby_logs')
        .select('type, start_time, duration_min')
        .eq('user_id', userId)
        .gte('start_time', since)
        .order('start_time', { ascending: false })
      const { data: timer } = await supabase
        .from('active_sleep_timers').select('start_time').eq('user_id', userId).maybeSingle()
      const rows = logs ?? []
      const feeds = rows.filter(r => r.type === 'feed')
      const diapers = rows.filter(r => r.type === 'diaper')
      const sleeps = rows.filter(r => r.type === 'sleep')
      const lastFeed = feeds[0]
      const sleepMin = sleeps.reduce((s, r) => s + (r.duration_min || 0), 0)
      return JSON.stringify({
        ok: true,
        feeds: feeds.length,
        diapers: diapers.length,
        naps: sleeps.length,
        total_sleep_min: sleepMin,
        last_feed_time: lastFeed ? fmtIsraelTime(lastFeed.start_time) : null,
        timer_active: !!timer?.start_time,
      })
    }
    default:
      return JSON.stringify({ ok: false, reason: 'unknown_tool' })
  }
}

// ─── Agent loop ───────────────────────────────────────────────────
// Runs the model, executes any tool calls, feeds results back, and returns
// the final Hebrew reply. Falls back to the in-app AI assistant for pure
// conversation (no tool call).
export async function runWhatsAppAgent(ctx: AgentCtx, userMessage: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return '⚠️ שגיאת הגדרות בצד השרת (GROQ_API_KEY).'
  const groq = new Groq({ apiKey })

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userMessage },
  ]

  try {
    let usedTool = false
    for (let hop = 0; hop < 4; hop++) {
      const completion = await groq.chat.completions.create({
        model: MODEL, messages, tools, tool_choice: 'auto', max_tokens: 800,
      })
      const msg = completion.choices[0]?.message
      if (!msg) break
      messages.push(msg)

      const calls = msg.tool_calls
      if (!calls || calls.length === 0) {
        // No tool: either the model answered directly, or it's small talk /
        // a knowledge question — hand off to the richer in-app assistant.
        if (usedTool) return msg.content?.trim() || 'רשמתי ✅'
        return await replyAsAssistant(ctx.supabase, ctx.userId, userMessage)
      }

      usedTool = true
      for (const call of calls) {
        let args: Record<string, unknown> = {}
        try { args = JSON.parse(call.function.arguments || '{}') } catch { /* keep {} */ }
        const result = await execTool(ctx, call.function.name, args)
        messages.push({ role: 'tool', tool_call_id: call.id, content: result })
      }
    }
    return 'רשמתי ✅'
  } catch (e) {
    console.error('[whatsapp agent error]', e)
    return 'אופס, משהו השתבש. נסי שוב עוד רגע 🙏'
  }
}
