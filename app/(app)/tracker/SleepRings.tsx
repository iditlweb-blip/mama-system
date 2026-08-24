'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Moon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const BRAND = '#805268'

// Two windows of seven whole days each, ending yesterday. Today is deliberately
// excluded from both: a day that is only half over always looks like a drop,
// which would make the trend read "worse" every single morning.
const WINDOW_DAYS = 7
// Nights with any night-sleep data. Below this there isn't enough to score
// honestly, so the ring stays empty rather than showing a number built on one
// or two nights.
const MIN_NIGHTS_FOR_SCORE = 3
// A change smaller than this is noise, not a trend worth naming.
const TREND_EPSILON = 5

// The classic pediatric "slept through the night" mark. A single unbroken
// night stretch of this length scores full marks on the continuity component;
// shorter stretches score proportionally.
const GOOD_STRETCH_MIN = 5 * 60

// A sleep counts as night sleep when it was logged with the night timer, or -
// for mothers who don't use that timer - when it simply started at night.
const NIGHT_START_HOUR = 19
const NIGHT_END_HOUR = 5

interface Props {
  userId: string
  /** Sleep minutes recorded for the current 24h, including a running timer. */
  todayMin: number
  /** Recommended total sleep per 24h for the baby's age band, in hours. */
  totalLow: number
  totalHigh: number
}

interface SleepRow {
  start_time: string
  duration_min: number | null
  is_night: boolean | null
  sleep_quality: 'light' | 'short' | 'good' | null
}

/** 0-100, or null when there wasn't enough logged to judge. */
type Score = number | null

function isNightSleep(log: SleepRow): boolean {
  if (log.is_night) return true
  const h = new Date(log.start_time).getHours()
  return h >= NIGHT_START_HOUR || h < NIGHT_END_HOUR
}

