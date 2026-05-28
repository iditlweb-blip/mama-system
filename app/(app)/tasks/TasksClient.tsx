'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Play, Pause, RotateCcw, Timer, ChevronDown, Baby, Home, Briefcase, CheckCircle2, AlertCircle, Circle } from 'lucide-react'
import { Task, TaskCategory, TaskStatus, TaskPriority } from '@/types/database'

interface Props { tasks: Task[]; userId: string }

const columns: { status: TaskStatus; label: string; color: string; emoji: string }[] = [
  { status: 'todo',       label: 'לביצוע',  color: '#7F5268', emoji: '📋' },
  { status: 'inprogress', label: 'בתהליך',  color: '#B8860B', emoji: '⚡' },
  { status: 'done',       label: 'הושלם',   color: '#4A7C59', emoji: '✅' },
]

const catConfig: Record<TaskCategory, { label: string; icon: React.ElementType; cls: string; emoji: string }> = {
  work: { label: 'עבודה',  icon: Briefcase, cls: 'cat-work', emoji: '💼' },
  home: { label: 'בית',    icon: Home,      cls: 'cat-home', emoji: '🏠' },
  baby: { label: 'תינוק',  icon: Baby,      cls: 'cat-baby', emoji: '👶' },
}
const prioConfig: Record<TaskPriority, { label: string; color: string }> = {
  high:   { label: 'דחוף',   color: '#C0392B' },
  medium: { label: 'בינוני', color: '#B8860B' },
  low:    { label: 'נמוך',   color: '#4A7C59' },
}

