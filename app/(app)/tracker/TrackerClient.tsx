'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Milk, BedDouble, Droplets, Plus, X, Clock,
  Trash2, Play, Square, Syringe,
  Circle, AlertTriangle, ChevronRight,
  ClipboardList, Carrot, Baby, Droplet, Sparkles, Star,
  Check, Clock3, Moon, Sunrise, Pencil,
} from 'lucide-react'
import { BabyLog, LogType } from '@/types/database'
import { useRouter } from 'next/navigation'
import { useSleepTimer, LOG_ADDED_EVT } from '@/lib/useSleepTimer'
import dynamic from 'next/dynamic'
import type { HealthEvent } from './HealthTab'

// Weaning guide and health/vaccine tabs carry sizeable static Hebrew data
// (and their own icon sets) that most sessions never touch — lazy-load them
// so that weight isn't in the initial JS for the default "daily" tab.
const WeaningTab = dynamic(() => import('./WeaningTab'), {
  loading: () => <TabLoading />,
})
const HealthTab = dynamic(() => import('./HealthTab'), {
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
}

// ─── Tracker type config ──────────────────────────────────────
const typeConfig = {
  feed:   { label: 'האכלה', icon: Milk,      color: '#7F5268', bg: 'rgba(127,82,104,0.1)',  border: 'rgba(127,82,104,0.25)' },
  sleep:  { label: 'שינה',  icon: BedDouble, color: '#5C7A6A', bg: 'rgba(92,122,106,0.1)',  border: 'rgba(92,122,106,0.25)' },
  diaper: { label: 'חיתול', icon: Droplets,  color: '#7A6A3C', bg: 'rgba(122,106,60,0.1)',  border: 'rgba(122,106,60,0.25)' },
}

// ─── Age-based wake windows & naps ────────────────────────────
// Each band: max age (weeks) it applies to, typical awake window between
// sleeps (minutes), total daytime naps, and a typical nap length (minutes).
const SLEEP_CONFIG = [
  { maxWeek: 6,    label: '0–6 שבועות',    wakeMin: 60,  naps: 5, napLenMin: 45 },
  { maxWeek: 12,   label: '6–12 שבועות',   wakeMin: 80,  naps: 4, napLenMin: 50 },
  { maxWeek: 17,   label: '3–4 חודשים',    wakeMin: 105, naps: 4, napLenMin: 60 },
  { maxWeek: 26,   label: '4–6 חודשים',    wakeMin: 135, naps: 3, napLenMin: 75 },
  { maxWeek: 34,   label: '6–8 חודשים',    wakeMin: 165, naps: 3, napLenMin: 80 },
  { maxWeek: 52,   label: '8–12 חודשים',   wakeMin: 210, naps: 2, napLenMin: 90 },
  { maxWeek: 78,   label: '12–18 חודשים',  wakeMin: 270, naps: 2, napLenMin: 90 },
  { maxWeek: 9999, label: '18 חודשים+',    wakeMin: 330, naps: 1, napLenMin: 120 },
] as const

type SleepBand = typeof SLEEP_CONFIG[number]

function getSleepBand(weeks: number): SleepBand {
  return SLEEP_CONFIG.find(c => weeks <= c.maxWeek) || SLEEP_CONFIG[SLEEP_CONFIG.length - 1]
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
}

// Sleeping = a timer is currently running (day nap or night). nightSleeping =
// that running timer was started as a "night timer" — in that case we skip
// next-nap predictions entirely (the running sleep IS the night sleep).
function computeSleepPlan(weeks: number, logs: BabyLog[], now: number, sleeping: boolean, nightSleeping: boolean): SleepPlan {
  const band = getSleepBand(weeks)

  const sleeps = logs
    .filter(l => l.type === 'sleep')
    .map(l => ({ start: new Date(l.start_time), dur: l.duration_min || 0, isNight: !!l.is_night }))
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  // Count daytime sleeps as naps already taken today — night sleeps (flagged
  // explicitly, or falling outside 05:00–19:00) don't count toward the daily
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

  let nextNapAt: Date | null = null
  let minutesToNextNap: number | null = null
  if (!sleeping && !nightSleeping && lastWakeEnd) {
    nextNapAt = new Date(lastWakeEnd.getTime() + band.wakeMin * 60000)
    minutesToNextNap = Math.round((nextNapAt.getTime() - now) / 60000)
  }

  // Predicted bedtime: chain the remaining naps and wake windows from the
  // last time the baby was awake. We only predict once there's at least one
  // real sleep logged today — without any data we'd otherwise assume a 07:00
  // wake and confidently show a bedtime (e.g. 22:00) the mother never implied,
  // which is confusing. No data → no prediction.
  const N = napsRemaining
  let bedtime: Date | null = null
  if (lastWakeEnd) {
    bedtime = new Date(lastWakeEnd.getTime() + ((N + 1) * band.wakeMin + N * band.napLenMin) * 60000)
    if (bedtime.getTime() < now) bedtime = null // overdue → show "soon" instead of a stale time
  }

  // If the chained prediction lands after 21:00, suggest trimming naps so the
  // baby doesn't get overtired — find the largest remaining-nap count that
  // still lands at/before 21:00 from the same anchor.
  let recommendFewerNaps = false
  let recommendedNapsRemaining: number | null = null
  if (bedtime) {
    const cutoff = new Date(now); cutoff.setHours(21, 0, 0, 0)
    if (bedtime.getTime() > cutoff.getTime()) {
      let found: number | null = null
      for (let n = N - 1; n >= 0; n--) {
        const trial = new Date(lastWakeEnd!.getTime() + ((n + 1) * band.wakeMin + n * band.napLenMin) * 60000)
        if (trial.getTime() <= cutoff.getTime()) { found = n; break }
      }
      recommendFewerNaps = true
      recommendedNapsRemaining = found ?? 0
    }
  }

  return { band, napsTaken, napsRemaining, minutesToNextNap, nextNapAt, bedtime, sleeping, hasWakeData, recommendFewerNaps, recommendedNapsRemaining }
}

function fmtDur(min: number): string {
  if (min <= 0) return 'עכשיו'
  const h = Math.floor(min / 60), m = min % 60
  if (h > 0) return m > 0 ? `${h} ש׳ ו-${m} דק׳` : `${h} ש׳`
  return `${m} דק׳`
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

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
          { key: 'weaning', label: 'טעימות',   icon: Carrot },
          { key: 'health',  label: 'חיסונים',  icon: Syringe },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5"
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
function DailyTab({ logs, setLogs, userId, genderSuffix, babyWeeks, babyName }: {
  logs: BabyLog[]; setLogs: React.Dispatch<React.SetStateAction<BabyLog[]>>
  userId: string; genderSuffix: string
  babyWeeks: number | null; babyName: string | null
}) {
  const [showForm, setShowForm] = useState<LogType | null>(null)
  const [saving, setSaving] = useState(false)
  const timer = useSleepTimer(userId)
  const [feedType, setFeedType] = useState<'breast' | 'bottle'>('breast')
  const [amount, setAmount] = useState('')
  const [duration, setDuration] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'both'>('wet')
  const [notes, setNotes] = useState('')
  const [startTime, setStartTime] = useState(() => new Date().toISOString().slice(0, 16))
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

  const sleepPlan = useMemo(() => (
    babyWeeks !== null
      ? computeSleepPlan(babyWeeks, logs, now, timer.active, timer.active && timer.isNight)
      : null
  ), [babyWeeks, logs, now, timer.active, timer.isNight])

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
    await timer.stop()
  }

  async function saveLog() {
    if (!showForm) return
    setSaving(true)
    // Fields that vary by type — reset the ones that don't apply so an edit
    // that changes context doesn't leave stale values behind.
    const payload: Partial<BabyLog> = {
      user_id: userId, type: showForm,
      start_time: new Date(startTime).toISOString(),
      notes: notes || null,
      feed_type: null,
      amount_ml: null,
      diaper_type: null,
      duration_min: null,
      end_time: null,
    }
    if (showForm === 'feed') {
      payload.feed_type = feedType
      if (amount) payload.amount_ml = parseInt(amount)
      if (duration) payload.duration_min = parseInt(duration)
    }
    if (showForm === 'diaper') payload.diaper_type = diaperType
    if (showForm === 'sleep') {
      // Prefer an explicit wake-up time — compute duration from the gap so
      // "נרדמה"/"התעוררה" stay consistent. Fall back to a manual duration.
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
    setFeedType('breast'); setDiaperType('wet')
    setStartTime(new Date().toISOString().slice(0, 16))
  }

  function editLog(log: BabyLog) {
    setEditingId(log.id)
    setShowForm(log.type)
    setStartTime(new Date(log.start_time).toISOString().slice(0, 16))
    setWakeTime(log.end_time ? new Date(log.end_time).toISOString().slice(0, 16) : '')
    setFeedType(log.feed_type === 'bottle' ? 'bottle' : 'breast')
    setAmount(log.amount_ml != null ? String(log.amount_ml) : '')
    setDuration(log.duration_min != null ? String(log.duration_min) : '')
    setDiaperType((log.diaper_type as 'wet' | 'dirty' | 'both') || 'wet')
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
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Milk} color="#7F5268" label="האכלות" value={feedLogs.length}
          sub={totalFeedMl > 0 ? `${totalFeedMl} מ"ל` : `${feedLogs.filter(l => l.duration_min).reduce((s, l) => s + (l.duration_min || 0), 0)} דק׳`} />
        <StatCard icon={BedDouble} color="#5C7A6A" label="שינה" value={sleepLogs.length}
          sub={totalSleepMin > 0 ? `${Math.floor(totalSleepMin / 60)}:${String(totalSleepMin % 60).padStart(2, '0')}ש׳` : '—'} />
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

          {/* Wake window + total naps for age */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-xl p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Sunrise className="w-3 h-3" /> חלון ערות
              </p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{fmtDur(sleepPlan.band.wakeMin)}</p>
            </div>
            <div className="rounded-xl p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <BedDouble className="w-3 h-3" /> שנ״צים ביום
              </p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text)' }}>{sleepPlan.band.naps}</p>
            </div>
          </div>

          {/* Live insights based on what was marked today */}
          <div className="space-y-2">
            {/* Remaining naps until night */}
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface)' }}>
              <BedDouble className="w-4 h-4 flex-shrink-0" style={{ color: '#5C7A6A' }} />
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                {sleepPlan.napsRemaining > 0
                  ? <>נותרו עוד <b>{sleepPlan.napsRemaining}</b> שנ״צים עד הלילה <span style={{ color: 'var(--text-muted)' }}>({sleepPlan.napsTaken} כבר סומנו)</span></>
                  : <>כל השנ״צים להיום הושלמו — נשארה רק שנת הלילה 🌙</>
                }
              </p>
            </div>

            {/* Time until next nap */}
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: 'var(--surface)' }}>
              <Clock3 className="w-4 h-4 flex-shrink-0" style={{ color: '#7F5268' }} />
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                {timer.active && timer.isNight
                  ? <>{`מתעד${genderSuffix === 'ת' ? 'ת' : ''} שינת לילה 🌙 — הטיימר רץ`}</>
                  : sleepPlan.sleeping
                    ? <>{`${isGirl ? 'ישנה' : 'ישן'} עכשיו 😴 — הטיימר רץ`}</>
                    : !sleepPlan.hasWakeData
                      ? <span style={{ color: 'var(--text-muted)' }}>סמני שינה כדי לחשב מתי השנ״צ הבא</span>
                      : sleepPlan.minutesToNextNap !== null && sleepPlan.minutesToNextNap > 0
                        ? <>השנ״צ הבא בעוד <b>{fmtDur(sleepPlan.minutesToNextNap)}</b> {sleepPlan.nextNapAt && <span style={{ color: 'var(--text-muted)' }}>(בערך ב-{fmtTime(sleepPlan.nextNapAt)})</span>}</>
                        : <span style={{ color: '#5C7A6A', fontWeight: 600 }}>הגיע הזמן לשנ״צ 💤</span>
                }
              </p>
            </div>

            {/* Predicted bedtime */}
            {!(timer.active && timer.isNight) && (
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(92,122,106,0.12)', border: '1px solid rgba(92,122,106,0.2)' }}>
                <Moon className="w-4 h-4 flex-shrink-0" style={{ color: '#5C7A6A' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {sleepPlan.bedtime
                    ? <>{`הלילה של ${babyName || 'התינוק'} יתחיל היום בערך ב-`}<b style={{ color: '#5C7A6A' }}>{fmtTime(sleepPlan.bedtime)}</b></>
                    : !sleepPlan.hasWakeData
                      ? <span style={{ color: 'var(--text-muted)' }}>{`סמני שינה כדי לחזות מתי יתחיל הלילה של ${babyName || 'התינוק'}`}</span>
                      : <>{`הלילה של ${babyName || 'התינוק'} מתקרב 🌙 כדאי להתחיל שגרת שינה`}</>
                  }
                </p>
              </div>
            )}

            {/* Overtired warning + fewer-naps recommendation */}
            {sleepPlan.recommendFewerNaps && !(timer.active && timer.isNight) && (
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(196,120,45,0.12)', border: '1px solid rgba(196,120,45,0.3)' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#C4782D' }} />
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  לפי החישוב הלילה יתחיל מאוחר מ-21:00 — כדאי לשקול
                  {' '}<b>{sleepPlan.recommendedNapsRemaining} שנ״צים</b> בלבד מעכשיו (במקום {sleepPlan.napsRemaining}) כדי שלא {`${isGirl ? 'תגיע' : 'יגיע'} לעייפות יתר`}.
                </p>
              </div>
            )}
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
              <button onClick={() => timer.start({ night: true })} title="טיימר לילה — לא ישפיע על חישוב השנ״צ הבא"
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

      {/* Quick Add */}
      <div className="grid grid-cols-3 gap-3">
        {(['feed', 'sleep', 'diaper'] as LogType[]).map(type => {
          const { label, color, bg, border, icon: Icon } = typeConfig[type]
          return (
            <button key={type}
              onClick={() => { setStartTime(new Date().toISOString().slice(0, 16)); setWakeTime(''); setShowForm(type) }}
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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50"
          onClick={e => e.target === e.currentTarget && resetForm()}>
          <div className="card w-full max-w-sm space-y-4">
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
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
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
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Sunrise className="w-3 h-3" /> התעוררה בשעה (אופציונלי)
                  </label>
                  <input type="datetime-local" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                  <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>אם ממלאים — משך השינה יחושב אוטומטית</p>
                </div>
                {!wakeTime && (
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>משך שינה (דקות)</label>
                    <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="90"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
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
                // For sleep logs, show a from–to range when we know when the
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
                    time = `${startLabel}–${endLabel}`
                  }
                }
                return (
                  <div key={log.id} className="flex items-start gap-3 group">
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
                          </p>
                          {log.notes && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{log.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{time}</span>
                          <button onClick={() => editLog(log)} className="md:opacity-0 md:group-hover:opacity-100 transition-opacity" title="עריכה">
                            <Pencil className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                          </button>
                          <button onClick={() => deleteLog(log.id)} className="md:opacity-0 md:group-hover:opacity-100 transition-opacity" title="מחיקה">
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
