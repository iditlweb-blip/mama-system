'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Moon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const SLEEP_GREEN = '#5C7A6A'
const WARM_AMBER  = '#B07C4A'

// Two windows of seven whole days each, ending yesterday. Today is deliberately
// excluded from both: a day that is only half over always looks like a drop,
// which would make the trend read "worse" every single morning.
const WINDOW_DAYS = 7
// Below this many tracked days in a window there isn't enough to average
// honestly, so the trend stays hidden rather than showing a number built on
// one or two nights.
const MIN_DAYS_FOR_TREND = 3

interface Props {
  userId: string
  /** Sleep minutes recorded for the current 24h, including a running timer. */
  todayMin: number
  /** Recommended total sleep per 24h for the baby's age band, in hours. */
  totalLow: number
  totalHigh: number
}

interface WindowStats {
  avgMin: number
  daysWithData: number
}

// Local calendar date key (YYYY-MM-DD) - a sleep belongs to the day it started
// on, so a 23:30 bedtime counts toward that evening rather than the next
// morning.
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtHours(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

/** Two at-a-glance sleep rings: how today is tracking against the recommended
 *  range for the baby's age, and how the last week compares with the one
 *  before it. Both read from the same `baby_logs` sleep rows the timeline uses;
 *  nothing here is stored separately. */
export default function SleepRings({ userId, todayMin, totalLow, totalHigh }: Props) {
  const supabase = createClient()
  const [thisWeek, setThisWeek] = useState<WindowStats | null>(null)
  const [lastWeek, setLastWeek] = useState<WindowStats | null>(null)
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
        .select('start_time, duration_min')
        .eq('user_id', userId)
        .eq('type', 'sleep')
        .gte('start_time', windowStart.toISOString())
        .lt('start_time', todayStart.toISOString())
        .limit(2000)
      if (cancelled) return

      // Bucket minutes per calendar day, then split the buckets into the two
      // seven-day windows.
      const perDay = new Map<string, number>()
      for (const log of data ?? []) {
        if (!log.duration_min) continue
        const key = dayKey(new Date(log.start_time))
        perDay.set(key, (perDay.get(key) ?? 0) + log.duration_min)
      }

      const statsFor = (offsetDays: number): WindowStats => {
        let total = 0
        let daysWithData = 0
        for (let i = 1; i <= WINDOW_DAYS; i++) {
          const d = new Date(todayStart.getTime() - (offsetDays + i) * 86400000)
          const mins = perDay.get(dayKey(d))
          // Days with no logs at all are days she wasn't tracking, not days the
          // baby didn't sleep - averaging them in as zeros would be wrong.
          if (mins === undefined) continue
          total += mins
          daysWithData++
        }
        return { avgMin: daysWithData > 0 ? total / daysWithData : 0, daysWithData }
      }

      setThisWeek(statsFor(0))
      setLastWeek(statsFor(WINDOW_DAYS))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [supabase, userId])

  const lowMin = totalLow * 60
  const highMin = totalHigh * 60

  // Reaching the low end of the recommended range fills the ring - being at the
  // bottom of a healthy range is a goal met, not 80% of one.
  const todayPct = Math.min(1, todayMin / lowMin)
  const weekPct = thisWeek && thisWeek.daysWithData > 0 ? Math.min(1, thisWeek.avgMin / lowMin) : 0

  const trend = useMemo(() => {
    if (!thisWeek || !lastWeek) return null
    if (thisWeek.daysWithData < MIN_DAYS_FOR_TREND || lastWeek.daysWithData < MIN_DAYS_FOR_TREND) return null
    const deltaMin = Math.round(thisWeek.avgMin - lastWeek.avgMin)
    // Under a quarter hour either way is noise, not a change worth naming.
    if (Math.abs(deltaMin) < 15) return { dir: 'flat' as const, deltaMin }
    return { dir: deltaMin > 0 ? ('up' as const) : ('down' as const), deltaMin }
  }, [thisWeek, lastWeek])

  return (
    <div className="card">
      <h2 className="font-semibold flex items-center gap-2 mb-3" style={{ color: 'var(--text)' }}>
        <Moon className="w-4 h-4" style={{ color: SLEEP_GREEN }} />
        מדדי שינה
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <Ring
          label="שינה ב-24 שעות"
          pct={todayPct}
          center={fmtHours(todayMin)}
          centerSub="שעות"
          color={todayMin >= lowMin ? SLEEP_GREEN : WARM_AMBER}
          foot={`מומלץ ${totalLow}-${totalHigh} ש’ בגיל הזה`}
        />

        <Ring
          label="ממוצע השבוע"
          pct={weekPct}
          center={loading || !thisWeek || thisWeek.daysWithData === 0 ? '—' : fmtHours(thisWeek.avgMin)}
          centerSub={loading || !thisWeek || thisWeek.daysWithData === 0 ? '' : 'שעות'}
          color={thisWeek && thisWeek.avgMin >= lowMin ? SLEEP_GREEN : WARM_AMBER}
          foot={
            loading
              ? 'טוען...'
              : trend
                ? trendLabel(trend)
                : 'עוד אין מספיק ימים להשוואה'
          }
          footColor={trend ? (trend.dir === 'up' ? SLEEP_GREEN : trend.dir === 'down' ? WARM_AMBER : 'var(--text-muted)') : undefined}
          footIcon={trend ? (trend.dir === 'up' ? TrendingUp : trend.dir === 'down' ? TrendingDown : Minus) : undefined}
        />
      </div>

      <p className="text-[11px] leading-relaxed mt-3" style={{ color: 'var(--text-muted)' }}>
        הטווח המומלץ הוא הערכה לפי גיל בלבד. לכל תינוק יש קצב משלו - אם משהו מדאיג אותך, כדאי להתייעץ עם רופא ילדים או יועצת שינה.
      </p>
    </div>
  )
}

function trendLabel(trend: { dir: 'up' | 'down' | 'flat'; deltaMin: number }): string {
  if (trend.dir === 'flat') return 'יציב מול השבוע שעבר'
  const abs = Math.abs(trend.deltaMin)
  const amount = abs >= 60 ? `${fmtHours(abs)} ש’` : `${abs} דק’`
  return trend.dir === 'up'
    ? `${amount} יותר מהשבוע שעבר`
    : `${amount} פחות מהשבוע שעבר`
}

// ─── Ring ─────────────────────────────────────────────────────
// A single SVG progress ring. Rotated -90° so the arc starts at 12 o'clock,
// and drawn with a stroke-dasharray offset rather than a path, which keeps the
// rounded cap looking right at every fill level.
const R = 34
const CIRC = 2 * Math.PI * R

function Ring({ label, pct, center, centerSub, color, foot, footColor, footIcon: FootIcon }: {
  label: string
  pct: number
  center: string
  centerSub: string
  color: string
  foot: string
  footColor?: string
  footIcon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col items-center text-center gap-1.5">
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>

      <div className="relative">
        <svg width="88" height="88" viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="44" cy="44" r={R} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={R} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - Math.max(0, Math.min(1, pct)))}
            style={{ transition: 'stroke-dashoffset .6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-none" style={{ color }}>{center}</span>
          {centerSub && <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{centerSub}</span>}
        </div>
      </div>

      <span className="text-[11px] flex items-center gap-1 justify-center" style={{ color: footColor ?? 'var(--text-muted)' }}>
        {FootIcon && <FootIcon className="w-3 h-3" />}
        {foot}
      </span>
    </div>
  )
}
