'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Milk, BedDouble, Droplets, Plus, X, Clock,
  Trash2, Play, Square, Apple, Syringe, CheckCircle2,
  Circle, CalendarPlus, ChevronDown, ChevronUp, AlertTriangle, ChevronRight
} from 'lucide-react'
import { BabyLog, LogType } from '@/types/database'
import { useRouter } from 'next/navigation'

interface HealthEvent {
  id: string
  user_id: string
  type: 'vaccine' | 'checkup' | 'other'
  title: string
  scheduled_date: string
  completed: boolean
  notes?: string | null
}

interface Props {
  logs: BabyLog[]
  userId: string
  babyBirthdate: string | null
  babyName: string | null
  babyGender: 'boy' | 'girl' | null
  initialHealthEvents: HealthEvent[]
}

// ─── Tracker type config ──────────────────────────────────────
const typeConfig = {
  feed:   { label: 'האכלה', icon: Milk,      color: '#7F5268', bg: 'rgba(127,82,104,0.1)',  border: 'rgba(127,82,104,0.25)',  emoji: '🍼' },
  sleep:  { label: 'שינה',  icon: BedDouble, color: '#5C7A6A', bg: 'rgba(92,122,106,0.1)',  border: 'rgba(92,122,106,0.25)',  emoji: '😴' },
  diaper: { label: 'חיתול', icon: Droplets,  color: '#7A6A3C', bg: 'rgba(122,106,60,0.1)',  border: 'rgba(122,106,60,0.25)',  emoji: '🧷' },
}

// ─── Weaning guide data ───────────────────────────────────────
const WEANING_STAGES = [
  {
    fromWeek: 17, toWeek: 20,
    title: 'שלב ראשון — טעימות ראשונות',
    subtitle: '4–5 חודשים',
    emoji: '🥕',
    quantity: '1–3 כפיות',
    frequency: 'פעם ביום',
    timing: 'אחרי האכלת חלב',
    texture: 'פירה חלק מאוד, דק עם חלב אם / מים',
    foods: ['בטטה', 'גזר', 'תפוח', 'אגס', 'קישוא', 'דלעת'],
    avoid: ['דבש', 'מלח', 'סוכר', 'בקר (חלבון)', 'ביצה'],
    allergens: [],
    recipes: [
      { name: '🍠 פירה בטטה', steps: 'בשלי בטטה עד לריכוך, מעכי עם מים/חלב אם לפירה חלק.' },
      { name: '🥕 פירה גזר', steps: 'בשלי גזר, הוסיפי קצת מים לפירה דליל.' },
      { name: '🍎 פירה תפוח', steps: 'אדי/בשלי תפוח, תמעכי. אפשר גם להגיש חי (מגורר דק מאוד).' },
    ],
  },
  {
    fromWeek: 21, toWeek: 26,
    title: 'שלב שני — הרחבת תפריט',
    subtitle: '5–6 חודשים',
    emoji: '🥦',
    quantity: '3–6 כפות',
    frequency: 'פעם–פעמיים ביום',
    timing: 'בין האכלות חלב',
    texture: 'פירה עם קצת גושים קטנים',
    foods: ['ברוקולי', 'אפונה', 'אבוקדו', 'בננה', 'אוכמניות', 'דגני בוקר (שיבולת שועל)'],
    avoid: ['דבש', 'מלח', 'אגוזים שלמים'],
    allergens: ['ניתן להתחיל גלוטן (שיבולת שועל/חיטה)'],
    recipes: [
      { name: '🥑 אבוקדו+בננה', steps: 'מעכי אבוקדו ובננה ביחד — לא צריך בישול!' },
      { name: '🌿 ברוקולי מאודה', steps: 'אדי ברוקולי 8 דק׳, מעכי עם מים לפירה.' },
      { name: '🥣 דייסת שיבולת שועל', steps: 'שיבולת שועל + חלב אם/מים, בישול 3 דק׳.' },
    ],
  },
  {
    fromWeek: 27, toWeek: 34,
    title: 'שלב שלישי — מרקמים ועשיר',
    subtitle: '6.5–8 חודשים',
    emoji: '🍗',
    quantity: '1/4–1/2 כוס לארוחה',
    frequency: '2–3 ארוחות ביום',
    timing: 'ארוחת בוקר, צהריים, ערב',
    texture: 'פירה גס, מרוסק, או BLW — אצבעות רכות',
    foods: ['עוף מבושל', 'דג (סלמון/קרפיון)', 'עדשים', 'יוגורט', 'גבינה בולגרית'],
    avoid: ['דבש', 'מלח', 'סוכר', 'אוכל ים (שרימפס/לובסטר)', 'פטריות נא'],
    allergens: ['ביצה (חלמון קודם)', 'דגים (אחת בשבוע)', 'חלב מוצרים (לא חלב פרה נוזלי)'],
    recipes: [
      { name: '🍗 עוף+ירקות', steps: 'בשלי עוף+גזר+תפו"א, מרסקי לפירה. מניחי גוש עוף לBLW.' },
      { name: '🐟 סלמון מאודה', steps: 'אדי סלמון 10 דק׳, פרקי לחתיכות קטנות. בדקי עצמות!' },
      { name: '🥚 חביתה ביצה', steps: 'חלמון+חלבון, מטגנת בכפית שמן זית, חתכי לרצועות.' },
    ],
  },
  {
    fromWeek: 35, toWeek: 52,
    title: 'שלב רביעי — אוכל משפחתי',
    subtitle: '8–12 חודשים',
    emoji: '🍝',
    quantity: 'כ-150–200 מ"ל לארוחה',
    frequency: '3 ארוחות + 1–2 חטיפים',
    timing: 'תבנית ארוחות קבועה',
    texture: 'גושים רכים, אצבעות, אוכל "משפחתי" מרוסק',
    foods: ['פסטה', 'אורז', 'לחם רך', 'גבינות', 'כל ירק/פרי', 'קטניות'],
    avoid: ['דבש', 'מלח מוסף', 'סוכר', 'אוכל חד-מרגנרין', 'אגוזים שלמים (בטחון)'],
    allergens: ['ניתן כבר לאכול רוב האלרגנים — כולל אגוהי קשיו (טחון)'],
    recipes: [
      { name: '🍝 פסטה+ציר', steps: 'פסטה קצרה + ציר ירקות/עוף ביתי. ללא מלח.' },
      { name: '🫘 עדשות+תרד', steps: 'עדשות כתומות + תרד + גזר. בישול 20 דק׳.' },
      { name: '🍌 חטיף בננה+גבינה', steps: 'פרוסות בננה + גבינת שמנת = חטיף מהיר.' },
    ],
  },
]

