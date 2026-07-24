'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BabyLog } from '@/types/database'
import { Moon, BedDouble, Clock, ChevronRight, ChevronLeft, Sun } from 'lucide-react'

// Colours match the daily timeline: night sleeps are night-blue, day naps green.
const NIGHT = '#3C3C6E'
const DAY = '#5C7A6A'

const DAY_MS = 24 * 3600 * 1000

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function fmtDur(min: number): string {
  if (min <= 0) return '0'
  const h = Math.floor(min / 60), m = Math.round(min % 60)
  if (h && m) return `${h} ש’ ${m} ד’`
  if (h) return `${h} ש’`
  return `${m} ד’`
}

const hhmm = (d: Date) => d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

// A sleep segment clamped to a single calendar day (00:00–24:00 of that day).
interface DaySegment {
  id: string
  leftPct: number      // 0–100, position of the segment start within the day
  widthPct: number     // 0–100, how much of the day it covers
  minutes: number      // clamped minutes within this day
  isNight: boolean
  fromLabel: string    // real start clock (may be previous day)
  toLabel: string      // real end clock (may be next day)
  crossesIn: boolean   // started before this day (carried over from midnight)
  crossesOut: boolean  // continues past this day (past midnight)
}

export default function SleepArchiveTab({ babyName }: { babyName: string | null }) {
  const supabase = createClient()
  const [sleeps, setSleeps] = useState<BabyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Date>(() => startOfDay(new Date()))

  // Fetch the last 45 days of sleep logs once. We include any sleep whose
  // end_time OR start_time falls in the window so overnight sleeps stay visible.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const since = new Date(Date.now() - 45 * DAY_MS).toISOString()
      const { data } = await supabase
        .from('baby_logs')
        .select('*')
        .eq('type', 'sleep')
        .or(`start_time.gte.${since},end_time.gte.${since}`)
        .order('start_time', { ascending: true })
      if (!cancelled) {
        setSleeps((data as BabyLog[]) ?? [])
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [supabase])

  // End time for a sleep: explicit end_time, else start + duration, else null.
  function sleepEnd(log: BabyLog): Date | null {
    if (log.end_time) return new Date(log.end_time)
    if (log.duration_min) return new Date(new Date(log.start_time).getTime() + log.duration_min * 60000)
    return null
  }

  // Which days actually have sleep data — used to build the day strip.
  const daysWithData = useMemo(() => {
    const set = new Set<number>()
    for (const s of sleeps) {
      const start = new Date(s.start_time)
      const end = sleepEnd(s) ?? start
      // Mark every calendar day the sleep touches.
      let d = startOfDay(start).getTime()
      const last = startOfDay(end).getTime()
      while (d <= last) { set.add(d); d += DAY_MS }
    }
    return set
  }, [sleeps])

  // Build the strip of the last 14 days (newest on the right for RTL flow).
  const strip = useMemo(() => {
    const arr: Date[] = []
    const today = startOfDay(new Date())
    for (let i = 13; i >= 0; i--) arr.push(new Date(today.getTime() - i * DAY_MS))
    return arr
  }, [])

  // Segments + summary for the currently-selected day.
  const { segments, totalMin, nightMin, napCount } = useMemo(() => {
    const dayStart = selected.getTime()
    const dayEnd = dayStart + DAY_MS
    const segs: DaySegment[] = []
    let total = 0, night = 0, naps = 0
    for (const s of sleeps) {
      const start = new Date(s.start_time).getTime()
      const end = (sleepEnd(s) ?? new Date(s.start_time)).getTime()
      // Overlap with this day window.
      const from = Math.max(start, dayStart)
      const to = Math.min(end, dayEnd)
      if (to <= from) continue
      const minutes = (to - from) / 60000
      const isNight = !!s.is_night
      total += minutes
      if (isNight) night += minutes
      else naps += 1
      segs.push({
        id: s.id,
        leftPct: ((from - dayStart) / DAY_MS) * 100,
        widthPct: (minutes / 1440) * 100,
        minutes,
        isNight,
        fromLabel: hhmm(new Date(start)),
        toLabel: end > start ? hhmm(new Date(end)) : '',
        crossesIn: start < dayStart,
        crossesOut: end > dayEnd,
      })
    }
    return { segments: segs, totalMin: total, nightMin: night, napCount: naps }
  }, [sleeps, selected])

  const selectedLabel = selected.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
  const isToday = selected.getTime() === startOfDay(new Date()).getTime()

  function shiftDay(delta: number) {
    setSelected(prev => startOfDay(new Date(prev.getTime() + delta * DAY_MS)))
  }

  // Hour ticks for the timeline (every 6 hours).
  const ticks = [0, 6, 12, 18, 24]

  return (
    <div className="space-y-5">
      {/* Day navigator */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => shiftDay(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--surface-2, #FAF4ED)', border: '1px solid var(--border)' }}
            title="יום קודם"
          >
            <ChevronRight className="w-4 h-4" style={{ color: 'var(--text)' }} />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{selectedLabel}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{isToday ? 'היום' : ''}</p>
          </div>
          <button
            onClick={() => shiftDay(1)}
            disabled={isToday}
            className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40"
            style={{ background: 'var(--surface-2, #FAF4ED)', border: '1px solid var(--border)' }}
            title="יום הבא"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: 'var(--text)' }} />
          </button>
        </div>

        {/* 14-day strip — a mini calendar of recent days */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ direction: 'rtl' }}>
          {strip.map(d => {
            const active = d.getTime() === selected.getTime()
            const hasData = daysWithData.has(d.getTime())
            return (
              <button
                key={d.getTime()}
                onClick={() => setSelected(d)}
                className="flex flex-col items-center flex-shrink-0 rounded-xl px-2.5 py-1.5 transition-all"
                style={active
                  ? { background: '#7F5268', color: '#fff' }
                  : { background: 'var(--surface-2, #FAF4ED)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                <span className="text-[10px] font-medium">{d.toLocaleDateString('he-IL', { weekday: 'short' })}</span>
                <span className="text-sm font-bold">{d.getDate()}</span>
                <span
                  className="w-1.5 h-1.5 rounded-full mt-0.5"
                  style={{ background: hasData ? (active ? '#fff' : '#5C7A6A') : 'transparent' }}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary + timeline */}
      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Moon className="w-4 h-4" style={{ color: NIGHT }} />
          ציר שינה — {selectedLabel}
        </h2>

        {loading ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>טוענת...</p>
        ) : segments.length === 0 ? (
          <div className="text-center py-10">
            <BedDouble className="w-10 h-10 mx-auto mb-3" style={{ color: '#7F5268' }} />
            <p className="font-semibold" style={{ color: 'var(--text)' }}>אין רישומי שינה ליום זה</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>בחרי יום אחר מהרצועה למעלה</p>
          </div>
        ) : (
          <>
            {/* Summary tiles */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <ArchiveTile icon={Clock}     color="#7F5268" label="סה״כ שינה" value={fmtDur(totalMin)} />
              <ArchiveTile icon={Moon}      color={NIGHT}    label="שנת לילה" value={fmtDur(nightMin)} />
              <ArchiveTile icon={Sun}       color={DAY}      label="שנצים"     value={String(napCount)} />
            </div>

            {/* 24-hour horizontal timeline */}
            <div className="mb-2">
              <div
                className="relative w-full rounded-xl overflow-hidden"
                style={{ height: 40, background: 'var(--surface-2, #FAF4ED)', direction: 'ltr' }}
              >
                {segments.map(seg => (
                  <div
                    key={seg.id}
                    title={`${seg.fromLabel}${seg.toLabel ? '–' + seg.toLabel : ''} · ${fmtDur(seg.minutes)}`}
                    className="absolute top-0 bottom-0"
                    style={{
                      left: `${seg.leftPct}%`,
                      width: `${Math.max(seg.widthPct, 1)}%`,
                      background: seg.isNight ? NIGHT : DAY,
                      borderTopLeftRadius: seg.crossesIn ? 0 : 6,
                      borderBottomLeftRadius: seg.crossesIn ? 0 : 6,
                      borderTopRightRadius: seg.crossesOut ? 0 : 6,
                      borderBottomRightRadius: seg.crossesOut ? 0 : 6,
                    }}
                  />
                ))}
              </div>
              {/* Hour ticks */}
              <div className="relative w-full mt-1" style={{ height: 14, direction: 'ltr' }}>
                {ticks.map(h => (
                  <span
                    key={h}
                    className="absolute text-[10px]"
                    style={{
                      left: `${(h / 24) * 100}%`,
                      transform: h === 0 ? 'none' : h === 24 ? 'translateX(-100%)' : 'translateX(-50%)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </span>
                ))}
              </div>
            </div>

            {/* Per-sleep list */}
            <div className="space-y-2 mt-4">
              {segments.map(seg => (
                <div
                  key={seg.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
                  style={{ background: `${seg.isNight ? NIGHT : DAY}12` }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {seg.isNight
                      ? <Moon className="w-4 h-4 flex-shrink-0" style={{ color: NIGHT }} />
                      : <BedDouble className="w-4 h-4 flex-shrink-0" style={{ color: DAY }} />}
                    <span className="text-sm font-medium" style={{ color: seg.isNight ? NIGHT : DAY }}>
                      {seg.isNight ? 'שנת לילה' : 'שנ״צ'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {seg.fromLabel}{seg.toLabel ? `–${seg.toLabel}` : ''}
                    </span>
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'var(--text)' }}>
                    {fmtDur(seg.minutes)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        הארכיון שומר את שנת {babyName || 'התינוק/ת'} מ־45 הימים האחרונים 💜
      </p>
    </div>
  )
}

function ArchiveTile({ icon: Icon, color, label, value }: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string; label: string; value: string
}) {
  return (
    <div className="rounded-xl p-2.5 text-center" style={{ background: `${color}0f`, border: `1px solid ${color}25` }}>
      <Icon className="w-5 h-5 mx-auto" style={{ color }} />
      <p className="text-sm font-bold mt-1" style={{ color }}>{value}</p>
      <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}