// Which night a sleep belongs to. Shifting back 12 hours puts a 21:00 bedtime
// and the 03:00 waking that follows it on the same night key.
function nightKey(startIso: string): string {
  const d = new Date(new Date(startIso).getTime() - 12 * 3600 * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtHours(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

const QUALITY_POINTS: Record<string, number> = { good: 100, light: 50, short: 25 }

/**
 * Scores how well the nights in one window went, out of 100, from three things
 * the mother already logs. Each component is only counted when there is data
 * for it, and the weights are renormalised over whatever is present - so a
 * mother who never marks sleep quality still gets a meaningful score from the
 * timer data alone.
 *
 *   רצף לילה (45%)      - the longest unbroken night stretch, averaged per night
 *   התעוררויות (35%)    - how many separate night sleeps each night was cut into
 *   איכות מדווחת (20%)  - the light/short/good marks on the entries themselves
 */
function scoreWindow(logs: SleepRow[]): Score {
  const nights = new Map<string, SleepRow[]>()
  for (const log of logs) {
    if (!isNightSleep(log)) continue
    const key = nightKey(log.start_time)
    if (!nights.has(key)) nights.set(key, [])
    nights.get(key)!.push(log)
  }
  if (nights.size < MIN_NIGHTS_FOR_SCORE) return null

  let stretchTotal = 0
  let segmentsTotal = 0
  for (const segs of nights.values()) {
    stretchTotal += Math.max(...segs.map(s => s.duration_min ?? 0))
    segmentsTotal += segs.length
  }
  const avgStretch = stretchTotal / nights.size
  const avgSegments = segmentsTotal / nights.size

  const stretchScore = Math.min(100, (avgStretch / GOOD_STRETCH_MIN) * 100)
  // One unbroken stretch is 100; every extra waking costs 25 points.
  const wakingScore = Math.max(0, 100 - (avgSegments - 1) * 25)

  const marked = logs.filter(l => l.sleep_quality && QUALITY_POINTS[l.sleep_quality] !== undefined)
  const qualityScore = marked.length >= 3
    ? marked.reduce((s, l) => s + QUALITY_POINTS[l.sleep_quality as string], 0) / marked.length
    : null

  const parts: { score: number; weight: number }[] = [
    { score: stretchScore, weight: 45 },
    { score: wakingScore, weight: 35 },
  ]
  if (qualityScore !== null) parts.push({ score: qualityScore, weight: 20 })

  const totalWeight = parts.reduce((s, p) => s + p.weight, 0)
  return Math.round(parts.reduce((s, p) => s + p.score * p.weight, 0) / totalWeight)
}

/** Two at-a-glance sleep rings: how today is tracking against the recommended
 *  range for the baby's age, and how well the nights themselves are going -
 *  scored from the logs and compared with the week before. Everything here is
 *  derived from the same `baby_logs` rows the timeline uses; nothing is stored
 *  separately. */
export default function SleepRings({ userId, todayMin, totalLow, totalHigh }: Props) {
  const supabase = createClient()
  const [thisWeek, setThisWeek] = useState<Score>(null)
  const [lastWeek, setLastWeek] = useState<Score>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Midnight at the start of today, so "yesterday and back" is exact
      // regardless of what time it is now.
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const windowStart = new Date(todayStart.getTime() - WINDOW_DAYS * 2 * 86400000)

      const { data } = await supabase
        .from('baby_logs')
        .select('start_time, duration_min, is_night, sleep_quality')
        .eq('user_id', userId)
        .eq('type', 'sleep')
        .gte('start_time', windowStart.toISOString())
        .lt('start_time', todayStart.toISOString())
        .limit(2000)
      if (cancelled) return

      const rows = (data ?? []) as SleepRow[]
      const splitAt = new Date(todayStart.getTime() - WINDOW_DAYS * 86400000).getTime()
      setThisWeek(scoreWindow(rows.filter(r => new Date(r.start_time).getTime() >= splitAt)))
      setLastWeek(scoreWindow(rows.filter(r => new Date(r.start_time).getTime() < splitAt)))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [supabase, userId])

  const lowMin = totalLow * 60

  // Reaching the low end of the recommended range fills the ring - being at the
  // bottom of a healthy range is a goal met, not 80% of one.
  const todayPct = Math.min(1, todayMin / lowMin)
  const score = thisWeek

  const trend = useMemo(() => {
    if (score === null || lastWeek === null) return null
    const delta = score - lastWeek
    if (Math.abs(delta) < TREND_EPSILON) return { dir: 'flat' as const, delta }
    return { dir: delta > 0 ? ('up' as const) : ('down' as const), delta }
  }, [score, lastWeek])

  return (
    <div className="card">
      <h2 className="font-semibold flex items-center justify-center gap-2 mb-3 text-center" style={{ color: 'var(--text)' }}>
        <Moon className="w-4 h-4" style={{ color: BRAND }} />
        מדדי שינה
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <Ring
          label="שינה ב-24 שעות"
          pct={todayPct}
          center={fmtHours(todayMin)}
          centerSub="שעות"
          foot={
            todayMin >= lowMin
              ? `בטווח המומלץ (${totalLow}-${totalHigh} ש’)`
              : `מומלץ ${totalLow}-${totalHigh} ש’ בגיל הזה`
          }
        />

        <Ring
          label="איכות השינה"
          pct={score !== null ? score / 100 : 0}
          center={loading ? '' : score !== null ? String(score) : '—'}
          centerSub={score !== null && !loading ? 'מתוך 100' : ''}
          foot={
            loading
              ? 'טוען...'
              : score === null
                ? 'עוד אין מספיק לילות מתועדים'
                : trend
                  ? trendLabel(trend)
                  : 'עוד אין שבוע קודם להשוואה'
          }
          footIcon={trend ? (trend.dir === 'up' ? TrendingUp : trend.dir === 'down' ? TrendingDown : Minus) : undefined}
        />
      </div>

      <p className="text-[11px] leading-relaxed mt-3 text-center" style={{ color: 'var(--text-muted)' }}>
        ציון איכות השינה מחושב מהתיעודים שלך: אורך הרצף הארוך ביותר בלילה, כמה פעמים הלילה נקטע, ואיכות השינה שסימנת.
        הטווח המומלץ הוא הערכה לפי גיל בלבד - לכל תינוק יש קצב משלו. אם משהו מדאיג אותך, כדאי להתייעץ עם רופא ילדים או יועצת שינה.
      </p>
    </div>
  )
}

function trendLabel(trend: { dir: 'up' | 'down' | 'flat'; delta: number }): string {
  if (trend.dir === 'flat') return 'יציב מול השבוע שעבר'
  const pts = Math.abs(trend.delta)
  return trend.dir === 'up'
    ? `שיפור של ${pts} נק’ מהשבוע שעבר`
    : `ירידה של ${pts} נק’ מהשבוע שעבר`
}

// ─── Ring ─────────────────────────────────────────────────────
// A single SVG progress ring. Rotated -90° so the arc starts at 12 o'clock,
// and drawn with a stroke-dasharray offset rather than a path, which keeps the
// rounded cap looking right at every fill level.
const R = 34
const CIRC = 2 * Math.PI * R

function Ring({ label, pct, center, centerSub, foot, footIcon: FootIcon }: {
  label: string
  pct: number
  center: string
  centerSub: string
  foot: string
  footIcon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col items-center text-center gap-1.5">
      <span className="text-xs font-medium text-center" style={{ color: 'var(--text-muted)' }}>{label}</span>

      <div className="relative">
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="44" cy="44" r={R} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={R} fill="none"
            stroke={BRAND} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - Math.max(0, Math.min(1, pct)))}
            style={{ transition: 'stroke-dashoffset .6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-none" style={{ color: BRAND }}>{center}</span>
          {centerSub && <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{centerSub}</span>}
        </div>
      </div>

      <span className="text-[11px] flex items-center gap-1 justify-center text-center" style={{ color: 'var(--text-muted)' }}>
        {FootIcon && <FootIcon className="w-3 h-3 shrink-0" />}
        {foot}
      </span>
    </div>
  )
}
