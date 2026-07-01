'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, Loader2, Heart, Trash2, Sparkles, FileText, Check, ChevronRight,
  Coffee, Footprints, Palette, BookOpen, Flower2, HandHeart, Music2, Leaf,
  Star, Calendar, type LucideIcon
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface PersonalLog {
  id: string
  user_id: string
  category: string
  title: string
  notes?: string | null
  duration_min?: number | null
  created_at: string
}

const ACTIVITIES: { key: string; icon: LucideIcon; label: string; color: string }[] = [
  { key: 'coffee', icon: Coffee, label: 'קפה עם חברה', color: '#8B5A2B' },
  { key: 'sport', icon: Footprints, label: 'ספורט', color: '#4A7C59' },
  { key: 'hobby', icon: Palette, label: 'חוג / תחביב', color: '#7F5268' },
  { key: 'reading', icon: BookOpen, label: 'קריאה', color: '#5C6BA0' },
  { key: 'meditation', icon: Flower2, label: 'מנוחה / מדיטציה', color: '#7A6A3C' },
  { key: 'pampering', icon: HandHeart, label: 'טיפוח עצמי', color: '#A0567A' },
  { key: 'music', icon: Music2, label: 'מוסיקה / יצירה', color: '#5C7A8A' },
  { key: 'nature', icon: Leaf, label: 'טבע / הליכה', color: '#4A7C59' },
  { key: 'other', icon: Sparkles, label: 'משהו אחר', color: '#7F5268' },
]

const MOTIVATIONS: { text: string; icon?: LucideIcon }[] = [
  { text: 'את מתנה לעצמך כשאת דואגת לעצמך', icon: Heart },
  { text: 'אמא מאושרת = ילד מאושר', icon: Flower2 },
  { text: 'לא אנוכי לדאוג לעצמך — זה הכרחי' },
  { text: 'כל דקה לעצמך היא השקעה במשפחה שלך' },
  { text: 'את מספיקה. את עושה מספיק. את מספיקה.' },
  { text: 'גם סופגנייה עם קפה ספירה כ"לעצמי"', icon: Coffee },
]

interface Props {
  userId: string
  initialLogs: PersonalLog[]
}

