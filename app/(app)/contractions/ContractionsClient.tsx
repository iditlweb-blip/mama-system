'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useContractionTimer, CONTRACTION_ADDED_EVT } from '@/lib/useContractionTimer'
import type { Contraction } from '@/types/database'
import { Activity, Play, Square, Plus, Trash2, Navigation, Settings, Clock, Info } from 'lucide-react'

const ACCENT = '#B24592'

function pad(n: number) { return String(n).padStart(2, '0') }
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fmtTime(iso: string) {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fmtDur(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60
  return m > 0 ? `${m} דק’ ${pad(s)} שנ’` : `${s} שנ’`
}
function fmtInterval(min: number) {
  if (min < 1) return 'פחות מדקה'
  const h = Math.floor(min / 60), m = Math.round(min % 60)
  return h > 0 ? `${h} שע’ ${m} דק’` : `${m} דק’`
}

type Guidance = {
  level: 'go' | 'prep' | 'early'
  title: string
  body: string
}

// The 5-1-1 rule (first-time labour): contractions ~5 min apart, lasting ~1
// min, sustained for ~1 hour → time to head to the hospital. We derive the
// numbers from the contractions logged in the last hour and translate them
// into three plain-language levels. This is guidance, never a substitute for
// the mother's doctor/midwife — the page states that explicitly.
function analyze(ascending: Contraction[]): { guidance: Guidance; avgInterval: number; avgDuration: number; regular: boolean; count: number } {
  const now = Date.now()
  const recent = ascending.filter(c => now - new Date(c.start_time).getTime() <= 60 * 60 * 1000)

  const intervals: number[] = []
  for (let i = 1; i < recent.length; i++) {
    const prev = new Date(recent[i - 1].start_time).getTime()
    const cur = new Date(recent[i].start_time).getTime()
    intervals.push((cur - prev) / 60000)
  }
  const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0)
  const avgInterval = avg(intervals)
  const avgDuration = avg(recent.map(c => c.duration_sec))
  const mean = avgInterval
  const std = intervals.length ? Math.sqrt(avg(intervals.map(x => (x - mean) ** 2))) : Infinity
  const regular = intervals.length >= 3 && std <= 1.5

  let guidance: Guidance
  if (regular && avgInterval > 0 && avgInterval <= 5 && avgDuration >= 45 && recent.length >= 4) {
    guidance = {
      level: 'go',
      title: 'זה הזמן לצאת לבית החולים 🏥',
      body: 'הצירים סדירים, במרווחים של כ-5 דקות ובאורך של כדקה, כבר למעלה משעה. זה בדרך כלל הסימן לצאת. קחי את התיק ותצאי — ובדרך אפשר להתקשר לבית החולים.',
    }
  } else if (regular && avgInterval > 0 && avgInterval <= 8 && recent.length >= 3) {
    guidance = {
      level: 'prep',
      title: 'התחילי להתארגן ליציאה',
      body: 'הצירים נהיים סדירים ומתקרבים זה לזה. זה זמן טוב לוודא שהתיק ללידה מוכן, לאכול משהו קל ולהיות בהישג יד לרכב.',
    }
  } else {
    guidance = {
      level: 'early',
      title: 'עדיין מוקדם — המשיכי לתעד',
      body: 'הצירים עדיין לא סדירים או שהמרווחים גדולים. נשמי, שתי מים, נוחי, והמשיכי לתעד. הדפוס יתחדד ככל שהלידה מתקרבת.',
    }
  }
  return { guidance, avgInterval, avgDuration, regular, count: recent.length }
}

