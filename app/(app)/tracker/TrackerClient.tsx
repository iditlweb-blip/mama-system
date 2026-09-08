'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Baby, Milk, Droplet, Circle, Sparkles,
  Play, Square, Syringe,
  ChevronRight,
  ClipboardList, Carrot,
  Check, Moon, Pencil, Trash2, X, FileSpreadsheet,
} from 'lucide-react'
import { BabyLog, LogType } from '@/types/database'
import { useRouter } from 'next/navigation'
import { useSleepTimer, LOG_ADDED_EVT } from '@/lib/useSleepTimer'
import { getActiveParent, setActiveParent, PARENT_EVT, PARENT_LABEL, PARENT_COLOR, type Parent } from '@/lib/activeParent'
import dynamic from 'next/dynamic'
import type { HealthEvent } from './HealthTab'
import ExportModal from './ExportModal'
import { buildLogDescription, buildLogSummary } from './logUtils'
import MusicPlayer from './MusicPlayer'
import SleepRings from './SleepRings'
import { TRACKER_ICONS } from './trackerIcons'
import AddLogModal from './AddLogModal'

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

// Exact per-type accent colours for the stats cards and timeline, pulled from
// the Figma redesign - distinct from trackerIcons' own icon-fill colours
// (most notably diaper: its icon glyph is a warm terracotta #E2AC72, but
// every OTHER diaper-coloured element - number, border, tint - uses a
// golden #F3BB37, exactly as drawn).
const STAT_STYLE: Record<LogType, { accent: string; bg: string; border: string }> = {
  diaper:   { accent: '#F3BB37', bg: 'rgba(243,187,55,0.03)', border: 'rgba(243,187,55,0.5)' },
  sleep:    { accent: '#5C7969', bg: 'rgba(92,121,105,0.03)', border: 'rgba(78,126,89,0.5)' },
  feed:     { accent: '#7F5268', bg: 'rgba(127,82,104,0.03)', border: 'rgba(127,82,104,0.5)' },
  activity: { accent: '#4193E4', bg: 'rgba(99,167,235,0.1)',  border: 'rgba(99,167,235,0.5)' },
}
const SLEEP_TIMER_GREEN = '#4E7E59'

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
  totalLow: number        // recommended total sleep per 24h - low end (hours)
  totalHigh: number       // recommended total sleep per 24h - high end (hours)
  bedtime: string         // recommended bedtime range
  note: string
}

