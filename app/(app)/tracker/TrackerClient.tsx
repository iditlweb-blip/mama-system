'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Milk, BedDouble, Droplets, Plus, X, Clock,
  Trash2, Play, Square, Syringe,
  Circle, ChevronRight,
  ClipboardList, Carrot, Baby, Droplet, Sparkles, Star,
  Check, Clock3, Moon, Sunrise, Pencil, Activity, FileSpreadsheet,
} from 'lucide-react'
import { BabyLog, LogType } from '@/types/database'
import { useRouter } from 'next/navigation'
import { useSleepTimer, LOG_ADDED_EVT } from '@/lib/useSleepTimer'
import { getActiveParent, setActiveParent, PARENT_EVT, PARENT_LABEL, PARENT_COLOR, type Parent } from '@/lib/activeParent'
import dynamic from 'next/dynamic'
import type { HealthEvent } from './HealthTab'
import ExportModal from './ExportModal'
import { buildLogDescription } from './logUtils'
import MusicPlayer from './MusicPlayer'

// Weaning guide and health/vaccine tabs carry sizeable static Hebrew data
// (and their own icon sets) that most sessions never touch - lazy-load them
// so that weight isn't in the initial JS for the default "daily" tab.
const WeaningTab = dynamic(() => import('./WeaningTab'), {
  loading: () => <TabLoading />,
})
const HealthTab = dynamic(() => import('./HealthTab'), {
  loading: () => <TabLoading />,
})
const SleepArchiveTab = dynamic(() => import('./SleepArchiveTab'), {
  loading: () => <TabLoading />,
})

function TabLoading() {
  return (
    <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>
      טוענת...
    </div>
  )
}

interface Props {
  logs: BabyLog[]
  userId: string
  babyBirthdate: string | null
  babyName: string | null
  babyGender: 'boy' | 'girl' | null
  initialHealthEvents: HealthEvent[]
  napDroppedBand: string | null
}

// ─── Tracker type config ──────────────────────────────────────
const typeConfig = {
  feed:     { label: 'האכלה',  icon: Milk,      color: '#7F5268', bg: 'rgba(127,82,104,0.1)',  border: 'rgba(127,82,104,0.25)' },
  sleep:    { label: 'שינה',   icon: BedDouble, color: '#5C7A6A', bg: 'rgba(92,122,106,0.1)',  border: 'rgba(92,122,106,0.25)' },
  diaper:   { label: 'חיתול',  icon: Droplets,  color: '#7A6A3C', bg: 'rgba(122,106,60,0.1)',  border: 'rgba(122,106,60,0.25)' },
  activity: { label: 'פעילות', icon: Activity,  color: '#5C6BA0', bg: 'rgba(92,107,160,0.1)',  border: 'rgba(92,107,160,0.25)' },
}

// Quick-select chips for an activity log's context - toggled into activity_tags.
const ACTIVITY_TAGS = ['בחוץ', 'משטח פעילות', 'חברים', 'בריכה', 'משפחה'] as const

// ─── Age-based sleep map (0-36 months) ────────────────────────
// Values mirror a pediatric infant-sleep chart by age band. Within each band
// the recommended wake window is a range (wwMin→wwMax); we spread it
// progressively across the day so the first morning window is the shortest and
// the pre-bedtime window is the longest, matching how sleep pressure builds.
// The extra fields (nap length, naps/day, day & night sleep, bedtime, note)
// are shown as reference so the mother gets the full picture for the age.
interface SleepRow {
  maxWeeks: number        // upper bound of the band, in weeks of age
  label: string
  wwMin: number           // recommended wake window - min (minutes)
  wwMax: number           // recommended wake window - max (minutes)
  napsForCalc: number     // representative daily naps used by the predictions
  napsLabel: string       // naps/day as shown in the chart (e.g. "4-6")
  napLenMin: number       // representative nap length for chaining (minutes)
  napLenLabel: string     // average nap length as shown
  dayLabel: string        // total daytime sleep
  nightLabel: string      // total nighttime sleep
  bedtime: string         // recommended bedtime range
  note: string
}

const SLEEP_MAP: SleepRow[] = [
  {
    maxWeeks: 6, label: '0-6 שבועות', wwMin: 30, wwMax: 60,
    napsForCalc: 5, napsLabel: '4-6', napLenMin: 60, napLenLabel: '20 דק’ - 3 ש’',
    dayLabel: '4-8 ש’', nightLabel: '8-10 ש’', bedtime: '21:00-00:00',
    note: 'בשלב הזה היממה מתחלקת בעיקר בין שינה, אכילה, החתלה וקרבה. עדיין אין הפרדה של ממש בין יום ללילה.',
  },
  {
    maxWeeks: 13, label: '6 שבועות - 3 חודשים', wwMin: 40, wwMax: 90,
    napsForCalc: 4, napsLabel: '4-5', napLenMin: 75, napLenLabel: '½ ש’ - 2 ש’',
    dayLabel: '4-5 ש’', nightLabel: '9-11 ש’', bedtime: '20:00-22:00',
    note: 'לאט לאט נבנית ההבחנה בין יום ללילה. שכיבה על הבטן בזמן ערות וחשיפה לאור טבעי מסייעות לייצב את השגרה היומית.',
  },
  {
    maxWeeks: 22, label: '3-5 חודשים', wwMin: 60, wwMax: 150,
    napsForCalc: 4, napsLabel: '3-4', napLenMin: 60, napLenLabel: '½ ש’ - 2 ש’',
    dayLabel: '3-4½ ש’', nightLabel: '10-12 ש’', bedtime: '18:30-20:00',
    note: 'בסביבות גיל 4 חודשים חלה תמורה בשינה - מחזורי השינה נעשים בשלים יותר, ולעיתים הרגלים שעבדו קודם כבר פחות מתאימים.',
  },
  {
    maxWeeks: 26, label: '5-6 חודשים', wwMin: 105, wwMax: 165,
    napsForCalc: 3, napsLabel: '3-4', napLenMin: 60, napLenLabel: '½ ש’ - 2 ש’',
    dayLabel: '3-4 ש’', nightLabel: '10-12 ש’', bedtime: '18:30-20:00',
    note: 'מעבר מדורג מארבע תנומות לשלוש. לא פעם דווקא התנומה של אחר הצהריים הולכת ומתקצרת עד שנעלמת.',
  },
  {
    maxWeeks: 35, label: '6-8 חודשים', wwMin: 135, wwMax: 210,
    napsForCalc: 3, napsLabel: '2-3', napLenMin: 90, napLenLabel: '1-2 ש’',
    dayLabel: '3-3½ ש’', nightLabel: '10-12 ש’', bedtime: '18:30-20:00',
    note: 'תקופת מעבר משלוש תנומות לשתיים. קפיצות מוטוריות ותרגול יכולות שרכשו זה עתה עשויים לשבש את השינה באופן זמני.',
  },
  {
    maxWeeks: 43, label: '8-10 חודשים', wwMin: 180, wwMax: 240,
    napsForCalc: 2, napsLabel: '2', napLenMin: 90, napLenLabel: '1-2 ש’',
    dayLabel: '2-3 ש’', nightLabel: '10-12 ש’', bedtime: '18:30-19:30',
    note: 'בדרך כלל כבר קיימות שתי תנומות יציבות. חרדת פרידה וזינוקים התפתחותיים עלולים להקשות על ההירדמות.',
  },
  {
    maxWeeks: 52, label: '10-12 חודשים', wwMin: 210, wwMax: 270,
    napsForCalc: 2, napsLabel: '2', napLenMin: 90, napLenLabel: '1-2 ש’',
    dayLabel: '2-3 ש’', nightLabel: '10-12 ש’', bedtime: '18:30-19:30',
    note: 'יש תינוקות שמתחילים לסרב לתנומה השנייה, אך התנגדות כזו לא בהכרח מעידה שהם מוכנים לוותר עליה.',
  },
  {
    maxWeeks: 78, label: '12-18 חודשים', wwMin: 210, wwMax: 300,
    napsForCalc: 2, napsLabel: '1-2', napLenMin: 105, napLenLabel: '1-2½ ש’',
    dayLabel: '1-2½ ש’', nightLabel: '10-12 ש’', bedtime: '18:30-19:30',
    note: 'מגיל 14 חודשים לרוב מתחיל מעבר איטי לתנומה יחידה. בימים עם תנומה אחת בלבד כדאי לפעמים להשכיב מעט מוקדם יותר.',
  },
  {
    maxWeeks: 104, label: '18-24 חודשים', wwMin: 270, wwMax: 390,
    napsForCalc: 1, napsLabel: '1', napLenMin: 90, napLenLabel: '1-2 ש’',
    dayLabel: '1-2 ש’', nightLabel: '10-12 ש’', bedtime: '19:00-20:00',
    note: 'בשלב זה בדרך כלל נותרה תנומת צהריים אחת קבועה. עדיין חשוב לשים לב לסימני עייפות יתר לקראת שעות הערב.',
  },
  {
    maxWeeks: 9999, label: '24-36 חודשים', wwMin: 300, wwMax: 420,
    napsForCalc: 1, napsLabel: '1', napLenMin: 90, napLenLabel: '1-2 ש’',
    dayLabel: '1-2 ש’', nightLabel: '10-12 ש’', bedtime: '19:00-20:00',
    note: 'לקראת גיל 3 חלק מהילדים מתחילים לזנוח את שנת הצהריים. ביום ללא תנומה ייתכן שתידרש השכבה מוקדמת יותר בלילה.',
  },
]