export default function TasksClient({ tasks: initialTasks, userId }: Props) {
  const [tasks, setTasks]       = useState(initialTasks)
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState<TaskCategory | 'all'>('all')
  const [newTitle, setNewTitle] = useState('')
  const [newCat,   setNewCat]   = useState<TaskCategory>('work')
  const [newPrio,  setNewPrio]  = useState<TaskPriority>('medium')
  const [newDue,   setNewDue]   = useState('')
  const [saving,   setSaving]   = useState(false)

  // Pomodoro
  const [pomoDuration, setPomoDuration] = useState(25 * 60)
  const [pomoRunning,  setPomoRunning]  = useState(false)
  const [pomoTime,     setPomoTime]     = useState(25 * 60)
  const [pomoMode,     setPomoMode]     = useState<'work' | 'break'>('work')
  const [pomoCount,    setPomoCount]    = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (pomoRunning) {
      intervalRef.current = setInterval(() => {
        setPomoTime(t => {
          if (t <= 1) {
            setPomoRunning(false)
            if (pomoMode === 'work') {
              setPomoCount(c => c + 1)
              setPomoMode('break')
              return 5 * 60
            } else {
              setPomoMode('work')
              return pomoDuration
            }
          }
          return t - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [pomoRunning, pomoMode, pomoDuration])

  function resetPomo() {
    setPomoRunning(false)
    setPomoMode('work')
    setPomoTime(pomoDuration)
  }

  function formatPomo(s: number) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  const pomoPercent = (1 - pomoTime / (pomoMode === 'work' ? pomoDuration : 5 * 60)) * 100
  const r = 45
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - pomoPercent / 100)

  async function addTask() {
    if (!newTitle.trim()) return
    setSaving(true)
    const { data } = await supabase.from('tasks').insert({
      user_id: userId, title: newTitle.trim(), category: newCat, priority: newPrio,
      due_date: newDue || null, status: 'todo'
    }).select().single()
    if (data) setTasks([data, ...tasks])
    setNewTitle(''); setNewDue(''); setShowForm(false); setSaving(false)
  }

  async function moveTask(id: string, status: TaskStatus) {
    await supabase.from('tasks').update({ status }).eq('id', id)
    setTasks(tasks.map(t => t.id === id ? { ...t, status } : t))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  const today = new Date().toISOString().split('T')[0]
  const filtered = filterCat === 'all' ? tasks : tasks.filter(t => t.category === filterCat)

  // Stats
  const openCount    = tasks.filter(t => t.status !== 'done').length
  const doneCount    = tasks.filter(t => t.status === 'done').length
  const highCount    = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length
  const dueTodayCount = tasks.filter(t => t.due_date === today && t.status !== 'done').length
  const overdueCount = tasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done').length

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>ניהול משימות</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {openCount} משימות פתוחות · {doneCount} הושלמו
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="btn-brand text-sm px-4 py-2"
        >
          <Plus className="w-4 h-4" />
          משימה חדשה
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill emoji="📋" label="פתוחות" value={openCount}    color="#7F5268" />
        <StatPill emoji="✅" label="הושלמו" value={doneCount}    color="#4A7C59" />
        <StatPill emoji="🔴" label="דחוף"   value={highCount}    color="#C0392B" />
        <StatPill emoji="📅" label="היום"   value={dueTodayCount} color="#B8860B"
          extra={overdueCount > 0 ? `${overdueCount} באיחור` : undefined} />
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#C0392B' }} />
          <p className="text-sm" style={{ color: '#C0392B' }}>
            יש לך <strong>{overdueCount}</strong> משימות שפג תוקפן — כדאי לטפל בהן היום
          </p>
        </div>
      )}

      {/* Pomodoro */}
      <div className="card"
        style={{ background: pomoMode === 'work'
          ? 'linear-gradient(135deg, rgba(127,82,104,0.06), rgba(127,82,104,0.02))'
          : 'linear-gradient(135deg, rgba(74,124,89,0.06), rgba(74,124,89,0.02))' }}>
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle cx="50" cy="50" r={r} fill="none"
                stroke={pomoMode === 'work' ? '#7F5268' : '#4A7C59'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>{formatPomo(pomoTime)}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{pomoMode === 'work' ? 'עבודה' : 'הפסקה'}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span className="font-semibold" style={{ color: 'var(--text)' }}>טיימר פומודורו</span>
              {pomoCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'rgba(127,82,104,0.12)', color: '#7F5268' }}>
                  🍅 {pomoCount} סשנים
                </span>
              )}
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
              {pomoMode === 'work' ? 'מיקוד מלא — הניחי את הטלפון' : '☕ הפסקה! קחי נשימה'}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setPomoRunning(!pomoRunning)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: pomoMode === 'work' ? '#7F5268' : '#4A7C59' }}
              >
                {pomoRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {pomoRunning ? 'עצרי' : 'התחילי'}
              </button>
              <button onClick={resetPomo}
                className="p-2 rounded-xl border hover:opacity-70 transition-opacity"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <RotateCcw className="w-4 h-4" />
              </button>
              <select value={pomoDuration}
                onChange={e => { setPomoDuration(+e.target.value); setPomoTime(+e.target.value); setPomoRunning(false) }}
                className="text-sm px-3 py-2 rounded-xl border outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value={10 * 60}>10 דקות</option>
                <option value={15 * 60}>15 דקות</option>
                <option value={25 * 60}>25 דקות</option>
                <option value={45 * 60}>45 דקות</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'work', 'home', 'baby'] as const).map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={filterCat === cat
              ? { background: 'var(--primary)', color: 'white' }
              : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
            }
          >
            {cat === 'all' ? `הכל (${tasks.length})` : `${catConfig[cat].emoji} ${catConfig[cat].label} (${tasks.filter(t => t.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(({ status, label, color, emoji }) => {
          const colTasks = filtered.filter(t => t.status === status)
          return (
            <div key={status} className="card" style={{ minHeight: 200 }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span>{emoji}</span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{label}</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                  style={{ background: `${color}20`, color }}>
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} today={today} onMove={moveTask} onDelete={deleteTask} />
                ))}
                {colTasks.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-2xl mb-1">{status === 'done' ? '🎯' : status === 'inprogress' ? '⏳' : '🌱'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {status === 'done' ? 'עדיין לא הושלם כלום' : status === 'inprogress' ? 'אין משימות בתהליך' : 'לחצי + להוסיף'}
                    </p>
                  </div>
                )}
              </div>
              {status === 'todo' && (
                <button onClick={() => { setNewCat(filterCat === 'all' ? 'work' : filterCat); setShowForm(true) }}
                  className="mt-3 w-full py-2 rounded-xl text-sm flex items-center justify-center gap-1 transition-opacity hover:opacity-70"
                  style={{ color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
                  <Plus className="w-3.5 h-3.5" />
                  הוסיפי משימה
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Task Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40">
          <div className="card w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold" style={{ color: 'var(--text)' }}>משימה חדשה ✨</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="מה צריך לעשות?" autoFocus
              className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              onKeyDown={e => e.key === 'Enter' && addTask()}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>קטגוריה</label>
                <select value={newCat} onChange={e => setNewCat(e.target.value as TaskCategory)}
                  className="w-full px-3 py-2 rounded-xl border outline-none text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  <option value="work">💼 עבודה</option>
                  <option value="home">🏠 בית</option>
                  <option value="baby">👶 תינוק</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>עדיפות</label>
                <select value={newPrio} onChange={e => setNewPrio(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 rounded-xl border outline-none text-sm"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  <option value="high">🔴 דחוף</option>
                  <option value="medium">🟡 בינוני</option>
                  <option value="low">🟢 נמוך</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>תאריך יעד (אופציונלי)</label>
              <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border outline-none text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            <button onClick={addTask} disabled={saving || !newTitle.trim()}
              className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-60 transition-opacity"
              style={{ background: '#7F5268' }}
            >
              {saving ? 'שומרת...' : '+ הוסיפי משימה'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, today, onMove, onDelete }: {
  task: Task; today: string
  onMove: (id: string, s: TaskStatus) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const { cls, label, emoji } = catConfig[task.category]
  const { color } = prioConfig[task.priority]

  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done'
  const isDueToday = task.due_date === today && task.status !== 'done'

  const nextStatus: Record<TaskStatus, TaskStatus> = { todo: 'inprogress', inprogress: 'done', done: 'todo' }
  const nextLabel: Record<TaskStatus, string> = {
    todo: '⚡ העבירי לבתהליך',
    inprogress: '✅ סמני כהושלם',
    done: '↩ החזירי לרשימה'
  }

  return (
    <div className="p-3 rounded-xl group transition-all"
      style={{
        background: isOverdue ? 'rgba(192,57,43,0.04)' : 'var(--bg)',
        border: `1px solid ${isOverdue ? 'rgba(192,57,43,0.25)' : 'var(--border)'}`,
      }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Quick complete */}
          <button
            onClick={() => task.status === 'done' ? onMove(task.id, 'todo') : onMove(task.id, 'done')}
            className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
          >
            {task.status === 'done'
              ? <CheckCircle2 className="w-4 h-4" style={{ color: '#4A7C59' }} />
              : <Circle className="w-4 h-4" style={{ color: 'var(--border)' }} />
            }
          </button>
          <p className="text-sm font-medium leading-snug"
            style={{ color: 'var(--text)', textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.6 : 1 }}>
            {task.title}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setOpen(!open)} className="p-1 rounded-lg hover:opacity-70">
            <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : '' }} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 rounded-lg hover:opacity-70">
            <X className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{emoji} {label}</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
          {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
        </span>
        {task.due_date && (
          <span className="text-xs font-medium"
            style={{ color: isOverdue ? '#C0392B' : isDueToday ? '#B8860B' : 'var(--text-muted)' }}>
            {isOverdue ? '⚠️ ' : isDueToday ? '📅 ' : ''}
            {new Date(task.due_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {open && (
        <button onClick={() => onMove(task.id, nextStatus[task.status])}
          className="mt-2 text-xs font-medium py-1.5 px-3 rounded-lg w-full text-center transition-opacity hover:opacity-80"
          style={{ background: 'rgba(127,82,104,0.08)', color: 'var(--primary)' }}
        >
          {nextLabel[task.status]}
        </button>
      )}
    </div>
  )
}

function StatPill({ emoji, label, value, color, extra }: {
  emoji: string; label: string; value: number; color: string; extra?: string
}) {
  return (
    <div className="card py-3 text-center">
      <p className="text-xl mb-0.5">{emoji}</p>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      {extra && <p className="text-xs mt-0.5 font-medium" style={{ color: '#C0392B' }}>{extra}</p>}
    </div>
  )
}