export default function PersonalClient({ userId, initialLogs }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [logs, setLogs] = useState<PersonalLog[]>(initialLogs)
  const [adding, setAdding] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [duration, setDuration] = useState('')
  const [saving, setSaving] = useState(false)
  const [dbError, setDbError] = useState(false)

  // Personal note (saved to localStorage)
  const NOTE_KEY = `personal_note_${userId}`
  const [noteText, setNoteText] = useState('')
  const [noteSaved, setNoteSaved] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setNoteText(localStorage.getItem(NOTE_KEY) || '')
  }, [NOTE_KEY])

  function handleNoteChange(val: string) {
    setNoteText(val)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(NOTE_KEY, val)
      setNoteSaved(true)
      setTimeout(() => setNoteSaved(false), 2000)
    }, 800)
  }

  const motivation = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length]

  // Stats
  const today = new Date().toISOString().split('T')[0]
  const thisWeek = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const todayCount = logs.filter(l => l.created_at.startsWith(today)).length
  const weekCount = logs.filter(l => l.created_at >= thisWeek).length

  const selectedActivity = ACTIVITIES.find(a => a.key === selectedCategory)

  async function handleAdd() {
    if (!selectedCategory) return
    setSaving(true)
    setDbError(false)

    const activity = ACTIVITIES.find(a => a.key === selectedCategory)!
    const title = selectedCategory === 'other' && customTitle ? customTitle : activity.label

    const newLog = {
      user_id: userId,
      category: selectedCategory,
      title,
      notes: notes || null,
      duration_min: duration ? parseInt(duration) : null,
    }

    const { data, error } = await supabase
      .from('personal_logs')
      .insert(newLog)
      .select()
      .single()

    if (error) {
      // Table might not exist — store locally
      setDbError(true)
      const localLog: PersonalLog = {
        id: crypto.randomUUID(),
        ...newLog,
        notes: notes || null,
        duration_min: duration ? parseInt(duration) : null,
        created_at: new Date().toISOString(),
      }
      setLogs(prev => [localLog, ...prev])
    } else {
      setLogs(prev => [data, ...prev])
    }

    setSelectedCategory('')
    setCustomTitle('')
    setNotes('')
    setDuration('')
    setAdding(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    setLogs(prev => prev.filter(l => l.id !== id))
    await supabase.from('personal_logs').delete().eq('id', id)
  }

  return (
    <div className="space-y-6 max-w-2xl">
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            תדאגי לעצמך
            <Heart className="w-5 h-5" style={{ color: '#7F5268' }} />
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>כי אמא מאושרת = ילד מאושר</p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="btn-brand text-sm px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            רשמי פעילות
          </button>
        )}
      </div>

      {/* Motivation */}
      <div className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(127,82,104,0.06)', border: '1px solid rgba(127,82,104,0.12)' }}>
        <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#7F5268' }} />
        <p className="text-sm font-light italic flex items-center gap-1.5 flex-wrap" style={{ color: '#7F5268' }}>
          {motivation.text}
          {motivation.icon && <motivation.icon size={14} />}
        </p>
      </div>

      {/* DB warning */}
      {dbError && (
        <div className="rounded-xl p-3 text-xs" style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
          הפעילות נשמרה זמנית (ברמת הדפדפן). להפעלת שמירה מלאה — יש להריץ את <code>supabase/migrations/003_personal.sql</code> בדשבורד Supabase.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Star} label="היום" value={todayCount} unit="פעילויות" />
        <StatCard icon={Calendar} label="השבוע" value={weekCount} unit="פעילויות" />
      </div>

      {/* Add form */}
      {adding && (
        <div className="card space-y-4">
          <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            מה עשית לעצמך?
            <Flower2 size={16} style={{ color: '#7F5268' }} />
          </h2>

          {/* Activity grid */}
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITIES.map(act => (
              <button
                key={act.key}
                onClick={() => setSelectedCategory(act.key)}
                className="rounded-xl p-3 text-center transition-all flex flex-col items-center gap-1"
                style={selectedCategory === act.key
                  ? { background: act.color, color: '#fff', transform: 'scale(1.03)' }
                  : { background: `${act.color}15`, color: act.color, border: `1px solid ${act.color}30` }
                }
              >
                <act.icon size={22} />
                <span className="text-xs font-medium leading-tight">{act.label}</span>
              </button>
            ))}
          </div>

          {/* Custom title if "other" */}
          {selectedCategory === 'other' && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>מה עשית?</label>
              <input
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="תיאור קצר..."
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
          )}

          {/* Duration */}
          {selectedCategory && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>משך (דקות)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="30"
                  min="1"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>הערה (אופציונלי)</label>
                <input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="עם מי, איפה..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!selectedCategory || saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: selectedActivity?.color || '#7F5268' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
              {saving ? 'שומרת...' : 'שמרי!'}
            </button>
            <button
              onClick={() => { setAdding(false); setSelectedCategory(''); setNotes(''); setDuration('') }}
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Activities grid (quick-add shortcuts) */}
      {!adding && (
        <div className="card">
          <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>מה מתחשק לי עכשיו?</h2>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITIES.filter(a => a.key !== 'other').map(act => (
              <button
                key={act.key}
                onClick={() => { setSelectedCategory(act.key); setAdding(true) }}
                className="rounded-xl p-3 text-center transition-all hover:scale-105 flex flex-col items-center gap-1"
                style={{ background: `${act.color}12`, color: act.color, border: `1px solid ${act.color}20` }}
              >
                <act.icon size={26} />
                <span className="text-xs font-medium leading-tight">{act.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Personal note */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <FileText className="w-4 h-4" style={{ color: '#7F5268' }} />
            פתק אישי
          </h2>
          {noteSaved && (
            <span className="text-xs flex items-center gap-1" style={{ color: '#4A7C59' }}>
              <Check className="w-3 h-3" /> נשמר
            </span>
          )}
        </div>
        <textarea
          value={noteText}
          onChange={e => handleNoteChange(e.target.value)}
          placeholder="כתבי כאן כל מה שעל הלב — חלומות, תוכניות, מחשבות, מה שמתחשק..."
          rows={5}
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none leading-relaxed"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
      </div>

      {/* Log */}
      <div>
        <h2 className="font-semibold mb-3" style={{ color: 'var(--text)' }}>
          פעילויות אחרונות {logs.length > 0 && <span className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>({logs.length})</span>}
        </h2>

        {logs.length === 0 ? (
          <div className="card text-center py-10">
            <div className="flex justify-center mb-3">
              <Flower2 size={40} style={{ color: '#7F5268' }} />
            </div>
            <p className="font-medium" style={{ color: 'var(--text)' }}>עוד לא רשמת שום דבר</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>הגיע הזמן לעשות משהו רק לעצמך!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map(log => {
              const act = ACTIVITIES.find(a => a.key === log.category) || ACTIVITIES[ACTIVITIES.length - 1]
              const date = new Date(log.created_at)
              const dateStr = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', weekday: 'short' })
              const timeStr = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
              return (
                <div key={log.id} className="card py-3 px-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${act.color}15` }}>
                    <act.icon size={20} style={{ color: act.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{log.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{dateStr} · {timeStr}</span>
                      {log.duration_min && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${act.color}15`, color: act.color }}>
                          {log.duration_min} דק׳
                        </span>
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{log.notes}</p>
                    )}
                  </div>
                  <button onClick={() => handleDelete(log.id)} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
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

function StatCard({ icon: Icon, label, value, unit }: { icon: LucideIcon; label: string; value: number; unit: string }) {
  return (
    <div className="card text-center py-4">
      <div className="flex justify-center mb-1">
        <Icon size={22} style={{ color: '#7F5268' }} />
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{unit} {label}</p>
    </div>
  )
}