// Build the progressive list of wake windows for a day: naps+1 windows,
// linearly growing from wwMin (first, morning) to wwMax (last before bed).
function makeWindows(start: number, end: number, naps: number): number[] {
  const count = Math.max(1, naps + 1)
  if (count === 1) return [Math.round((start + end) / 2)]
  const step = (end - start) / (count - 1)
  return Array.from({ length: count }, (_, i) => Math.round(start + step * i))
}

interface SleepBand extends SleepRow {
  naps: number        // = napsForCalc, used by the prediction engine
  windows: number[]   // progressive wake windows (minutes), length = naps + 1
}

// napAdjust lets the mother commit to fewer naps than the chart default once
// the baby is clearly transitioning (e.g. 3→2). We spread the SAME wake-window
// range across fewer naps, so each awake stretch grows - exactly what a
// dropped-nap day looks like. Clamped so we never go below a single nap.
function getSleepBand(weeks: number, napAdjust = 0): SleepBand {
  const row = SLEEP_MAP.find(r => weeks <= r.maxWeeks) || SLEEP_MAP[SLEEP_MAP.length - 1]
  const naps = Math.max(1, row.napsForCalc + napAdjust)
  const windows = makeWindows(row.wwMin, row.wwMax, naps)
  return { ...row, naps, windows }
}

// The chart stores bedtime as a range like "18:30-20:00". The upper bound is
// the "latest recommended" bedtime for the age; we use it both as the cutoff
// that triggers the fewer-naps suggestion and as the number shown to the
// mother - so the guidance always matches the table, at every age. Newborns
// ("21:00-00:00") have no real fixed bedtime; midnight → cutoff disabled.
function parseLatestBedtime(bedtime: string): { minutes: number; label: string } {
  const parts = bedtime.split(/[--]/)
  const last = (parts[parts.length - 1] || '').trim()
  const [hh, mm] = last.split(':').map(s => parseInt(s, 10))
  const h = Number.isNaN(hh) ? 21 : hh
  const m = Number.isNaN(mm) ? 0 : mm
  // 00:00 = midnight = "no cutoff" (put it past the end of the day).
  const minutes = h === 0 ? 24 * 60 : h * 60 + m
  return { minutes, label: last }
}

interface SleepPlan {
  band: SleepBand
  napsTaken: number
  napsRemaining: number
  minutesToNextNap: number | null   // null when we can't compute (sleeping / no wake data)
  nextNapAt: Date | null
  bedtime: Date | null
  sleeping: boolean
  hasWakeData: boolean
  recommendFewerNaps: boolean
  recommendedNapsRemaining: number | null
  latestBedtimeLabel: string        // upper bound of the age band's bedtime range, e.g. "20:00"
}

