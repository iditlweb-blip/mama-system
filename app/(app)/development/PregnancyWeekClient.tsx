'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Baby, Sparkles, Ruler, CalendarClock, ChevronDown, ChevronUp } from 'lucide-react'
import { FETAL_WEEKS, getFetalWeek } from '@/lib/fetalWeeks'
import { calcPregnancyWeek } from '@/lib/pregnancy'

export default function PregnancyWeekClient({ dueDate }: { dueDate: string | null }) {
  const router = useRouter()
  const currentWeek = calcPregnancyWeek(dueDate)
  const current = getFetalWeek(currentWeek)
  const [activeWeek, setActiveWeek] = useState<number>(current?.week ?? FETAL_WEEKS[0].week)

  const stage = FETAL_WEEKS.find(w => w.week === activeWeek) ?? FETAL_WEEKS[0]

  return (
    <div className="space-y-5 max-w-3xl">
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

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Baby className="w-6 h-6" style={{ color: 'var(--primary)' }} />
          מה קורה השבוע
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {currentWeek > 0 ? `את בשבוע ${currentWeek} להריון — מה מתפתח אצל התינוק/ת` : 'התפתחות העובר שבוע אחר שבוע'}
        </p>
      </div>

      {/* Week tabs */}
      <div className="flex gap-2 flex-wrap">
        {FETAL_WEEKS.map(w => {
          const isCurrent = w.week === current?.week
          const active = w.week === activeWeek
          return (
            <button
              key={w.week}
              onClick={() => setActiveWeek(w.week)}
              className="flex items-center gap-1 px-3.5 py-2 rounded-full text-sm font-medium transition-all"
              style={active
                ? { background: 'var(--primary)', color: 'white' }
                : { background: 'var(--surface)', color: 'var(--text-muted)', border: `1px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'}` }
              }
            >
              שבוע {w.week}
              {isCurrent && <span style={{ fontSize: '0.6rem' }}>●</span>}
            </button>
          )
        })}
      </div>

      {/* Main week card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(127,82,104,0.1), rgba(196,160,180,0.1))' }}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h2 className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>
              שבוע {stage.week} · {stage.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{stage.summary}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'rgba(127,82,104,0.12)', color: '#7F5268' }}>
            <Baby className="w-3.5 h-3.5" /> בגודל {stage.size}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'rgba(92,122,106,0.12)', color: '#5C7A6A' }}>
            <Ruler className="w-3.5 h-3.5" /> {stage.length}
          </span>
        </div>
      </div>

      {/* Highlights */}
      <div className="card">
        <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          מה מתפתח השבוע
        </h3>
        <ul className="space-y-2.5">
          {stage.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-3 p-3 rounded-xl text-sm" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268' }}
              >
                {i + 1}
              </span>
              <span className="font-light leading-relaxed">{h}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Timeline of all weeks */}
      <WeekTimeline activeWeek={activeWeek} currentWeek={current?.week} onSelect={setActiveWeek} />
    </div>
  )
}

function WeekTimeline({ activeWeek, currentWeek, onSelect }: {
  activeWeek: number
  currentWeek: number | undefined
  onSelect: (w: number) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <CalendarClock className="w-5 h-5" style={{ color: '#5C7A6A' }} />
          ציר הזמן המלא
        </h3>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          {FETAL_WEEKS.map(w => {
            const active = w.week === activeWeek
            const isCurrent = w.week === currentWeek
            return (
              <button
                key={w.week}
                onClick={() => onSelect(w.week)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-right"
                style={{ background: active ? 'rgba(127,82,104,0.1)' : 'var(--bg)', border: isCurrent ? '1px solid var(--primary)' : '1px solid transparent' }}
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: active ? '#7F5268' : 'rgba(127,82,104,0.1)', color: active ? '#fff' : '#7F5268' }}
                >
                  {w.week}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{w.title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>בגודל {w.size}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
