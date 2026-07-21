'use client'

// Split out of TrackerClient.tsx and loaded via next/dynamic so the vaccine
// schedule/health-event UI isn't part of the initial JS bundle for users who
// land on the default "daily" tab.
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Syringe, CalendarPlus, Baby, ClipboardList, Clock, Calendar,
  CheckCircle2, Circle, Trash2,
} from 'lucide-react'

export interface HealthEvent {
  id: string
  user_id: string
  type: 'vaccine' | 'checkup' | 'other'
  title: string
  scheduled_date: string
  completed: boolean
  notes?: string | null
}

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

export default function HealthTab({ healthEvents, setHealthEvents, userId, babyBirthdate, babyMonths }: {
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
          <h2 className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text)' }}><Syringe className="w-4 h-4" /> חיסונים ובדיקות</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>לו”ז חיסונים לפי מזכ”ל משרד הבריאות</p>
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
            {([['vaccine', Syringe, 'חיסון'], ['checkup', Baby, 'בדיקה'], ['other', ClipboardList, 'אחר']] as const).map(([t, Icon, lbl]) => (
              <button key={t} onClick={() => setNewType(t)}
                className="py-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1"
                style={newType === t
                  ? { background: '#7F5268', color: 'white' }
                  : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }>
                <Icon className="w-4 h-4" />{lbl}
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
          <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text)' }}><Clock className="w-3.5 h-3.5" /> עתידיים ({upcoming.length})</p>
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
          <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--text)' }}><ClipboardList className="w-3.5 h-3.5" /> לוח חיסונים מומלץ</p>
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
                  {isPast
                    ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#4A7C59' }} />
                    : isSoon
                      ? <Clock className="w-5 h-5 flex-shrink-0" style={{ color: '#B8860B' }} />
                      : <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  }
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
  const TypeIcon = { vaccine: Syringe, checkup: Baby, other: ClipboardList }[event.type]
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
      <TypeIcon className="w-4 h-4 flex-shrink-0" style={{ color: '#7F5268' }} />
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