const SLEEP_MAP: SleepRow[] = [
  {
    maxWeeks: 6, label: '0-6 שבועות', totalLow: 14, totalHigh: 17, wwMin: 30, wwMax: 60,
    napsForCalc: 5, napsLabel: '4-6', napLenMin: 60, napLenLabel: '20 דק’ - 3 ש’',
    dayLabel: '4-8 ש’', nightLabel: '8-10 ש’', bedtime: '21:00-00:00',
    note: 'בשלב הזה היממה מתחלקת בעיקר בין שינה, אכילה, החתלה וקרבה. עדיין אין הפרדה של ממש בין יום ללילה.',
  },
  {
    maxWeeks: 13, label: '6 שבועות - 3 חודשים', totalLow: 14, totalHigh: 16, wwMin: 40, wwMax: 90,
    napsForCalc: 4, napsLabel: '4-5', napLenMin: 75, napLenLabel: '½ ש’ - 2 ש’',
    dayLabel: '4-5 ש’', nightLabel: '9-11 ש’', bedtime: '20:00-22:00',
    note: 'לאט לאט נבנית ההבחנה בין יום ללילה. שכיבה על הבטן בזמן ערות וחשיפה לאור טבעי מסייעות לייצב את השגרה היומית.',
  },
  {
    maxWeeks: 22, label: '3-5 חודשים', totalLow: 13, totalHigh: 16, wwMin: 60, wwMax: 150,
    napsForCalc: 4, napsLabel: '3-4', napLenMin: 60, napLenLabel: '½ ש’ - 2 ש’',
    dayLabel: '3-4½ ש’', nightLabel: '10-12 ש’', bedtime: '18:30-20:00',
    note: 'בסביבות גיל 4 חודשים חלה תמורה בשינה - מחזורי השינה נעשים בשלים יותר, ולעיתים הרגלים שעבדו קודם כבר פחות מתאימים.',
  },
  {
    maxWeeks: 26, label: '5-6 חודשים', totalLow: 13, totalHigh: 16, wwMin: 105, wwMax: 165,
    napsForCalc: 3, napsLabel: '3-4', napLenMin: 60, napLenLabel: '½ ש’ - 2 ש’',
    dayLabel: '3-4 ש’', nightLabel: '10-12 ש’', bedtime: '18:30-20:00',
    note: 'מעבר מדורג מארבע תנומות לשלוש. לא פעם דווקא התנומה של אחר הצהריים הולכת ומתקצרת עד שנעלמת.',
  },
  {
    maxWeeks: 35, label: '6-8 חודשים', totalLow: 13, totalHigh: 15, wwMin: 135, wwMax: 210,
    napsForCalc: 3, napsLabel: '2-3', napLenMin: 90, napLenLabel: '1-2 ש’',
    dayLabel: '3-3½ ש’', nightLabel: '10-12 ש’', bedtime: '18:30-20:00',
    note: 'תקופת מעבר משלוש תנומות לשתיים. קפיצות מוטוריות ותרגול יכולות שרכשו זה עתה עשויים לשבש את השינה באופן זמני.',
  },
  {
    maxWeeks: 43, label: '8-10 חודשים', totalLow: 12, totalHigh: 15, wwMin: 180, wwMax: 240,
    napsForCalc: 2, napsLabel: '2', napLenMin: 90, napLenLabel: '1-2 ש’',
    dayLabel: '2-3 ש’', nightLabel: '10-12 ש’', bedtime: '18:30-19:30',
    note: 'בדרך כלל כבר קיימות שתי תנומות יציבות. חרדת פרידה וזינוקים התפתחותיים עלולים להקשות על ההירדמות.',
  },
  {
    maxWeeks: 52, label: '10-12 חודשים', totalLow: 12, totalHigh: 15, wwMin: 210, wwMax: 270,
    napsForCalc: 2, napsLabel: '2', napLenMin: 90, napLenLabel: '1-2 ש’',
    dayLabel: '2-3 ש’', nightLabel: '10-12 ש’', bedtime: '18:30-19:30',
    note: 'יש תינוקות שמתחילים לסרב לתנומה השנייה, אך התנגדות כזו לא בהכרח מעידה שהם מוכנים לוותר עליה.',
  },
  {
    maxWeeks: 78, label: '12-18 חודשים', totalLow: 11, totalHigh: 14, wwMin: 210, wwMax: 300,
    napsForCalc: 2, napsLabel: '1-2', napLenMin: 105, napLenLabel: '1-2½ ש’',
    dayLabel: '1-2½ ש’', nightLabel: '10-12 ש’', bedtime: '18:30-19:30',
    note: 'מגיל 14 חודשים לרוב מתחיל מעבר איטי לתנומה יחידה. בימים עם תנומה אחת בלבד כדאי לפעמים להשכיב מעט מוקדם יותר.',
  },
  {
    maxWeeks: 104, label: '18-24 חודשים', totalLow: 11, totalHigh: 14, wwMin: 270, wwMax: 390,
    napsForCalc: 1, napsLabel: '1', napLenMin: 90, napLenLabel: '1-2 ש’',
    dayLabel: '1-2 ש’', nightLabel: '10-12 ש’', bedtime: '19:00-20:00',
    note: 'בשלב זה בדרך כלל נותרה תנומת צהריים אחת קבועה. עדיין חשוב לשים לב לסימני עייפות יתר לקראת שעות הערב.',
  },
  {
    maxWeeks: 9999, label: '24-36 חודשים', totalLow: 11, totalHigh: 14, wwMin: 300, wwMax: 420,
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

// ─── Main Component ───────────────────────────────────────────
export default function TrackerClient({ logs: initialLogs, userId, babyBirthdate, babyName, babyGender, initialHealthEvents, napDroppedBand }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'daily' | 'archive' | 'weaning' | 'health'>('daily')
  const [logs, setLogs] = useState(initialLogs)
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>(initialHealthEvents)
  const [showExport, setShowExport] = useState(false)
  const timer = useSleepTimer(userId)
  // Which side of the day/night tab is selected before Start is pressed -
  // Start then begins whichever timer type is currently marked.
  const [nightSelected, setNightSelected] = useState(false)

  // Baby age
  const babyWeeks = babyBirthdate
    ? Math.floor((Date.now() - new Date(babyBirthdate).getTime()) / (7 * 24 * 3600 * 1000))
    : null
  const babyMonths = babyWeeks !== null ? Math.floor(babyWeeks / 4.33) : null

  const todayDate = new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
  const genderSuffix = babyGender === 'boy' ? '' : 'ת'
  const isGirl = genderSuffix === 'ת'

  // A stopped timer, the global quick-add FAB, or an edit saved from the
  // timeline all broadcast the log they just created/updated; reflect it
  // here immediately regardless of which sub-tab happens to be open.
  useEffect(() => {
    const onLogAdded = (e: Event) => {
      const log = (e as CustomEvent<BabyLog>).detail
      if (!log) return
      setLogs(prev => (prev.some(l => l.id === log.id) ? prev.map(l => (l.id === log.id ? log : l)) : [log, ...prev]))
    }
    window.addEventListener(LOG_ADDED_EVT, onLogAdded)
    return () => window.removeEventListener(LOG_ADDED_EVT, onLogAdded)
  }, [])

  async function stopSleepTimer() {
    const log = await timer.stop()
    if (!log) {
      alert('לא הצלחנו לשמור את השינה. נסי שוב בעוד רגע - הטיימר עדיין פועל.')
    }
  }

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

      {/* Header + sleep timer - the timer sits directly under the back
          button: a compact day/night widget while idle, or the full active
          card (unchanged from before) once a timer is running. */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
            מעקב {babyName ? babyName : 'תינוק'}
            <Baby className="w-5 h-5" style={{ color: '#7F5268' }} />
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{todayDate}</p>
        </div>
        {!timer.active && (
          <CompactSleepTimerWidget
            nightSelected={nightSelected}
            setNightSelected={setNightSelected}
            onStart={() => timer.start(nightSelected ? { night: true } : undefined)}
          />
        )}
      </div>

      {timer.active && (
        <ActiveTimerCard timer={timer} isGirl={isGirl} onStop={stopSleepTimer} />
      )}
      {timer.active && timer.isNight && <NightExtras userId={userId} />}

      {/* Tabs - left exactly as before, only the label weight moves to light */}
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
            className="flex-1 py-2 rounded-xl text-xs font-light transition-all flex items-center justify-center gap-1"
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
          timer={timer}
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
function DailyTab({ logs, setLogs, userId, genderSuffix, babyWeeks, babyName, napDroppedBand, timer }: {
  logs: BabyLog[]; setLogs: React.Dispatch<React.SetStateAction<BabyLog[]>>
  userId: string; genderSuffix: string
  babyWeeks: number | null; babyName: string | null
  napDroppedBand: string | null
  timer: ReturnType<typeof useSleepTimer>
}) {
  // The row a mother tapped (read-only view popup) and the log currently
  // being edited (opens AddLogModal, pre-filled) - two separate pieces of
  // state because the popup's own pencil hands off into the second one.
  const [popupLog, setPopupLog] = useState<BabyLog | null>(null)
  const [editingLog, setEditingLog] = useState<BabyLog | null>(null)
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
            <button key={p ?? 'none'} onClick={() => setActiveParent(p)}
              className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
              style={activeParent === p
                ? (p ? { background: PARENT_COLOR[p].bg, color: PARENT_COLOR[p].text } : { background: '#7F5268', color: 'white' })
                : { background: 'transparent', color: 'var(--text-muted)' }}>
              {p ? PARENT_LABEL[p] : 'ללא'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline - exactly 110px tall when empty, 182px when it has entries
          (with the row list itself scrolling internally past that point) -
          per the Figma spec down to the pixel. */}
      <div className="card" style={{ padding: '12px 16px', height: logs.length === 0 ? 110 : 182, display: 'flex', flexDirection: 'column' }}>
        <h2 className="flex-shrink-0" style={{ color: '#000', fontSize: 15, fontWeight: 500, marginBottom: logs.length === 0 ? 12 : 10 }}>
          ציר זמן היום
        </h2>
        {logs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-1">
            <p style={{ color: '#000', fontSize: 14, fontWeight: 500 }}>עדין אין רישומים להיום</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 300 }}>התחילי לסמן פעילויות כדי לראות כאן את היום</p>
          </div>
        ) : (
          <div className="relative flex-1 min-h-0" style={{ paddingLeft: 19 }}>
            <div className="absolute rounded-full" style={{ left: 8, top: 0, bottom: 0, width: 6, background: 'rgba(127,82,104,0.6)' }} />
            <div className="h-full overflow-y-auto flex flex-col gap-[5px] pr-0.5">
              {logs.map(log => {
                const { Icon, color } = TRACKER_ICONS[log.type]
                const startLabel = new Date(log.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                let time = startLabel
                if (log.type === 'sleep') {
                  const endDate = log.end_time
                    ? new Date(log.end_time)
                    : log.duration_min
                      ? new Date(new Date(log.start_time).getTime() + log.duration_min * 60000)
                      : null
                  if (endDate) {
                    time = `${startLabel}-${endDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
                  }
                }
                return (
                  <div key={log.id} onClick={() => setPopupLog(log)}
                    className="flex items-center justify-between w-full flex-shrink-0 cursor-pointer"
                    style={{ minHeight: 29 }}>
                    {/* Renders on the RIGHT (first in DOM, RTL row): the icon
                        furthest right, the name just to its left. */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={18} />
                      <span className="truncate" style={{ color: '#000', fontSize: 12, fontWeight: 300 }}>{buildLogSummary(log)}</span>
                    </div>
                    {/* Renders on the LEFT: time, then edit, then delete
                        (delete at the far left edge). */}
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <span style={{ color: '#7F5268', fontSize: 10, fontWeight: 300 }}>{time}</span>
                      <button onClick={() => setEditingLog(log)} title="עריכה">
                        <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                      </button>
                      <button onClick={() => deleteLog(log.id)} title="מחיקה">
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#C0392B' }} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard type="diaper" label="חיתולים" value={diaperLogs.length}
          sub={`${diaperLogs.filter(l => l.diaper_type === 'dirty' || l.diaper_type === 'both').length} מלוכלך`} />
        <StatCard type="sleep" label="שינה" value={sleepLogs.length}
          sub={totalSleepMin > 0 ? `${Math.floor(totalSleepMin / 60)}:${String(totalSleepMin % 60).padStart(2, '0')}ש’` : '-'} />
        <StatCard type="feed" label="האכלות" value={feedLogs.length}
          sub={totalFeedMl > 0 ? `${totalFeedMl} מ"ל` : `${feedLogs.filter(l => l.duration_min).reduce((s, l) => s + (l.duration_min || 0), 0)} ד״ק`} />
      </div>

      {/* At-a-glance sleep rings: the last 24h against the recommended range
          for the age, and how well the nights themselves are going. Sits right
          under the raw counts so the numbers above get context. A running
          timer's elapsed time counts toward today - it is sleep happening now,
          it just hasn't been written to a log row yet. */}
      {sleepPlan && (
        <SleepRings
          userId={userId}
          todayMin={totalSleepMin + (timer.active ? Math.floor(timer.elapsed / 60) : 0)}
          totalLow={sleepPlan.band.totalLow}
          totalHigh={sleepPlan.band.totalHigh}
        />
      )}

      <MusicPlayer />

      {/* Read-only view of a tapped row; its pencil hands off into AddLogModal. */}
      {popupLog && (
        <LogViewPopup
          log={popupLog}
          onClose={() => setPopupLog(null)}
          onEdit={() => { setEditingLog(popupLog); setPopupLog(null) }}
          onDelete={() => { deleteLog(popupLog.id); setPopupLog(null) }}
        />
      )}
      {editingLog && (
        <AddLogModal
          userId={userId}
          initialType={editingLog.type}
          editingLog={editingLog}
          onClose={() => setEditingLog(null)}
        />
      )}

      {/* Sleep windows & naps by age - no icons anywhere in this card, just
          plain white tiles; only font weight/size carries the hierarchy. */}
      {sleepPlan && (
        <div className="card" style={{ background: 'rgba(78,126,89,0.1)', border: '1px solid rgba(92,121,105,0.5)', borderRadius: 20, padding: 20 }}>
          <div className="flex items-center justify-between mb-5">
            <span style={{ color: '#5C7969', fontSize: 10, fontWeight: 300 }}>{sleepPlan.band.label}</span>
            <h2 style={{ color: '#000', fontSize: 20, fontWeight: 500 }}>חלונות שינה וערות</h2>
          </div>

          {/* Full sleep map for the age band (mirrors the pediatric chart) */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <WindowTile label="תנומות ביום" value={`${sleepPlan.band.napsLabel} תנומות`} />
            <WindowTile label="חלון ערות מומלץ"
              value={sleepPlan.band.wwMin === sleepPlan.band.wwMax
                ? fmtWW(sleepPlan.band.wwMin)
                : `${fmtWW(sleepPlan.band.wwMin)}-${fmtWW(sleepPlan.band.wwMax)}`} />
            <WindowTile label="זמן שינה ביום" value={sleepPlan.band.dayLabel} />
            <WindowTile label="אורך תנומה ממוצע" value={sleepPlan.band.napLenLabel} />
            <WindowTile label="שעת השכבה מומלצת" value={sleepPlan.band.bedtime} />
            <WindowTile label="זמן שינה בלילה" value={sleepPlan.band.nightLabel} />
          </div>

          {/* Age-band note + a clear "this is guidance, not a rule" framing */}
          <div className="rounded-[10px] px-7 pt-2 pb-4 mb-3 text-center" style={{ background: '#E6DCD3', border: '0.5px solid rgba(127,82,104,0.5)' }}>
            <p className="mb-1.5" style={{ color: '#7F5268', fontSize: 12, fontWeight: 500 }}>מידע והמלצות לגיל הזה</p>
            <p style={{ color: '#7F5268', fontSize: 10, fontWeight: 300, lineHeight: 1.5 }}>{sleepPlan.band.note}</p>
            <p style={{ color: '#7F5268', fontSize: 10, fontWeight: 300, lineHeight: 1.5 }}>המספרים כאן הם המלצה כללית לפי טבלת שינה לגיל - לא כלל מחייב. כל תינוק שונה, והכי חשוב לעקוב אחרי סימני העייפות {isGirl ? 'שלה' : 'שלו'} ולהשכיב בהתאם.</p>
          </div>

          {/* Live insights based on what was marked today */}
          <div className="space-y-3">
            {/* Remaining naps until night */}
            <div className="rounded-[10px] flex items-center justify-center gap-1.5 text-center px-3" style={{ background: '#fff', minHeight: 37 }}>
              {sleepPlan.napsRemaining > 0 ? (
                <>
                  <span style={{ color: '#7F5268', fontSize: 12, fontWeight: 500 }}>{sleepPlan.napsTaken} כבר סומנו</span>
                  <span style={{ color: '#7F5268', fontSize: 12, fontWeight: 300 }}>נותרו עוד {sleepPlan.napsRemaining} שנ”צים עד הלילה</span>
                </>
              ) : (
                <span style={{ color: '#7F5268', fontSize: 12, fontWeight: 500 }}>כל השנ”צים להיום הושלמו - נשארה רק שנת הלילה</span>
              )}
            </div>

            {/* Time until next nap - hidden once all naps for the day are done
                (and no timer running), since the bedtime row already covers
                when the night sleep should start. */}
            {(timer.active || sleepPlan.napsRemaining > 0) && (
              <div className="rounded-[10px] flex items-center justify-center text-center px-3" style={{ background: '#fff', minHeight: 37 }}>
                <span style={{ color: '#7F5268', fontSize: 12, fontWeight: 500 }}>
                  {timer.active && timer.isNight
                    ? 'מתעדת שינת לילה - הטיימר רץ'
                    : sleepPlan.sleeping
                      ? `${isGirl ? 'ישנה' : 'ישן'} עכשיו - הטיימר רץ`
                      : !sleepPlan.hasWakeData
                        ? 'סמני שינה כדי לחשב מתי השנ”צ הבא'
                        : sleepPlan.minutesToNextNap !== null && sleepPlan.minutesToNextNap > 0
                          ? `השנ”צ הבא בעוד ${fmtDur(sleepPlan.minutesToNextNap)}${sleepPlan.nextNapAt ? ` (בערך ב-${fmtTime(sleepPlan.nextNapAt)})` : ''}`
                          : 'הגיע הזמן לשנ”צ'
                  }
                </span>
              </div>
            )}

            {/* Predicted bedtime + fewer-naps recommendation. When the chained
                calculation lands after the age's latest recommended bedtime,
                the checkbox to actually drop a nap appears (recalculates live). */}
            {!(timer.active && timer.isNight) && (() => {
              const meaningfulDrop = sleepPlan.recommendFewerNaps
                && sleepPlan.recommendedNapsRemaining !== null
                && sleepPlan.recommendedNapsRemaining !== sleepPlan.napsRemaining
              const showLate = !!sleepPlan.bedtime && meaningfulDrop && sleepPlan.napsRemaining > 0
              const showCheckbox = showLate || dropOneNap
              const baby = babyName || 'התינוק'
              return (
                <div className="rounded-[10px] flex flex-col items-center justify-center text-center px-7 py-2" style={{ background: '#fff', minHeight: 55 }}>
                  <p style={{ color: '#7F5268', fontSize: 12, fontWeight: 500, lineHeight: 1.5 }}>
                    {sleepPlan.bedtime
                      ? showLate
                        ? `לפי חישוב השנ”צים עד כה, הלילה של ${baby} צפוי להתחיל בערך ב-${fmtTime(sleepPlan.bedtime)}. בגיל הזה מומלץ להשכיב לא יאוחר מ-${sleepPlan.latestBedtimeLabel} - לכן כדאי לשקול להוריד שנ”צ אחד.`
                        : `הלילה של ${baby} צפוי להתחיל בערך ב-${fmtTime(sleepPlan.bedtime)}${dropOneNap ? ' (מחושב לפי תנומה אחת פחות)' : ''}`
                      : !sleepPlan.hasWakeData
                        ? `סמני שינה כדי לחזות מתי יתחיל הלילה של ${baby}`
                        : `הלילה של ${baby} מתקרב - כדאי להתחיל שגרת שינה`
                    }
                  </p>
                  {showCheckbox && (
                    <label className="flex items-center gap-2 mt-2.5 pt-2.5 cursor-pointer w-full justify-center"
                      style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                      <input type="checkbox" checked={dropOneNap}
                        onChange={e => toggleDropNap(e.target.checked)}
                        className="w-4 h-4 rounded flex-shrink-0" style={{ accentColor: '#5C7969' }} />
                      <span style={{ color: '#7F5268', fontSize: 11, fontWeight: 300 }}>
                        {dropOneNap
                          ? 'החישוב מעודכן לתנומה אחת פחות ✓ (אפשר לבטל כדי לחזור)'
                          : `${baby} כבר מוכן${isGirl ? 'ה' : ''} לתנומה אחת פחות - עדכני את החישוב`
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
    </>
  )
}

function WindowTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] flex flex-col items-center justify-center gap-1.5 text-center" style={{ background: '#fff', height: 61 }}>
      <span style={{ color: '#7F5268', fontSize: 12, fontWeight: 300 }}>{label}</span>
      <span style={{ color: '#7F5268', fontSize: 12, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

// ─── Compact sleep timer widget (idle state, top of page) ─────
// The small day/night toggle that now lives beside the page title, right
// under the back button. Once a timer is running this disappears in favour
// of ActiveTimerCard below - "יופיע טיימר כמו עכשיו" per the redesign brief.
function CompactSleepTimerWidget({ nightSelected, setNightSelected, onStart }: {
  nightSelected: boolean
  setNightSelected: (v: boolean) => void
  onStart: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-[6px] p-[6px] flex-shrink-0" style={{ width: 126 }}>
      <div className="flex items-center justify-center gap-[6px] w-full">
        <span style={{ color: '#000', fontSize: 9.5, fontWeight: 500 }}>טיימר שינה</span>
        <BedIconGlyph size={18} color="#000" />
      </div>
      <div className="flex items-center gap-[8px]">
        <button onClick={() => setNightSelected(false)}
          className="flex items-end gap-1 p-[3.5px] rounded-[6px]"
          style={{ background: !nightSelected ? '#fff' : 'transparent' }}>
          <span style={{ color: '#7F5268', fontSize: 14, fontWeight: 300 }}>יום</span>
          <SunIconGlyph size={18} />
        </button>
        <button onClick={() => setNightSelected(true)}
          className="flex items-center gap-[8px] p-[3.5px] rounded-[6px]"
          style={{ background: nightSelected ? '#fff' : 'transparent' }}>
          <span style={{ color: '#7F5268', fontSize: 14, fontWeight: 300 }}>לילה</span>
          <Moon size={14} style={{ color: '#7F5268' }} />
        </button>
      </div>
      <p className="text-center" style={{ color: '#000', fontSize: 9.5, fontWeight: 300 }}>לחצי start כשהתינוק נרדם</p>
      <button onClick={onStart} className="w-full flex items-center justify-center p-[3.5px] rounded-[12px]" style={{ background: SLEEP_TIMER_GREEN }}>
        <span style={{ color: '#F0EBE3', fontSize: 14, fontWeight: 300 }}>start</span>
      </button>
    </div>
  )
}

function BedIconGlyph({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.33366 14.1666H16.667V16.6666H18.3337V9.16659C18.3337 8.24992 17.5837 7.49992 16.667 7.49992V4.16659C16.667 3.70825 16.292 3.33325 15.8337 3.33325H4.16699C3.70866 3.33325 3.33366 3.70825 3.33366 4.16659V7.49992C2.41699 7.49992 1.66699 8.24992 1.66699 9.16659V16.6666H3.33366V14.1666ZM15.0003 4.99992V7.49992H10.8337V4.99992H15.0003ZM5.00033 4.99992H9.16699V7.49992H5.00033V4.99992ZM3.33366 9.16659H16.667V12.4999H3.33366V9.16659Z" fill={color} />
    </svg>
  )
}

function SunIconGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="7.5" r="3" stroke="#7F5268" strokeWidth="1.1" />
      <g stroke="#7F5268" strokeWidth="1.1" strokeLinecap="round">
        <path d="M7.5 1v1.3M7.5 12.7V14M14 7.5h-1.3M2.3 7.5H1M12.1 2.9l-.9.9M3.8 11.3l-.9.9M12.1 12.1l-.9-.9M3.8 3.7l-.9-.9" />
      </g>
    </svg>
  )
}

// ─── Active timer card (unchanged from before, moved to page top) ─────
function ActiveTimerCard({ timer, isGirl, onStop }: {
  timer: ReturnType<typeof useSleepTimer>
  isGirl: boolean
  onStop: () => void
}) {
  return (
    <div className="card" style={{ background: timer.isNight ? 'rgba(60,60,110,0.1)' : 'rgba(92,122,106,0.1)', border: `1px solid ${timer.isNight ? 'rgba(60,60,110,0.3)' : 'rgba(92,122,106,0.3)'}` }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: timer.isNight ? 'rgba(60,60,110,0.15)' : 'rgba(92,122,106,0.15)' }}>
            {timer.isNight
              ? <Moon className="w-5 h-5" style={{ color: '#3C3C6E' }} />
              : <BedIconGlyph size={20} color="#5C7A6A" />
            }
          </div>
          <div>
            <p className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--text)' }}>
              {timer.isNight
                ? <>{`שנת לילה...`}<Moon className="w-3.5 h-3.5" style={{ color: '#3C3C6E' }} /></>
                : <>{`${isGirl ? 'ישנה' : 'ישן'} עכשיו...`}</>
              }
            </p>
            <p className="text-lg font-mono font-bold" style={{ color: timer.isNight ? '#3C3C6E' : '#5C7A6A' }}>{timer.formatTimer(timer.elapsed)}</p>
          </div>
        </div>
        <button onClick={onStop} disabled={timer.stopping}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: timer.isNight ? '#3C3C6E' : '#5C7A6A' }}>
          <Square className="w-4 h-4" fill="white" /> סיום שינה
        </button>
      </div>
    </div>
  )
}

// ─── Timeline row view popup ───────────────────────────────────
// Opened by tapping a compact timeline row: shows the full breakdown
// (buildLogDescription, not the row's own single-line summary) plus edit
// and delete actions - which the row itself no longer carries inline.
function LogViewPopup({ log, onClose, onEdit, onDelete }: {
  log: BabyLog
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { Icon, color, label } = TRACKER_ICONS[log.type]
  const startLabel = new Date(log.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const dateLabel = new Date(log.start_time).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 pb-[calc(64px+env(safe-area-inset-bottom)+1rem)] md:pb-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={24} />
            <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{label}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: 'var(--bg)' }}>
            <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <p className="text-sm" style={{ color: 'var(--text)' }}>{buildLogDescription(log)}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dateLabel}, {startLabel}</p>
        {log.notes && <p className="text-xs rounded-lg p-2" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{log.notes}</p>}
        {(log.logged_by === 'mom' || log.logged_by === 'dad') && (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: PARENT_COLOR[log.logged_by].bg, color: PARENT_COLOR[log.logged_by].text }}>
            {PARENT_LABEL[log.logged_by]}
          </span>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: `${color}1a`, color }}>
            <Pencil className="w-3.5 h-3.5" /> עריכה
          </button>
          <button onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
            <Trash2 className="w-3.5 h-3.5" /> מחיקה
          </button>
        </div>
      </div>
    </div>
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

function StatCard({ type, label, value, sub }: {
  type: LogType; label: string; value: number; sub: string
}) {
  const { Icon } = TRACKER_ICONS[type]
  const { accent, bg, border } = STAT_STYLE[type]
  return (
    <div className="rounded-[10px] flex flex-col items-center gap-[7px] py-[5px]" style={{ background: bg, border: `1px solid ${border}` }}>
      <Icon size={34} />
      <span style={{ color: accent, fontSize: 20, fontWeight: 500 }}>{value}</span>
      <span style={{ color: '#000', fontSize: 13, fontWeight: 500 }}>{label}</span>
      {sub && <span style={{ color: '#000', fontSize: 12, fontWeight: 300 }}>{sub}</span>}
    </div>
  )
}