export default function ContractionsClient({
  userId, hospitalAddress, initialContractions,
}: {
  userId: string
  hospitalAddress: string | null
  initialContractions: Contraction[]
}) {
  const supabase = createClient()
  const timer = useContractionTimer(userId)

  // Kept newest-first for display.
  const [list, setList] = useState<Contraction[]>(
    [...initialContractions].sort((a, b) => +new Date(b.start_time) - +new Date(a.start_time))
  )
  const [showManual, setShowManual] = useState(false)
  const [mStart, setMStart] = useState('')
  const [mEnd, setMEnd] = useState('')
  const [saving, setSaving] = useState(false)

  // A contraction recorded from the global bar (or here) broadcasts itself;
  // add it to the list, deduped by id.
  useEffect(() => {
    const onAdded = (e: Event) => {
      const c = (e as CustomEvent<Contraction>).detail
      if (!c) return
      setList(prev => (prev.some(x => x.id === c.id)
        ? prev
        : [c, ...prev].sort((a, b) => +new Date(b.start_time) - +new Date(a.start_time))))
    }
    window.addEventListener(CONTRACTION_ADDED_EVT, onAdded)
    return () => window.removeEventListener(CONTRACTION_ADDED_EVT, onAdded)
  }, [])

  const ascending = useMemo(
    () => [...list].sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time)),
    [list]
  )
  const { guidance, avgInterval, avgDuration, regular, count } = useMemo(
    () => analyze(ascending),
    // Re-run each render tick isn't needed; recompute when list changes.
    [ascending]
  )

  // Interval (minutes) before each contraction, keyed by id, for the timeline.
  const intervalBefore = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 1; i < ascending.length; i++) {
      const prev = new Date(ascending[i - 1].start_time).getTime()
      const cur = new Date(ascending[i].start_time).getTime()
      map.set(ascending[i].id, (cur - prev) / 60000)
    }
    return map
  }, [ascending])

  async function handleStop() {
    const c = await timer.stop()
    if (!c) alert('לא הצלחנו לשמור את הציר. נסי שוב בעוד רגע — הטיימר עדיין פועל.')
  }

  function openManual() {
    const now = new Date()
    const start = new Date(now.getTime() - 60000) // default: a 1-min contraction
    setMStart(toLocalInput(start))
    setMEnd(toLocalInput(now))
    setShowManual(true)
  }

  async function saveManual() {
    if (!mStart || !mEnd) return
    setSaving(true)
    const c = await timer.addManual(new Date(mStart).toISOString(), new Date(mEnd).toISOString())
    setSaving(false)
    if (!c) { alert('בדקי שזמן הסיום מאוחר מזמן ההתחלה.'); return }
    setShowManual(false)
  }

  async function remove(id: string) {
    setList(prev => prev.filter(c => c.id !== id))
    await supabase.from('contractions').delete().eq('id', id)
  }

  const wazeUrl = hospitalAddress
    ? `https://waze.com/ul?q=${encodeURIComponent(hospitalAddress)}&navigate=yes`
    : null

  const gColors = {
    go:   { bg: 'rgba(220,38,38,0.10)',  border: 'rgba(220,38,38,0.35)',  text: '#B91C1C' },
    prep: { bg: 'rgba(217,119,6,0.10)',  border: 'rgba(217,119,6,0.35)',  text: '#B45309' },
    early:{ bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.30)',  text: '#15803D' },
  }[guidance.level]

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${ACCENT}18` }}>
          <Activity className="w-5 h-5" style={{ color: ACCENT }} />
        </div>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>מד צירים</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>תזמון הצירים ומתי כדאי לצאת לבית החולים</p>
        </div>
      </div>

      {/* Start / Stop */}
      <div className="rounded-2xl p-5 text-center" style={{ background: '#fff', border: '1px solid var(--border)' }}>
        {timer.active ? (
          <>
            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>ציר פעיל</p>
            <p className="font-mono text-4xl font-bold mb-4" style={{ color: ACCENT }}>{timer.formatClock(timer.elapsed)}</p>
            <button
              onClick={handleStop}
              disabled={timer.stopping}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-60"
              style={{ background: ACCENT }}
            >
              <Square className="w-4 h-4" fill="white" /> {timer.stopping ? 'שומרת...' : 'סיום ציר'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>לחצי כשמתחיל ציר, ושוב כשהוא נגמר</p>
            <button
              onClick={timer.start}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-white font-semibold"
              style={{ background: ACCENT }}
            >
              <Play className="w-4 h-4" fill="white" /> התחלת ציר
            </button>
          </>
        )}
        <div className="mt-4">
          <button
            onClick={openManual}
            className="inline-flex items-center gap-1.5 text-sm font-medium"
            style={{ color: ACCENT }}
          >
            <Plus className="w-4 h-4" /> הוספת ציר ידנית
          </button>
        </div>
      </div>

      {/* Manual entry */}
      {showManual && (
        <div className="rounded-2xl p-4 space-y-3" style={{ background: '#fff', border: `1px solid ${ACCENT}40` }}>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>הוספת ציר ידנית</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
              התחלה
              <input type="datetime-local" value={mStart} onChange={e => setMStart(e.target.value)}
                className="mt-1 w-full rounded-lg px-2 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </label>
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
              סיום
              <input type="datetime-local" value={mEnd} onChange={e => setMEnd(e.target.value)}
                className="mt-1 w-full rounded-lg px-2 py-2 text-sm" style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowManual(false)} className="px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--text-muted)' }}>ביטול</button>
            <button onClick={saveManual} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: ACCENT }}>
              {saving ? 'שומרת...' : 'שמירה'}
            </button>
          </div>
        </div>
      )}

      {/* Guidance / regularity */}
      <div className="rounded-2xl p-4" style={{ background: gColors.bg, border: `1px solid ${gColors.border}` }}>
        <p className="font-semibold mb-1" style={{ color: gColors.text }}>{guidance.title}</p>
        <p className="text-sm mb-3" style={{ color: 'var(--text)' }}>{guidance.body}</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="בשעה האחרונה" value={`${count}`} unit="צירים" />
          <Stat label="מרווח ממוצע" value={avgInterval > 0 ? avgInterval.toFixed(1) : '—'} unit="דקות" />
          <Stat label="אורך ממוצע" value={avgDuration > 0 ? Math.round(avgDuration).toString() : '—'} unit="שניות" />
        </div>
        <p className="text-xs mt-3 flex items-start gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {regular ? 'הצירים שלך סדירים.' : 'הצירים עדיין לא סדירים.'} זו הערכה כללית בלבד. אם ירדו מים, יש דימום, כאב חזק או ירידה בתנועות העובר — פני לבית החולים או התקשרי מיד, ללא קשר למספרים.
        </p>
      </div>

      {/* Waze */}
      <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid var(--border)' }}>
        {wazeUrl ? (
          <>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>בית החולים ללידה:</p>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>{hospitalAddress}</p>
            <a
              href={wazeUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold"
              style={{ background: '#33CCFF' }}
            >
              <Navigation className="w-4 h-4" fill="white" /> ניווט לבית החולים ב-Waze
            </a>
          </>
        ) : (
          <div className="flex items-start gap-2">
            <Settings className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              כדי לקבל כפתור ניווט מהיר לבית החולים, הוסיפי את כתובת בית החולים ללידה ב
              <a href="/settings" className="font-medium underline" style={{ color: ACCENT }}> הגדרות</a>.
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
          <Clock className="w-4 h-4" style={{ color: ACCENT }} /> ציר זמן
        </h2>
        {list.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>עדיין לא תועדו צירים.</p>
        ) : (
          <div className="space-y-2">
            {list.map(c => {
              const iv = intervalBefore.get(c.id)
              const d = new Date(c.start_time)
              return (
                <div key={c.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: '#fff', border: '1px solid var(--border)' }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {fmtTime(c.start_time)} · {fmtDur(c.duration_sec)}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                      {iv != null && <> · מרווח מהקודם: {fmtInterval(iv)}</>}
                    </p>
                  </div>
                  <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:opacity-70" title="מחיקה" style={{ color: 'var(--text-muted)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl py-2" style={{ background: 'rgba(255,255,255,0.6)' }}>
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-lg font-bold leading-tight" style={{ color: 'var(--text)' }}>{value}</p>
      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{unit}</p>
    </div>
  )
}