// Sleeping = a timer is currently running (day nap or night). nightSleeping =
// that running timer was started as a "night timer" - in that case we skip
// next-nap predictions entirely (the running sleep IS the night sleep).
function computeSleepPlan(weeks: number, logs: BabyLog[], now: number, sleeping: boolean, nightSleeping: boolean, napAdjust = 0): SleepPlan {
  const band = getSleepBand(weeks, napAdjust)

  const sleeps = logs
    .filter(l => l.type === 'sleep')
    .map(l => ({ start: new Date(l.start_time), dur: l.duration_min || 0, isNight: !!l.is_night }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  // Count daytime sleeps as naps already taken today - night sleeps (flagged
  // explicitly, or falling outside 05:00-19:00) don't count toward the daily
  // nap total and don't drive the next-nap prediction.
  const napsTaken = sleeps.filter(s => {
    if (s.isNight) return false
    const h = s.start.getHours()
    return h >= 5 && h < 19
  }).length
  const napsRemaining = Math.max(0, band.naps - napsTaken)

  // Most recent moment the baby woke up = end of the last completed sleep
  // (ignoring an in-progress night sleep, which has no "wake" yet).
  const completedSleeps = sleeps.filter(s => s.dur > 0)
  let lastWakeEnd: Date | null = null
  if (completedSleeps.length) {
    const last = completedSleeps[completedSleeps.length - 1]
    lastWakeEnd = new Date(last.start.getTime() + last.dur * 60000)
  }
  const hasWakeData = lastWakeEnd !== null

  // The wake window to use right now depends on how many naps already happened
  // today: after the morning wake it's windows[0] (shortest), after nap 1 it's
  // windows[1], and so on - so the countdown lengthens as the day goes on.
  const winIdx = Math.min(napsTaken, band.windows.length - 1)
  const nextWindow = band.windows[winIdx]

  let nextNapAt: Date | null = null
  let minutesToNextNap: number | null = null
  if (!sleeping && !nightSleeping && lastWakeEnd) {
    nextNapAt = new Date(lastWakeEnd.getTime() + nextWindow * 60000)
    minutesToNextNap = Math.round((nextNapAt.getTime() - now) / 60000)
  }

  // Predicted bedtime: chain the remaining naps and their (progressive) wake
  // windows from the last time the baby was awake. We only predict once there's
  // at least one real sleep logged today - without any data we'd otherwise
  // assume a 07:00 wake and confidently show a bedtime the mother never
  // implied, which is confusing. No data → no prediction.
  const N = napsRemaining
  // Remaining windows from now until bedtime = windows[napsTaken..end]
  // (that's napsRemaining + 1 windows, the last one being the pre-bed window).
  const remainingWindowsSum = band.windows.slice(napsTaken).reduce((a, b) => a + b, 0)
  let bedtime: Date | null = null
  if (lastWakeEnd) {
    bedtime = new Date(lastWakeEnd.getTime() + (remainingWindowsSum + N * band.napLenMin) * 60000)
    if (bedtime.getTime() < now) bedtime = null // overdue → show "soon" instead of a stale time
  }

  // If the chained prediction lands after 21:00, suggest trimming naps so the
  // baby doesn't get overtired - find the largest remaining-nap count that
  // still lands at/before 21:00 from the same anchor.
  // Cutoff = the age band's own latest recommended bedtime (from the chart),
  // not a fixed 21:00. So at 6-8m the line is drawn at 20:00, and it moves with
  // the age automatically.
  const { minutes: cutoffMin, label: latestBedtimeLabel } = parseLatestBedtime(band.bedtime)
  let recommendFewerNaps = false
  let recommendedNapsRemaining: number | null = null
  if (bedtime) {
    const cutoff = new Date(now); cutoff.setHours(0, 0, 0, 0)
    cutoff.setMinutes(cutoffMin)
    if (bedtime.getTime() > cutoff.getTime()) {
      let found: number | null = null
      for (let n = N - 1; n >= 0; n--) {
        // n naps from now → windows[napsTaken .. napsTaken+n] plus n nap lengths
        const winsSum = band.windows.slice(napsTaken, napsTaken + n + 1).reduce((a, b) => a + b, 0)
        const trial = new Date(lastWakeEnd!.getTime() + (winsSum + n * band.napLenMin) * 60000)
        if (trial.getTime() <= cutoff.getTime()) { found = n; break }
      }
      recommendFewerNaps = true
      recommendedNapsRemaining = found ?? 0
    }
  }

  return { band, napsTaken, napsRemaining, minutesToNextNap, nextNapAt, bedtime, sleeping, hasWakeData, recommendFewerNaps, recommendedNapsRemaining, latestBedtimeLabel }
}

function fmtDur(min: number): string {
  if (min <= 0) return 'עכשיו'
  const h = Math.floor(min / 60), m = min % 60
  if (h > 0) return m > 0 ? `${h} ש’ ו-${m} דק’` : `${h} ש’`
  return `${m} דק’`
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

// Compact wake-window duration for the age card, e.g. "45 דק’" or "2:30 ש’".
function fmtWW(min: number): string {
  const h = Math.floor(min / 60), m = min % 60
  if (h === 0) return `${m} דק’`
  return m === 0 ? `${h} ש’` : `${h}:${String(m).padStart(2, '0')} ש’`
}

// datetime-local inputs expect LOCAL wall-clock time. new Date().toISOString()
// returns UTC, which shifts the value by the timezone offset (e.g. 16:00 →
// 13:00 in Israel summer). Format against the local offset instead.
function toLocalInput(d: Date): string {
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

// ─── Main Component ───────────────────────────────────────────
export default function TrackerClient({ logs: initialLogs, userId, babyBirthdate, babyName, babyGender, initialHealthEvents, napDroppedBand }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'daily' | 'archive' | 'weaning' | 'health'>('daily')
  const [logs, setLogs] = useState(initialLogs)
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>(initialHealthEvents)
  const [showExport, setShowExport] = useState(false)
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
      {/* Back button + export */}
      <div className="flex justify-between">
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{ color: '#4A7C59', background: 'rgba(74,124,89,0.1)', border: '1px solid rgba(74,124,89,0.25)' }}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          ייצוא לאקסל
        </button>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs"
          style={{ color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <ChevronRight className="w-3.5 h-3.5" />
          חזרה
        </button>
      </div>
      {showExport && <ExportModal userId={userId} babyName={babyName} onClose={() => setShowExport(false)} />}
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
          מעקב {babyName ? babyName : 'תינוק'}
          <Baby className="w-5 h-5" style={{ color: '#7F5268' }} />
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{todayDate}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {([
          { key: 'daily',   label: 'יומי',     icon: ClipboardList },
          { key: 'archive', label: 'ארכיון', icon: Moon },
          { key: 'weaning', label: 'טעימות',   icon: Carrot },
          { key: 'health',  label: 'חיסונים',  icon: Syringe },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1"
            style={activeTab === tab.key
              ? { background: '#7F5268', color: '#fff' }
              : { color: 'var(--text-muted)' }
            }
          >
            <tab.icon className="w-3.5 h-3.5" />
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
          babyWeeks={babyWeeks}
          babyName={babyName}
          napDroppedBand={napDroppedBand}
        />
      )}

      {/* Tab: Sleep archive */}
      {activeTab === 'archive' && (
        <SleepArchiveTab babyName={babyName} />
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
function DailyTab({ logs, setLogs, userId, genderSuffix, babyWeeks, babyName, napDroppedBand }: {
  logs: BabyLog[]; setLogs: React.Dispatch<React.SetStateAction<BabyLog[]>>
  userId: string; genderSuffix: string
  babyWeeks: number | null; babyName: string | null
  napDroppedBand: string | null
}) {
  const [showForm, setShowForm] = useState<LogType | null>(null)
  const [saving, setSaving] = useState(false)
  const timer = useSleepTimer(userId)
  const [feedType, setFeedType] = useState<'breast' | 'bottle'>('breast')
  const [feedLeft, setFeedLeft] = useState('')    // minutes on the left breast
  const [feedRight, setFeedRight] = useState('')  // minutes on the right breast
  const [logBy, setLogBy] = useState<Parent | ''>('')  // who logged this entry ('' = don't state)
  const [amount, setAmount] = useState('')
  const [duration, setDuration] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'both'>('wet')
  const [activityTags, setActivityTags] = useState<string[]>([])
  const [sleepQuality, setSleepQuality] = useState<'light' | 'short' | 'good' | ''>('')
  const [sleepPosition, setSleepPosition] = useState<'stomach' | 'back' | ''>('')
  const [fellAsleepBy, setFellAsleepBy] = useState<'nursing' | 'alone' | 'stroller' | 'arms' | 'carrier' | 'other' | ''>('')
  const [notes, setNotes] = useState('')
  const [startTime, setStartTime] = useState(() => toLocalInput(new Date()))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const supabase = createClient()

  // Feminine when the baby is a girl (genderSuffix is 'ת' for girls, '' for
  // boys). Some verbs inflect by prefix, not suffix (e.g. יגיע→תגיע), so we
  // pick whole words rather than appending a suffix.
  const isGirl = genderSuffix === 'ת'

  // Tick every 30s so the "time until next nap" countdown stays fresh.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  // Which parent is logging on this device (mom/dad) - every entry is stamped
  // with it. Synced across the app via a custom event + localStorage.
  const [activeParent, setActiveParentState] = useState<Parent | null>(null)
  useEffect(() => {
    setActiveParentState(getActiveParent())
    const on = (e: Event) => setActiveParentState((e as CustomEvent<Parent | null>).detail)
    window.addEventListener(PARENT_EVT, on)
    return () => window.removeEventListener(PARENT_EVT, on)
  }, [])

  // "We've dropped a nap" - a choice the mother makes when the app suggests it.
  // Stored per age band on the profile (migration 019) so it syncs across her
  // devices and never leaks into the next stage: once the baby grows into a
  // band whose default already has fewer naps, the flag simply doesn't apply.
  const bandLabel = babyWeeks !== null ? getSleepBand(babyWeeks).label : ''
  const [dropOneNap, setDropOneNap] = useState(napDroppedBand != null && napDroppedBand === bandLabel)
  useEffect(() => {
    setDropOneNap(napDroppedBand != null && napDroppedBand === bandLabel)
  }, [napDroppedBand, bandLabel])
  function toggleDropNap(v: boolean) {
    setDropOneNap(v)
    ;(async () => {
      await supabase.from('profiles').update({ nap_dropped_band: v ? bandLabel : null }).eq('id', userId)
    })()
  }
  const napAdjust = dropOneNap ? -1 : 0

  const sleepPlan = useMemo(() => (
    babyWeeks !== null
      ? computeSleepPlan(babyWeeks, logs, now, timer.active, timer.active && timer.isNight, napAdjust)
      : null
  ), [babyWeeks, logs, now, timer.active, timer.isNight, napAdjust])

  // A stopped timer (from here OR the always-mounted global bar) broadcasts
  // its new sleep log; add it to the list here so it appears immediately.
  // Dedupe by id so a stop triggered from this screen isn't shown twice.
  useEffect(() => {
    const onLogAdded = (e: Event) => {
      const log = (e as CustomEvent<BabyLog>).detail
      if (!log) return
      setLogs(prev => (prev.some(l => l.id === log.id) ? prev : [log, ...prev]))
    }
    window.addEventListener(LOG_ADDED_EVT, onLogAdded)
    return () => window.removeEventListener(LOG_ADDED_EVT, onLogAdded)
  }, [setLogs])

  async function stopSleepTimer() {
    const log = await timer.stop()
    if (!log) {
      alert('לא הצלחנו לשמור את השינה. נסי שוב בעוד רגע - הטיימר עדיין פועל.')
    }
  }

  async function saveLog() {
    if (!showForm) return
    setSaving(true)
    // Fields that vary by type - reset the ones that don't apply so an edit
    // that changes context doesn't leave stale values behind.
    const payload: Partial<BabyLog> = {
      user_id: userId, type: showForm,
      start_time: new Date(startTime).toISOString(),
      notes: notes || null,
      feed_type: null,
      feed_side: null,
      feed_left_min: null,
      feed_right_min: null,
      amount_ml: null,
      diaper_type: null,
      activity_tags: null,
      sleep_quality: null,
      sleep_position: null,
      fell_asleep_by: null,
      duration_min: null,
      end_time: null,
      logged_by: logBy || null,
    }
    if (showForm === 'feed') {
      payload.feed_type = feedType
      if (feedType === 'breast') {
        // Per-side minutes; total duration is their sum.
        const l = parseInt(feedLeft) || 0
        const r = parseInt(feedRight) || 0
        payload.feed_left_min = l || null
        payload.feed_right_min = r || null
        payload.feed_side = l && r ? null : l ? 'left' : r ? 'right' : null
        if (l + r > 0) payload.duration_min = l + r
        else if (duration) payload.duration_min = parseInt(duration)
      } else {
        if (amount) payload.amount_ml = parseInt(amount)
        if (duration) payload.duration_min = parseInt(duration)
      }
    }
    if (showForm === 'diaper') payload.diaper_type = diaperType
    if (showForm === 'activity') payload.activity_tags = activityTags.length ? activityTags : null
    if (showForm === 'sleep') {
      payload.sleep_quality = sleepQuality || null
      payload.sleep_position = sleepPosition || null
      payload.fell_asleep_by = fellAsleepBy || null
    }
    if (showForm === 'sleep' || showForm === 'activity') {
      // Prefer an explicit end time - compute duration from the gap so
      // start/end stay consistent. Fall back to a manual duration (sleep only).
      if (wakeTime) {
        const start = new Date(startTime)
        const end = new Date(wakeTime)
        if (end.getTime() > start.getTime()) {
          payload.end_time = end.toISOString()
          payload.duration_min = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
        }
      } else if (duration) {
        payload.duration_min = parseInt(duration)
      }
    }

    if (editingId) {
      const { data } = await supabase.from('baby_logs').update(payload).eq('id', editingId).select().single()
      if (data) setLogs(prev => prev.map(l => (l.id === editingId ? data : l)))
    } else {
      const { data } = await supabase.from('baby_logs').insert(payload).select().single()
      if (data) setLogs(prev => [data, ...prev])
    }
    resetForm()
    setSaving(false)
  }

  function resetForm() {
    setShowForm(null)
    setEditingId(null)
    setAmount(''); setDuration(''); setNotes(''); setWakeTime('')
    setFeedType('breast'); setFeedLeft(''); setFeedRight(''); setDiaperType('wet')
    setActivityTags([])
    setSleepQuality(''); setSleepPosition(''); setFellAsleepBy('')
    setLogBy(activeParent ?? '')
    setStartTime(toLocalInput(new Date()))
  }

  function editLog(log: BabyLog) {
    setEditingId(log.id)
    setShowForm(log.type)
    setStartTime(toLocalInput(new Date(log.start_time)))
    setWakeTime(log.end_time ? toLocalInput(new Date(log.end_time)) : '')
    setFeedType(log.feed_type === 'bottle' ? 'bottle' : 'breast')
    setFeedLeft(log.feed_left_min != null ? String(log.feed_left_min) : (log.feed_side === 'left' && log.duration_min ? String(log.duration_min) : ''))
    setFeedRight(log.feed_right_min != null ? String(log.feed_right_min) : (log.feed_side === 'right' && log.duration_min ? String(log.duration_min) : ''))
    setLogBy((log.logged_by as Parent) ?? '')
    setAmount(log.amount_ml != null ? String(log.amount_ml) : '')
    setDuration(log.duration_min != null ? String(log.duration_min) : '')
    setDiaperType((log.diaper_type as 'wet' | 'dirty' | 'both') || 'wet')
    setActivityTags(log.activity_tags || [])
    setSleepQuality(log.sleep_quality || '')
    setSleepPosition(log.sleep_position || '')
    setFellAsleepBy(log.fell_asleep_by || '')
    setNotes(log.notes || '')
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
      {/* Who's logging on this device (mom/dad) - stamps every entry */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-1">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>מי מתעד/ת עכשיו?</span>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {([null, 'mom', 'dad'] as const).map(p => (
            <button key={p ?? 'none'} onClick={() => { setActiveParent(p); setLogBy(p ?? '') }}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
              style={activeParent === p
                ? (p ? { background: PARENT_COLOR[p].bg, color: PARENT_COLOR[p].text } : { background: '#7F5268', color: 'white' })
                : { background: 'transparent', color: 'var(--text-muted)' }}>
              {p ? PARENT_LABEL[p] : 'ללא'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Milk} color="#7F5268" label="האכלות" value={feedLogs.length}
          sub={totalFeedMl > 0 ? `${totalFeedMl} מ"ל` : `${feedLogs.filter(l => l.duration_min).reduce((s, l) => s + (l.duration_min || 0), 0)} דק’`} />
        <StatCard icon={BedDouble} color="#5C7A6A" label="שינה" value={sleepLogs.length}
          sub={totalSleepMin > 0 ? `${Math.floor(totalSleepMin / 60)}:${String(totalSleepMin % 60).padStart(2, '0')}ש’` : '-'} />
        <StatCard icon={Droplets} color="#4A7C59" label="חיתולים" value={diaperLogs.length}
          sub={`${diaperLogs.filter(l => l.diaper_type === 'dirty' || l.diaper_type === 'both').length} מלוכלך`} />
      </div>

      {/* Sleep windows & naps by age */}
      {sleepPlan && (
        <div className="card" style={{ background: 'rgba(92,122,106,0.07)', border: '1px solid rgba(92,122,106,0.25)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Moon className="w-4 h-4" style={{ color: '#5C7A6A' }} />
              חלונות שינה וערות
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(92,122,106,0.15)', color: '#5C7A6A' }}>
              {sleepPlan.band.label}
            </span>
          </div>

          {/* Full sleep map for the age band (mirrors the pediatric chart) */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <InfoTile icon={Sunrise} label="חלון ערות מומלץ"
              value={sleepPlan.band.wwMin === sleepPlan.band.wwMax
                ? fmtWW(sleepPlan.band.wwMin)
                : `${fmtWW(sleepPlan.band.wwMin)}-${fmtWW(sleepPlan.band.wwMax)}`} />
            <InfoTile icon={BedDouble} label="תנומות ביום" value={`${sleepPlan.band.napsLabel} תנומות`} />
            <InfoTile icon={Clock3} label="אורך תנומה ממוצע" value={sleepPlan.band.napLenLabel} />
            <InfoTile icon={Sunrise} label="שינה ביום" value={sleepPlan.band.dayLabel} />
            <InfoTile icon={Moon} label="שינה בלילה" value={sleepPlan.band.nightLabel} />
            <InfoTile icon={Moon} label="שעת השכבה מומלצת" value={sleepPlan.band.bedtime} />
          </div>

          {/* Age-band note + a clear "this is guidance, not a rule" framing */}
          <div className="rounded-xl px-3 py-2.5 mb-3 text-xs leading-relaxed"
            style={{ background: 'rgba(127,82,104,0.06)', border: '1px solid rgba(127,82,104,0.15)', color: 'var(--text-muted)' }}>
            <p className="font-semibold mb-1 flex items-center gap-1.5" style={{ color: '#7F5268' }}>
              <Sparkles className="w-3.5 h-3.5" /> מידע והמלצות לגיל הזה
            </p>
            <p className="mb-1.5">{sleepPlan.band.note}</p>
            <p>המספרים כאן הם המלצה כללית לפי טבלת שינה לגיל - לא כלל מחייב. כל תינוק שונה, והכי חשוב לעקוב אחרי סימני העייפות {isGirl ? 'שלה' : 'שלו'} ולהשכיב בהתאם.</p>
          </div>

          {/* Live insights based on what was marked today */}
          <div className="space-y-2">
            {/* Remaining naps until night */}
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface)' }}>
              <BedDouble className="w-4 h-4 flex-shrink-0" style={{ color: '#5C7A6A' }} />
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                {sleepPlan.napsRemaining > 0
                  ? <>נותרו עוד <b>{sleepPlan.napsRemaining}</b> שנ”צים עד הלילה <span style={{ color: 'var(--text-muted)' }}>({sleepPlan.napsTaken} כבר סומנו)</span></>
                  : <>כל השנ”צים להיום הושלמו - נשארה רק שנת הלילה 🌙</>
                }
              </p>
            </div>

            {/* Time until next nap - hidden once all naps for the day are done
                (and no timer running), since the bedtime row already covers
                when the night sleep should start. */}
            {(timer.active || sleepPlan.napsRemaining > 0) && (
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface)' }}>
                <Clock3 className="w-4 h-4 flex-shrink-0" style={{ color: '#7F5268' }} />
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  {timer.active && timer.isNight
                    ? <>{`מתעדת שינת לילה 🌙 - הטיימר רץ`}</>
                    : sleepPlan.sleeping
                      ? <>{`${isGirl ? 'ישנה' : 'ישן'} עכשיו 😴 - הטיימר רץ`}</>
                      : !sleepPlan.hasWakeData
                        ? <span style={{ color: 'var(--text-muted)' }}>סמני שינה כדי לחשב מתי השנ”צ הבא</span>
                        : sleepPlan.minutesToNextNap !== null && sleepPlan.minutesToNextNap > 0
                          ? <>השנ”צ הבא בעוד <b>{fmtDur(sleepPlan.minutesToNextNap)}</b> {sleepPlan.nextNapAt && <span style={{ color: 'var(--text-muted)' }}>(בערך ב-{fmtTime(sleepPlan.nextNapAt)})</span>}</>
                          : <span style={{ color: '#5C7A6A', fontWeight: 600 }}>הגיע הזמן לשנ”צ 💤</span>
                  }
                </p>
              </div>
            )}

            {/* Predicted bedtime + fewer-naps recommendation - one combined,
                calm block. When the chained calculation lands after the age's
                latest recommended bedtime we don't show a separate scary
                warning; we explain the number and the suggestion together, and
                offer a checkbox to actually drop a nap (recalculates live). */}
            {!(timer.active && timer.isNight) && (() => {
              const meaningfulDrop = sleepPlan.recommendFewerNaps
                && sleepPlan.recommendedNapsRemaining !== null
                && sleepPlan.recommendedNapsRemaining !== sleepPlan.napsRemaining
              const showLate = !!sleepPlan.bedtime && meaningfulDrop && sleepPlan.napsRemaining > 0
              const showCheckbox = showLate || dropOneNap
              const baby = babyName || 'התינוק'
              return (
                <div className="rounded-xl px-3 py-2.5" style={showLate
                  ? { background: 'rgba(196,120,45,0.10)', border: '1px solid rgba(196,120,45,0.25)' }
                  : { background: 'rgba(92,122,106,0.12)', border: '1px solid rgba(92,122,106,0.2)' }}>
                  <div className="flex items-start gap-2.5">
                    <Moon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: showLate ? '#C4782D' : '#5C7A6A' }} />
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                      {sleepPlan.bedtime
                        ? showLate
                          ? <>לפי חישוב השנ”צים עד כה, על פי חלונות הערות הלילה של {baby} צפוי להתחיל בערך ב-<b>{fmtTime(sleepPlan.bedtime)}</b>. בגיל הזה מומלץ להשכיב לא יאוחר מ-<b>{sleepPlan.latestBedtimeLabel}</b> - לכן כדאי לשקול להוריד שנ”צ אחד.</>
                          : <>הלילה של {baby} צפוי להתחיל בערך ב-<b style={{ color: '#5C7A6A' }}>{fmtTime(sleepPlan.bedtime)}</b> 🌙{dropOneNap ? <span style={{ color: 'var(--text-muted)' }}> (מחושב לפי תנומה אחת פחות)</span> : ''}</>
                        : !sleepPlan.hasWakeData
                          ? <span style={{ color: 'var(--text-muted)' }}>{`סמני שינה כדי לחזות מתי יתחיל הלילה של ${baby}`}</span>
                          : <>{`הלילה של ${baby} מתקרב 🌙 כדאי להתחיל שגרת שינה`}</>
                      }
                    </p>
                  </div>
                  {showCheckbox && (
                    <label className="flex items-center gap-2 mt-2.5 pt-2.5 cursor-pointer"
                      style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                      <input type="checkbox" checked={dropOneNap}
                        onChange={e => toggleDropNap(e.target.checked)}
                        className="w-4 h-4 rounded flex-shrink-0" style={{ accentColor: '#5C7A6A' }} />
                      <span className="text-xs" style={{ color: 'var(--text)' }}>
                        {dropOneNap
                          ? <>החישוב מעודכן לתנומה אחת פחות ✓ <span style={{ color: 'var(--text-muted)' }}>(אפשר לבטל כדי לחזור)</span></>
                          : <>{`${baby} כבר מוכן${isGirl ? 'ה' : ''} לתנומה אחת פחות - עדכני את החישוב`}</>
                        }
                      </span>
                    </label>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Sleep Timer */}
      <div className="card" style={timer.active
        ? { background: timer.isNight ? 'rgba(60,60,110,0.1)' : 'rgba(92,122,106,0.1)', border: `1px solid ${timer.isNight ? 'rgba(60,60,110,0.3)' : 'rgba(92,122,106,0.3)'}` }
        : { background: 'var(--surface)' }
      }>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: timer.active ? (timer.isNight ? 'rgba(60,60,110,0.15)' : 'rgba(92,122,106,0.15)') : 'var(--bg)' }}>
              {timer.active && timer.isNight
                ? <Moon className="w-5 h-5" style={{ color: '#3C3C6E' }} />
                : <BedDouble className="w-5 h-5" style={{ color: '#5C7A6A' }} />
              }
            </div>
            <div>
              <p className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--text)' }}>
                {timer.active
                  ? timer.isNight
                    ? <>{`שנת לילה...`}<Moon className="w-3.5 h-3.5" style={{ color: '#3C3C6E' }} /></>
                    : <>{`${isGirl ? 'ישנה' : 'ישן'} עכשיו...`}<BedDouble className="w-3.5 h-3.5" style={{ color: '#5C7A6A' }} /></>
                  : 'טיימר שינה'
                }
              </p>
              {timer.active
                ? <p className="text-lg font-mono font-bold" style={{ color: timer.isNight ? '#3C3C6E' : '#5C7A6A' }}>{timer.formatTimer(timer.elapsed)}</p>
                : <p className="text-xs" style={{ color: 'var(--text-muted)' }}>לחצי start כשהתינוק נרדם</p>
              }
            </div>
          </div>
          {timer.active ? (
            <button onClick={stopSleepTimer} disabled={timer.stopping}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: timer.isNight ? '#3C3C6E' : '#5C7A6A' }}>
              <Square className="w-4 h-4" fill="white" /> סיום שינה
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => timer.start({ night: true })} title="טיימר לילה - לא ישפיע על חישוב השנ”צ הבא"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(60,60,110,0.1)', color: '#3C3C6E', border: '1px solid rgba(60,60,110,0.25)' }}>
                <Moon className="w-4 h-4" /> טיימר לילה
              </button>
              <button onClick={() => timer.start()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#5C7A6A' }}>
                <Play className="w-4 h-4" fill="white" /> Start
              </button>
            </div>
          )}
        </div>
      </div>

      {/* During a running NIGHT sleep, let the mother log a feed (with its own
          nested nursing/bottle timer) and a diaper without stopping the sleep
          timer - night wakings for feeds/changes are part of the same sleep. */}
      {timer.active && timer.isNight && <NightExtras userId={userId} />}

      <MusicPlayer />

      {/* Quick Add */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['feed', 'sleep', 'diaper', 'activity'] as LogType[]).map(type => {
          const { label, color, bg, border, icon: Icon } = typeConfig[type]
          return (
            <button key={type}
              onClick={() => { setStartTime(toLocalInput(new Date())); setWakeTime(''); setShowForm(type) }}
              className="card flex flex-col items-center gap-2 py-4 transition-all hover:scale-105"
              style={{ background: bg, border: `1px solid ${border}` }}>
              <Icon className="w-6 h-6" style={{ color }} />
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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 pb-[calc(64px+env(safe-area-inset-bottom)+1rem)] md:pb-4 bg-black/50"
          onClick={e => e.target === e.currentTarget && resetForm()}>
          <div className="card w-full max-w-sm space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => { const ModalIcon = typeConfig[showForm].icon; return <ModalIcon className="w-6 h-6" style={{ color: typeConfig[showForm].color }} /> })()}
                <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{editingId ? 'עריכת' : 'רישום'} {typeConfig[showForm].label}</h3>
              </div>
              <button onClick={resetForm} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: 'var(--bg)' }}>
                <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3 h-3" /> {showForm === 'sleep' ? 'נרדמה בשעה' : 'שעה'}
              </label>
              {/* Time is the primary field (shown large); the date is secondary
                  (shown small) - most manual entries are for "today". */}
              <div className="flex items-center gap-2">
                <input type="time" value={startTime.slice(11, 16)}
                  onChange={e => setStartTime(`${startTime.slice(0, 10)}T${e.target.value}`)}
                  className="flex-1 px-3 py-2.5 rounded-xl border text-2xl font-bold text-center outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                <input type="date" value={startTime.slice(0, 10)}
                  onChange={e => setStartTime(`${e.target.value}T${startTime.slice(11, 16)}`)}
                  className="px-2 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {showForm === 'feed' && (
              <>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>סוג האכלה</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([['breast', Baby, 'שד'], ['bottle', Milk, 'בקבוק']] as const).map(([ft, Icon, lbl]) => (
                      <button key={ft} onClick={() => setFeedType(ft)}
                        className="py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                        style={feedType === ft
                          ? { background: '#7F5268', color: 'white' }
                          : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                        }><Icon className="w-3.5 h-3.5" />{lbl}</button>
                    ))}
                  </div>
                </div>
                {feedType === 'breast' ? (
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>משך לפי צד (דקות)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>שמאל</span>
                        <input type="number" min="0" value={feedLeft} onChange={e => setFeedLeft(e.target.value)} placeholder="0"
                          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                      </div>
                      <div>
                        <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>ימין</span>
                        <input type="number" min="0" value={feedRight} onChange={e => setFeedRight(e.target.value)} placeholder="0"
                          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                      </div>
                    </div>
                    {(parseInt(feedLeft) || 0) + (parseInt(feedRight) || 0) > 0 && (
                      <p className="text-xs mt-1.5 font-medium" style={{ color: '#7F5268' }}>
                        סה"כ {(parseInt(feedLeft) || 0) + (parseInt(feedRight) || 0)} דק’
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>כמות (מ"ל)</label>
                      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="120"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>משך (דקות)</label>
                      <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="15"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Who is recording this entry (optional - blank means unstated) */}
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>מי מתעד/ת? (לא חובה)</label>
              <div className="grid grid-cols-3 gap-2">
                {([['', 'ללא'], ['mom', PARENT_LABEL.mom], ['dad', PARENT_LABEL.dad]] as const).map(([val, lbl]) => (
                  <button key={val || 'none'} type="button" onClick={() => setLogBy(val as Parent | '')}
                    className="py-2 rounded-xl text-sm font-medium transition-all"
                    style={logBy === val
                      ? (val ? { background: PARENT_COLOR[val as Parent].bg, color: PARENT_COLOR[val as Parent].text, border: `1.5px solid ${PARENT_COLOR[val as Parent].border}` }
                             : { background: '#7F5268', color: 'white' })
                      : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                    }>{lbl}</button>
                ))}
              </div>
            </div>

            {(showForm === 'sleep' || showForm === 'activity') && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Sunrise className="w-3 h-3" /> {showForm === 'sleep' ? 'התעוררה בשעה (אופציונלי)' : 'שעת סיום (אופציונלי)'}
                  </label>
                  {/* Same large-time / small-date shape as the start-time field above. */}
                  <div className="flex items-center gap-2">
                    <input type="time" value={wakeTime ? wakeTime.slice(11, 16) : ''}
                      onChange={e => {
                        const t = e.target.value
                        if (!t) { setWakeTime(''); return }
                        const datePart = wakeTime ? wakeTime.slice(0, 10) : startTime.slice(0, 10)
                        setWakeTime(`${datePart}T${t}`)
                      }}
                      className="flex-1 px-3 py-2.5 rounded-xl border text-2xl font-bold text-center outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                    <input type="date" value={wakeTime ? wakeTime.slice(0, 10) : startTime.slice(0, 10)}
                      onChange={e => {
                        const d = e.target.value
                        const timePart = wakeTime ? wakeTime.slice(11, 16) : ''
                        setWakeTime(timePart ? `${d}T${timePart}` : '')
                      }}
                      className="px-2 py-1.5 rounded-lg border text-xs outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }} />
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    {showForm === 'sleep' ? 'אם ממלאים - משך השינה יחושב אוטומטית' : 'אם ממלאים - משך הפעילות יחושב אוטומטית'}
                  </p>
                </div>
                {showForm === 'sleep' && !wakeTime && (
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>משך שינה (דקות)</label>
                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="90"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
                )}
                {showForm === 'sleep' && (
                  <>
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>איך הייתה השינה? (אופציונלי)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {([['light', 'קלה'], ['short', 'קצרה'], ['good', 'טובה']] as const).map(([val, lbl]) => (
                          <button key={val} type="button" onClick={() => setSleepQuality(sleepQuality === val ? '' : val)}
                            className="py-2 rounded-xl text-xs font-medium transition-all"
                            style={sleepQuality === val
                              ? { background: '#5C7A6A', color: 'white' }
                              : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                            }>{lbl}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>תנוחת שינה (אופציונלי)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {([['stomach', 'על הבטן'], ['back', 'על הגב']] as const).map(([val, lbl]) => (
                          <button key={val} type="button" onClick={() => setSleepPosition(sleepPosition === val ? '' : val)}
                            className="py-2 rounded-xl text-xs font-medium transition-all"
                            style={sleepPosition === val
                              ? { background: '#5C7A6A', color: 'white' }
                              : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                            }>{lbl}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>איך נרדם/ה? (אופציונלי)</label>
                      <div className="flex flex-wrap gap-2">
                        {([['nursing', 'הנקה'], ['alone', 'לבד'], ['stroller', 'עגלה'], ['arms', 'על הידיים'], ['carrier', 'מנשא'], ['other', 'אחר']] as const).map(([val, lbl]) => (
                          <button key={val} type="button" onClick={() => setFellAsleepBy(fellAsleepBy === val ? '' : val)}
                            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                            style={fellAsleepBy === val
                              ? { background: '#5C7A6A', color: 'white' }
                              : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                            }>{lbl}</button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {showForm === 'diaper' && (
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>סוג חיתול</label>
                <div className="grid grid-cols-3 gap-2">
                  {([['wet', Droplet, 'רטוב'], ['dirty', Circle, 'מלוכלך'], ['both', Sparkles, 'שניהם']] as const).map(([dt, Icon, lbl]) => (
                    <button key={dt} onClick={() => setDiaperType(dt)}
                      className="py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1"
                      style={diaperType === dt
                        ? { background: '#4A7C59', color: 'white' }
                        : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                      }><Icon className="w-4 h-4" fill={dt === 'dirty' ? 'currentColor' : 'none'} />{lbl}</button>
                  ))}
                </div>
              </div>
            )}

            {showForm === 'activity' && (
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>סוג הפעילות (אפשר לבחור כמה)</label>
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_TAGS.map(tag => {
                    const active = activityTags.includes(tag)
                    return (
                      <button key={tag} type="button"
                        onClick={() => setActivityTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                        style={active
                          ? { background: typeConfig.activity.color, color: 'white' }
                          : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                        }>{tag}</button>
                    )
                  })}
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
              {saving ? 'שומרת...' : <><Check className="w-4 h-4" />{editingId ? 'שמירת שינויים' : `שמירת ${typeConfig[showForm].label}`}</>}
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
            <Star className="w-10 h-10 mx-auto mb-3" style={{ color: '#7F5268' }} />
            <p className="font-semibold" style={{ color: 'var(--text)' }}>עדיין אין רישומים להיום</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>התחילי לעקוב כדי לראות כאן את היום</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute right-[19px] top-2 bottom-2 w-0.5 rounded-full" style={{ background: 'var(--border)' }} />
            <div className="space-y-3">
              {logs.map(log => {
                const { icon: Icon, color, bg } = typeConfig[log.type]
                const startLabel = new Date(log.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                // For sleep logs, show a from-to range when we know when the
                // sleep ended (explicit end_time, or start + duration_min).
                let time = startLabel
                if (log.type === 'sleep') {
                  const endDate = log.end_time
                    ? new Date(log.end_time)
                    : log.duration_min
                      ? new Date(new Date(log.start_time).getTime() + log.duration_min * 60000)
                      : null
                  if (endDate) {
                    const endLabel = endDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                    time = `${startLabel}-${endLabel}`
                  }
                }
                return (
                  <div key={log.id} onClick={() => editLog(log)}
                    className="flex items-start gap-3 group rounded-xl px-1.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                    style={(log.logged_by === 'mom' || log.logged_by === 'dad')
                      ? { background: PARENT_COLOR[log.logged_by].bg }
                      : undefined}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                      style={{ background: bg, border: `2px solid ${color}40` }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--text)' }}>
                            <Icon className="w-3.5 h-3.5" style={{ color }} />
                            {buildLogDescription(log)}
                            {log.type === 'sleep' && log.is_night && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: 'rgba(60,60,110,0.12)', color: '#3C3C6E' }}>
                                <Moon className="w-2.5 h-2.5" /> לילה
                              </span>
                            )}
                            {(log.logged_by === 'mom' || log.logged_by === 'dad') && (
                              <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: PARENT_COLOR[log.logged_by].bg, color: PARENT_COLOR[log.logged_by].text }}>
                                {PARENT_LABEL[log.logged_by]}
                              </span>
                            )}
                          </p>
                          {log.notes && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{log.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{time}</span>
                          <button onClick={() => editLog(log)} title="עריכה">
                            <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                          </button>
                          <button onClick={() => deleteLog(log.id)} title="מחיקה">
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

// ─── Night extras: nested feed timer + quick diaper ───────────
// Rendered only while a night sleep timer is running. Logs go straight into
// baby_logs and broadcast LOG_ADDED_EVT so the timeline updates - the sleep
// timer itself is never touched, so it keeps running underneath.
function NightExtras({ userId }: { userId: string }) {
  const supabase = createClient()
  const [feedStart, setFeedStart] = useState<number | null>(null)
  const [feedType, setFeedType] = useState<'breast' | 'bottle'>('breast')
  const [feedSide, setFeedSide] = useState<'left' | 'right'>('left')
  const [tick, setTick] = useState(() => Date.now())
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)

  useEffect(() => {
    if (feedStart == null) return
    const id = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(id)
  }, [feedStart])

  function fmtClock(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000))
    const m = Math.floor(s / 60), sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  function showFlash(key: string) {
    setFlash(key)
    setTimeout(() => setFlash(null), 1600)
  }

  async function stopFeed() {
    if (feedStart == null || busy) return
    setBusy(true)
    const end = Date.now()
    const durationMin = Math.max(1, Math.round((end - feedStart) / 60000))
    const { data } = await supabase.from('baby_logs').insert({
      user_id: userId, type: 'feed', feed_type: feedType,
      feed_side: feedType === 'breast' ? feedSide : null,
      feed_left_min: feedType === 'breast' && feedSide === 'left' ? durationMin : null,
      feed_right_min: feedType === 'breast' && feedSide === 'right' ? durationMin : null,
      start_time: new Date(feedStart).toISOString(),
      end_time: new Date(end).toISOString(),
      duration_min: durationMin,
      logged_by: getActiveParent(),
    }).select().single()
    setBusy(false)
    setFeedStart(null)
    if (data) {
      window.dispatchEvent(new CustomEvent(LOG_ADDED_EVT, { detail: data }))
      showFlash('feed')
    }
  }

  async function addDiaper(dt: 'wet' | 'dirty' | 'both') {
    if (busy) return
    setBusy(true)
    const { data } = await supabase.from('baby_logs').insert({
      user_id: userId, type: 'diaper', diaper_type: dt,
      start_time: new Date().toISOString(),
      logged_by: getActiveParent(),
    }).select().single()
    setBusy(false)
    if (data) {
      window.dispatchEvent(new CustomEvent(LOG_ADDED_EVT, { detail: data }))
      showFlash('diaper-' + dt)
    }
  }

  const diaperOpts = [
    ['wet', Droplet, 'פיפי'],
    ['dirty', Circle, 'קקי'],
    ['both', Sparkles, 'שניהם'],
  ] as const

  return (
    <div className="card" style={{ background: 'rgba(60,60,110,0.06)', border: '1px solid rgba(60,60,110,0.2)' }}>
      <p className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: '#3C3C6E' }}>
        <Moon className="w-3.5 h-3.5" /> תיעוד תוך כדי שנת הלילה - הטיימר ממשיך לרוץ
      </p>

      {/* Nested feed timer */}
      <div className="rounded-xl p-3 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
            <Milk className="w-4 h-4" style={{ color: '#7F5268' }} /> האכלת לילה
          </span>
          {flash === 'feed' && <span className="text-xs font-semibold flex items-center gap-1" style={{ color: '#5C7A6A' }}><Check className="w-3.5 h-3.5" /> נרשמה</span>}
        </div>

        {feedStart == null ? (
          <>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {([['breast', Baby, 'שד'], ['bottle', Milk, 'בקבוק']] as const).map(([ft, Icon, lbl]) => (
                <button key={ft} onClick={() => setFeedType(ft)}
                  className="py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                  style={feedType === ft
                    ? { background: '#7F5268', color: 'white' }
                    : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                  }><Icon className="w-3.5 h-3.5" />{lbl}</button>
              ))}
            </div>
            {feedType === 'breast' && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                {([['left', 'שמאל'], ['right', 'ימין']] as const).map(([sd, lbl]) => (
                  <button key={sd} onClick={() => setFeedSide(sd)}
                    className="py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={feedSide === sd
                      ? { background: '#7F5268', color: 'white' }
                      : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                    }>{lbl}</button>
                ))}
              </div>
            )}
            <button onClick={() => { setTick(Date.now()); setFeedStart(Date.now()) }}
              className="w-full py-2 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-1.5"
              style={{ background: '#7F5268' }}>
              <Play className="w-4 h-4" fill="white" /> התחלת טיימר האכלה
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-2xl font-mono font-bold" style={{ color: '#7F5268' }}>{fmtClock(tick - feedStart)}</p>
            <button onClick={stopFeed} disabled={busy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: '#7F5268' }}>
              <Square className="w-4 h-4" fill="white" /> {busy ? 'שומרת...' : 'סיום ורישום'}
            </button>
          </div>
        )}
      </div>

      {/* Quick diaper */}
      <div className="grid grid-cols-3 gap-2">
        {diaperOpts.map(([dt, Icon, lbl]) => (
          <button key={dt} onClick={() => addDiaper(dt)} disabled={busy}
            className="py-2.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 disabled:opacity-60"
            style={flash === 'diaper-' + dt
              ? { background: '#4A7C59', color: 'white' }
              : { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }
            }>
            {flash === 'diaper-' + dt ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" fill={dt === 'dirty' ? 'currentColor' : 'none'} style={{ color: '#4A7C59' }} />}
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function InfoTile({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string; value: string
}) {
  return (
    <div className="rounded-xl p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}

function StatCard({ icon: Icon, color, label, value, sub }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string; label: string; value: number; sub: string
}) {
  return (
    <div className="card text-center py-4" style={{ background: `${color}0f`, border: `1px solid ${color}25` }}>
      <Icon className="w-6 h-6 mx-auto" style={{ color }} />
      <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text)' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}