const READINESS_CHECKLIST = [
  { id: 'head', label: 'מחזיק/ת ראש זקוף ויושב/ת עם תמיכה', detail: 'צריך ליכולת לאכול בבטחה' },
  { id: 'interest', label: 'מראה עניין באוכל — מסתכל/ת, מושיט/ה יד', detail: 'סימן לבגרות' },
  { id: 'mouth', label: 'מכניס/ה דברים לפה', detail: 'כישור יסוד לאכילה' },
  { id: 'tongue', label: 'לא מוציא/ה אוכל מהפה מיד (ירידה רפלקס דחיפה)', detail: 'מוכנות פיזיולוגית' },
]

// Standard Israeli vaccine schedule (months)
const VACCINE_SCHEDULE = [
  { month: 0,  title: 'הפטיטיס B', desc: 'חיסון ראשון — ניתן בלידה' },
  { month: 2,  title: 'פנטה + פוליו + פנאומוקוק + רוטה', desc: 'חיסון 2 חודשים' },
  { month: 4,  title: 'פנטה + פוליו + פנאומוקוק + רוטה', desc: 'חיסון 4 חודשים' },
  { month: 6,  title: 'פנטה + פוליו + פנאומוקוק + הפטיטיס B', desc: 'חיסון 6 חודשים' },
  { month: 12, title: 'חצבת-אדמת-חזרת (MMR) + אבעבועות רוח', desc: 'חיסון שנה' },
  { month: 18, title: 'בוסטר פנטה + פוליו + המופילוס', desc: 'חיסון 18 חודשים' },
  { month: 24, title: 'הפטיטיס A', desc: 'חיסון שנתיים' },
]

// ─── Main Component ───────────────────────────────────────────
export default function TrackerClient({ logs: initialLogs, userId, babyBirthdate, babyName, babyGender, initialHealthEvents }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'daily' | 'weaning' | 'health'>('daily')
  const [logs, setLogs] = useState(initialLogs)
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>(initialHealthEvents)
  const supabase = createClient()

  // Baby age
  const babyWeeks = babyBirthdate
    ? Math.floor((Date.now() - new Date(babyBirthdate).getTime()) / (7 * 24 * 3600 * 1000))
    : null
  const babyMonths = babyWeeks !== null ? Math.floor(babyWeeks / 4.33) : null

  const todayDate = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
  const genderSuffix = babyGender === 'boy' ? '' : 'ת'

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Back button */}
      <div className="flex justify-end">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs"
          style={{ color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <ChevronRight className="w-3.5 h-3.5" />
          חזרה
        </button>
      </div>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          מעקב {babyName ? babyName : 'תינוק'}  👶
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{todayDate}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {([
          { key: 'daily',   label: '📋 יומי' },
          { key: 'weaning', label: '🥕 טעימות' },
          { key: 'health',  label: '💉 חיסונים' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
            style={activeTab === tab.key
              ? { background: '#7F5268', color: '#fff' }
              : { color: 'var(--text-muted)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Daily */}
      {activeTab === 'daily' && (
        <DailyTab
          logs={logs} setLogs={setLogs}
          userId={userId}
          genderSuffix={genderSuffix}
        />
      )}

      {/* Tab: Weaning */}
      {activeTab === 'weaning' && (
        <WeaningTab babyWeeks={babyWeeks} babyName={babyName} genderSuffix={genderSuffix} />
      )}

      {/* Tab: Health */}
      {activeTab === 'health' && (
        <HealthTab
          healthEvents={healthEvents}
          setHealthEvents={setHealthEvents}
          userId={userId}
          babyBirthdate={babyBirthdate}
          babyMonths={babyMonths}
        />
      )}
    </div>
  )
}

// ─── Daily Tab ────────────────────────────────────────────────
function DailyTab({ logs, setLogs, userId, genderSuffix }: {
  logs: BabyLog[]; setLogs: React.Dispatch<React.SetStateAction<BabyLog[]>>
  userId: string; genderSuffix: string
}) {
  const [showForm, setShowForm] = useState<LogType | null>(null)
  const [saving, setSaving] = useState(false)
  const [sleepTimerActive, setSleepTimerActive] = useState(false)
  const [sleepTimerStart, setSleepTimerStart] = useState<Date | null>(null)
  const [sleepTimerElapsed, setSleepTimerElapsed] = useState(0)
  const [feedType, setFeedType] = useState<'breast' | 'bottle'>('breast')
  const [amount, setAmount] = useState('')
  const [duration, setDuration] = useState('')
  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'both'>('wet')
  const [notes, setNotes] = useState('')
  const [startTime, setStartTime] = useState(() => new Date().toISOString().slice(0, 16))
  const supabase = createClient()

  useEffect(() => {
    if (!sleepTimerActive || !sleepTimerStart) return
    const interval = setInterval(() => {
      setSleepTimerElapsed(Math.floor((Date.now() - sleepTimerStart.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [sleepTimerActive, sleepTimerStart])

  function startSleepTimer() {
    setSleepTimerStart(new Date())
    setSleepTimerActive(true)
    setSleepTimerElapsed(0)
  }

  async function stopSleepTimer() {
    if (!sleepTimerStart) return
    setSleepTimerActive(false)
    const durationMin = Math.floor(sleepTimerElapsed / 60)
    const { data } = await supabase.from('baby_logs').insert({
      user_id: userId, type: 'sleep',
      start_time: sleepTimerStart.toISOString(),
      duration_min: durationMin > 0 ? durationMin : 1,
    }).select().single()
    if (data) setLogs(prev => [data, ...prev])
    setSleepTimerStart(null)
    setSleepTimerElapsed(0)
  }

  function formatTimer(secs: number) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  async function saveLog() {
    if (!showForm) return
    setSaving(true)
    const payload: Partial<BabyLog> = {
      user_id: userId, type: showForm,
      start_time: new Date(startTime).toISOString(),
      notes: notes || null,
    }
    if (showForm === 'feed') {
      payload.feed_type = feedType
      if (amount) payload.amount_ml = parseInt(amount)
      if (duration) payload.duration_min = parseInt(duration)
    }
    if (showForm === 'diaper') payload.diaper_type = diaperType
    if (showForm === 'sleep' && duration) payload.duration_min = parseInt(duration)

    const { data } = await supabase.from('baby_logs').insert(payload).select().single()
    if (data) setLogs(prev => [data, ...prev])
    resetForm()
    setSaving(false)
  }

  function resetForm() {
    setShowForm(null)
    setAmount(''); setDuration(''); setNotes('')
    setFeedType('breast'); setDiaperType('wet')
    setStartTime(new Date().toISOString().slice(0, 16))
  }

  async function deleteLog(id: string) {
    await supabase.from('baby_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const feedLogs   = logs.filter(l => l.type === 'feed')
  const sleepLogs  = logs.filter(l => l.type === 'sleep')
  const diaperLogs = logs.filter(l => l.type === 'diaper')
  const totalSleepMin = sleepLogs.reduce((s, l) => s + (l.duration_min || 0), 0)
  const totalFeedMl   = feedLogs.reduce((s, l) => s + (l.amount_ml || 0), 0)

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard emoji="🍼" color="#7F5268" label="האכלות" value={feedLogs.length}
          sub={totalFeedMl > 0 ? `${totalFeedMl} מ"ל` : `${feedLogs.filter(l => l.duration_min).reduce((s, l) => s + (l.duration_min || 0), 0)} דק׳`} />
        <StatCard emoji="😴" color="#5C7A6A" label="שינה" value={sleepLogs.length}
          sub={totalSleepMin > 0 ? `${Math.floor(totalSleepMin / 60)}:${String(totalSleepMin % 60).padStart(2, '0')}ש׳` : '—'} />
        <StatCard emoji="🧷" color="#4A7C59" label="חיתולים" value={diaperLogs.length}
          sub={`${diaperLogs.filter(l => l.diaper_type === 'dirty' || l.diaper_type === 'both').length} מלוכלך`} />
      </div>

      {/* Sleep Timer */}
      <div className="card" style={sleepTimerActive
        ? { background: 'rgba(92,122,106,0.1)', border: '1px solid rgba(92,122,106,0.3)' }
        : { background: 'var(--surface)' }
      }>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: sleepTimerActive ? 'rgba(92,122,106,0.15)' : 'var(--bg)' }}>
              <BedDouble className="w-5 h-5" style={{ color: '#5C7A6A' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {sleepTimerActive ? `יש${genderSuffix} עכשיו... 😴` : 'טיימר שינה'}
              </p>
              {sleepTimerActive
                ? <p className="text-lg font-mono font-bold" style={{ color: '#5C7A6A' }}>{formatTimer(sleepTimerElapsed)}</p>
                : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>לחצי start כשהתינוק נרדם</p>
              }
            </div>
          </div>
          {sleepTimerActive ? (
            <button onClick={stopSleepTimer}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#5C7A6A' }}>
              <Square className="w-4 h-4" fill="white" /> סיום שינה
            </button>
          ) : (
            <button onClick={startSleepTimer}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#5C7A6A' }}>
              <Play className="w-4 h-4" fill="white" /> Start
            </button>
          )}
        </div>
      </div>

      {/* Quick Add */}
      <div className="grid grid-cols-3 gap-3">
        {(['feed', 'sleep', 'diaper'] as LogType[]).map(type => {
          const { label, color, bg, border, emoji } = typeConfig[type]
          return (
            <button key={type}
              onClick={() => { setStartTime(new Date().toISOString().slice(0, 16)); setShowForm(type) }}
              className="card flex flex-col items-center gap-2 py-4 transition-all hover:scale-105"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <span className="text-2xl">{emoji}</span>
              <div className="flex items-center gap-1">
                <Plus className="w-3 h-3" style={{ color }} />
                <span className="text-xs font-semibold" style={{ color }}>{label}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Log Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50"
          onClick={e => e.target === e.currentTarget && resetForm()}>
          <div className="card w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{typeConfig[showForm].emoji}</span>
                <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>רישום {typeConfig[showForm].label}</h3>
              </div>
              <button onClick={resetForm} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: 'var(--bg)' }}>
                <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>⏰ שעה</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>

            {showForm === 'feed' && (
              <>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>סוג האכלה</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([['breast', '🤱 שד'], ['bottle', '🍼 בקבוק']] as const).map(([ft, lbl]) => (
                      <button key={ft} onClick={() => setFeedType(ft)}
                        className="py-2.5 rounded-xl text-sm font-medium transition-all"
                        style={feedType === ft
                          ? { background: '#7F5268', color: 'white' }
                          : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                        }>{lbl}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {feedType === 'bottle' && (
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>כמות (מ"ל)</label>
                      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="120"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>משך (דקות)</label>
                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="15"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
                </div>
              </>
            )}

            {showForm === 'sleep' && (
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>משך שינה (דקות)</label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="90"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              </div>
            )}

            {showForm === 'diaper' && (
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>סוג חיתול</label>
                <div className="grid grid-cols-3 gap-2">
                  {([['wet', '💧', 'רטוב'], ['dirty', '💩', 'מלוכלך'], ['both', '✨', 'שניהם']] as const).map(([dt, emoji, lbl]) => (
                    <button key={dt} onClick={() => setDiaperType(dt)}
                      className="py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1"
                      style={diaperType === dt
                        ? { background: '#4A7C59', color: 'white' }
                        : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                      }><span>{emoji}</span>{lbl}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>הערות (אופציונלי)</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="הוסיפי הערה..."
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>

            <button onClick={saveLog} disabled={saving}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: typeConfig[showForm].color }}>
              {saving ? 'שומרת...' : `✓ שמירת ${typeConfig[showForm].label}`}
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Clock className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          ציר זמן היום
        </h2>
        {logs.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🌟</p>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>עדיין אין רישומים להיום</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>התחילי לעקוב כדי לראות כאן את היום</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute right-[19px] top-2 bottom-2 w-0.5 rounded-full" style={{ background: 'var(--border)' }} />
            <div className="space-y-3">
              {logs.map(log => {
                const { icon: Icon, color, bg, emoji } = typeConfig[log.type]
                const time = new Date(log.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={log.id} className="flex items-start gap-3 group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                      style={{ background: bg, border: `2px solid ${color}40` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                            <span className="ml-1">{emoji}</span>
                            {buildLogDescription(log)}
                          </p>
                          {log.notes && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{log.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{time}</span>
                          <button onClick={() => deleteLog(log.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3.5 h-3.5" style={{ color: '#C0392B' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Weaning Tab ──────────────────────────────────────────────
function WeaningTab({ babyWeeks, babyName, genderSuffix }: {
  babyWeeks: number | null; babyName: string | null; genderSuffix: string
}) {
  const [checkedItems, setCheckedItems] = useState<string[]>([])
  const [expandedStage, setExpandedStage] = useState<number | null>(null)
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)

  const toggleCheck = (id: string) =>
    setCheckedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const allChecked = READINESS_CHECKLIST.length === checkedItems.length

  // Find current stage
  const currentStage = babyWeeks !== null
    ? WEANING_STAGES.find(s => babyWeeks >= s.fromWeek && babyWeeks <= s.toWeek)
    : null

  const notReadyYet = babyWeeks !== null && babyWeeks < 14

  if (notReadyYet) {
    const weeksLeft = 14 - babyWeeks!
    return (
      <div className="card text-center py-10">
        <p className="text-5xl mb-4">🌱</p>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text)' }}>עוד קצת זמן</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {babyName || 'התינוק'} יהי{genderSuffix} מוכן{genderSuffix} לטעימות ראשונות בעוד כ-{weeksLeft} שבועות (בגיל 4 חודשים).
        </p>
      </div>
    )
  }

  if (babyWeeks === null) {
    return (
      <div className="card text-center py-8">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3" style={{ color: '#B8860B' }} />
        <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>תאריך לידה חסר</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          עדכני תאריך לידה בהגדרות כדי לראות את מדריך הטעימות המותאם.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current stage banner */}
      {currentStage && (
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(127,82,104,0.08)', border: '1px solid rgba(127,82,104,0.15)' }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentStage.emoji}</span>
            <div>
              <p className="font-bold" style={{ color: 'var(--text)' }}>
                {babyName || 'התינוק'} נמצא{genderSuffix} כעת ב{currentStage.title}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                שבוע {babyWeeks} · {currentStage.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Readiness checklist */}
      <div className="card">
        <h2 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>
          ✅ רשימת מוכנות לטעימות
        </h2>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          מומלץ לוודא לפחות 3/4 סימנים לפני התחלה
        </p>
        <div className="space-y-3">
          {READINESS_CHECKLIST.map(item => (
            <button key={item.id} onClick={() => toggleCheck(item.id)}
              className="w-full flex items-start gap-3 text-right">
              {checkedItems.includes(item.id)
                ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#4A7C59' }} />
                : <Circle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--border)' }} />
              }
              <div>
                <p className="text-sm font-medium text-right" style={{ color: 'var(--text)' }}>{item.label}</p>
                <p className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>{item.detail}</p>
              </div>
            </button>
          ))}
        </div>
        {allChecked && (
          <div className="mt-4 rounded-xl p-3 text-center"
            style={{ background: 'rgba(74,124,89,0.1)', border: '1px solid rgba(74,124,89,0.2)' }}>
            <p className="text-sm font-semibold" style={{ color: '#4A7C59' }}>
              🎉 {babyName || 'התינוק'} מוכן{genderSuffix} לטעימות! קדימה!
            </p>
          </div>
        )}
      </div>

      {/* Stages */}
      <div className="space-y-3">
        <h2 className="font-semibold" style={{ color: 'var(--text)' }}>📅 מדריך לפי שלב גיל</h2>
        {WEANING_STAGES.map((stage, idx) => {
          const isCurrent = currentStage === stage
          const isPast = babyWeeks !== null && babyWeeks > stage.toWeek
          const isExpanded = expandedStage === idx

          return (
            <div key={idx} className="card"
              style={isCurrent ? { border: '1.5px solid #7F5268' } : {}}>
              <button onClick={() => setExpandedStage(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stage.emoji}</span>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{stage.title}</p>
                      {isCurrent && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: '#7F5268', color: '#fff' }}>עכשיו</span>
                      )}
                      {isPast && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(74,124,89,0.15)', color: '#4A7C59' }}>עבר</span>
                      )}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{stage.subtitle}</p>
                  </div>
                </div>
                {isExpanded
                  ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                }
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '⚖️ כמות', val: stage.quantity },
                      { label: '🕐 תדירות', val: stage.frequency },
                      { label: '⏰ תזמון', val: stage.timing },
                      { label: '🥣 מרקם', val: stage.texture },
                    ].map(({ label, val }) => (
                      <div key={label} className="rounded-xl p-2.5"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
                        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text)' }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Foods */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text)' }}>✅ מזונות מומלצים:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {stage.foods.map(food => (
                        <span key={food} className="text-xs px-2.5 py-1 rounded-full font-medium"
                          style={{ background: 'rgba(74,124,89,0.12)', color: '#4A7C59' }}>
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Avoid */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#C0392B' }}>⛔ להימנע:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {stage.avoid.map(food => (
                        <span key={food} className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
                          {food}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Allergens */}
                  {stage.allergens.length > 0 && (
                    <div className="rounded-xl p-3"
                      style={{ background: 'rgba(184,134,11,0.08)', border: '1px solid rgba(184,134,11,0.2)' }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: '#B8860B' }}>⚠️ אלרגנים:</p>
                      {stage.allergens.map(a => (
                        <p key={a} className="text-xs" style={{ color: '#92400E' }}>• {a}</p>
                      ))}
                    </div>
                  )}

                  {/* Recipes */}
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text)' }}>👩‍🍳 מתכונים:</p>
                    <div className="space-y-2">
                      {stage.recipes.map(recipe => (
                        <div key={recipe.name} className="rounded-xl overflow-hidden"
                          style={{ border: '1px solid var(--border)' }}>
                          <button
                            onClick={() => setExpandedRecipe(expandedRecipe === recipe.name ? null : recipe.name)}
                            className="w-full flex items-center justify-between px-3 py-2.5"
                            style={{ background: 'var(--bg)' }}>
                            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{recipe.name}</span>
                            {expandedRecipe === recipe.name
                              ? <ChevronUp className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                              : <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                            }
                          </button>
                          {expandedRecipe === recipe.name && (
                            <div className="px-3 pb-3 pt-1"
                              style={{ background: 'var(--surface-2)' }}>
                              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{recipe.steps}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Health / Vaccinations Tab ────────────────────────────────
function HealthTab({ healthEvents, setHealthEvents, userId, babyBirthdate, babyMonths }: {
  healthEvents: HealthEvent[]
  setHealthEvents: React.Dispatch<React.SetStateAction<HealthEvent[]>>
  userId: string; babyBirthdate: string | null; babyMonths: number | null
}) {
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'vaccine' | 'checkup' | 'other'>('vaccine')
  const [newDate, setNewDate] = useState('')
  const [newNotes, setNewNotes] = useState('')

  // Compute suggested schedule
  const suggestedVaccines = babyBirthdate ? VACCINE_SCHEDULE.map(v => {
    const dueDate = new Date(babyBirthdate)
    dueDate.setMonth(dueDate.getMonth() + v.month)
    return { ...v, dueDate, dueDateStr: dueDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }) }
  }) : []

  async function addEvent() {
    if (!newTitle.trim() || !newDate) return
    setSaving(true)

    const payload = {
      user_id: userId,
      type: newType,
      title: newTitle.trim(),
      scheduled_date: newDate,
      completed: false,
      notes: newNotes || null,
    }

    const { data, error } = await supabase.from('health_events').insert(payload).select().single()
    if (data) {
      setHealthEvents(prev => [...prev, data].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)))
    } else if (error) {
      // Graceful fallback
      const local: HealthEvent = { id: crypto.randomUUID(), ...payload }
      setHealthEvents(prev => [...prev, local].sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date)))
    }

    setNewTitle(''); setNewDate(''); setNewNotes(''); setNewType('vaccine')
    setShowForm(false)
    setSaving(false)
  }

  async function toggleComplete(id: string) {
    const event = healthEvents.find(e => e.id === id)
    if (!event) return
    await supabase.from('health_events').update({ completed: !event.completed }).eq('id', id)
    setHealthEvents(prev => prev.map(e => e.id === id ? { ...e, completed: !e.completed } : e))
  }

  async function deleteEvent(id: string) {
    await supabase.from('health_events').delete().eq('id', id)
    setHealthEvents(prev => prev.filter(e => e.id !== id))
  }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = healthEvents.filter(e => !e.completed && e.scheduled_date >= today)
  const past     = healthEvents.filter(e => e.completed || e.scheduled_date < today)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>💉 חיסונים ובדיקות</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>לו״ז חיסונים לפי מזכ״ל משרד הבריאות</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-brand text-sm px-3 py-1.5">
          <CalendarPlus className="w-4 h-4" /> הוסיפי
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card space-y-3">
          <h3 className="font-semibold" style={{ color: 'var(--text)' }}>הוספת אירוע בריאות</h3>
          <div className="grid grid-cols-3 gap-2">
            {([['vaccine', '💉', 'חיסון'], ['checkup', '👶', 'בדיקה'], ['other', '📋', 'אחר']] as const).map(([t, emoji, lbl]) => (
              <button key={t} onClick={() => setNewType(t)}
                className="py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1"
                style={newType === t
                  ? { background: '#7F5268', color: 'white' }
                  : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }>
                <span>{emoji}</span>{lbl}
              </button>
            ))}
          </div>
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="שם החיסון / הבדיקה"
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
          <input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="הערות (אופציונלי)"
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
          <div className="flex gap-2">
            <button onClick={addEvent} disabled={saving || !newTitle.trim() || !newDate}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
              style={{ background: '#7F5268' }}>
              {saving ? 'שומרת...' : 'הוספה'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text)' }}>⏰ עתידיים ({upcoming.length})</p>
          <div className="space-y-2">
            {upcoming.map(event => (
              <EventCard key={event.id} event={event} onToggle={toggleComplete} onDelete={deleteEvent} />
            ))}
          </div>
        </div>
      )}

      {/* Suggested schedule */}
      {babyBirthdate && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text)' }}>📋 לוח חיסונים מומלץ</p>
          <div className="space-y-2">
            {suggestedVaccines.map((v, i) => {
              const isPast = v.dueDate < new Date()
              const isSoon = !isPast && v.dueDate < new Date(Date.now() + 30 * 24 * 3600 * 1000)
              return (
                <div key={i} className="rounded-xl px-3 py-2.5 flex items-center gap-3"
                  style={{
                    background: isPast ? 'rgba(74,124,89,0.06)' : isSoon ? 'rgba(184,134,11,0.06)' : 'var(--surface)',
                    border: `1px solid ${isPast ? 'rgba(74,124,89,0.2)' : isSoon ? 'rgba(184,134,11,0.2)' : 'var(--border)'}`,
                  }}>
                  <span className="text-lg">{isPast ? '✅' : isSoon ? '⏰' : '📅'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{v.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.dueDateStr}</p>
                  </div>
                  {isSoon && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(184,134,11,0.15)', color: '#B8860B' }}>בקרוב</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Past events */}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>היסטוריה ({past.length})</p>
          <div className="space-y-2">
            {past.map(event => (
              <EventCard key={event.id} event={event} onToggle={toggleComplete} onDelete={deleteEvent} />
            ))}
          </div>
        </div>
      )}

      {healthEvents.length === 0 && !babyBirthdate && (
        <div className="card text-center py-8">
          <Syringe className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text)' }}>אין אירועי בריאות עדיין</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            הוסיפי תאריך לידה בהגדרות לקבלת לוח חיסונים אוטומטי
          </p>
        </div>
      )}
    </div>
  )
}

function EventCard({ event, onToggle, onDelete }: {
  event: HealthEvent
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const typeEmoji = { vaccine: '💉', checkup: '👶', other: '📋' }[event.type]
  const dateStr = new Date(event.scheduled_date + 'T00:00:00').toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="rounded-xl px-3 py-2.5 flex items-center gap-3 group"
      style={{
        background: event.completed ? 'rgba(74,124,89,0.06)' : 'var(--surface)',
        border: `1px solid ${event.completed ? 'rgba(74,124,89,0.2)' : 'var(--border)'}`,
        opacity: event.completed ? 0.7 : 1,
      }}>
      <button onClick={() => onToggle(event.id)}>
        {event.completed
          ? <CheckCircle2 className="w-5 h-5" style={{ color: '#4A7C59' }} />
          : <Circle className="w-5 h-5" style={{ color: 'var(--border)' }} />
        }
      </button>
      <span className="text-lg flex-shrink-0">{typeEmoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text)', textDecoration: event.completed ? 'line-through' : 'none' }}>
          {event.title}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dateStr}</p>
        {event.notes && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{event.notes}</p>}
      </div>
      <button onClick={() => onDelete(event.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Trash2 className="w-3.5 h-3.5" style={{ color: '#C0392B' }} />
      </button>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────
function buildLogDescription(log: BabyLog): string {
  if (log.type === 'feed') {
    const parts = []
    if (log.feed_type) parts.push(log.feed_type === 'breast' ? 'שד' : 'בקבוק')
    if (log.amount_ml) parts.push(`${log.amount_ml} מ"ל`)
    if (log.duration_min) parts.push(`${log.duration_min} דק׳`)
    return `האכלה${parts.length ? ' — ' + parts.join(', ') : ''}`
  }
  if (log.type === 'sleep') {
    if (log.duration_min) {
      const h = Math.floor(log.duration_min / 60)
      const m = log.duration_min % 60
      return `שינה — ${h > 0 ? h + 'ש׳ ' : ''}${m > 0 ? m + 'ד׳' : ''}`
    }
    return 'שינה'
  }
  if (log.type === 'diaper') {
    const labels = { wet: 'רטוב', dirty: 'מלוכלך', both: 'רטוב + מלוכלך' }
    return `חיתול${log.diaper_type ? ' — ' + labels[log.diaper_type] : ''}`
  }
  return ''
}

function StatCard({ emoji, color, label, value, sub }: {
  emoji: string; color: string; label: string; value: number; sub: string
}) {
  return (
    <div className="card text-center py-4" style={{ background: `${color}0f`, border: `1px solid ${color}25` }}>
      <span className="text-2xl">{emoji}</span>
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text)' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}
