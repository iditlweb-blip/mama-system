'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, Trash2, Circle, CircleDot, CheckCircle2 } from 'lucide-react'
import { upsertAdminTask, deleteAdminTask } from './actions'

export interface AdminTask {
  id: string
  title: string
  notes: string | null
  status: string
  priority: string
  sort_order: number | null
  created_at: string
}

const STATUS_ORDER = ['todo', 'doing', 'done'] as const
const STATUS_LABEL: Record<string, string> = { todo: 'לביצוע', doing: 'בתהליך', done: 'הושלם' }
const PRIORITY_LABEL: Record<string, string> = { high: 'דחוף', medium: 'רגיל', low: 'נמוך' }
const PRIORITY_COLOR: Record<string, string> = { high: '#C0392B', medium: '#B8860B', low: '#5C7A8A' }

export default function AdminTasks({ initialTasks, onToast }: {
  initialTasks: AdminTask[]
  onToast: (msg: string, ok?: boolean) => void
}) {
  const [tasks, setTasks] = useState(initialTasks)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [isPending, startTransition] = useTransition()

  const inputSty: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }

  function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    startTransition(async () => {
      const res = await upsertAdminTask({ title: title.trim(), priority, status: 'todo' })
      if (res.ok) { setTitle(''); setPriority('medium'); onToast('משימה נוספה'); window.location.reload() }
      else onToast(res.error ?? 'שגיאה', false)
    })
  }

  function cycleStatus(t: AdminTask) {
    const idx = STATUS_ORDER.indexOf(t.status as typeof STATUS_ORDER[number])
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: next } : x))
    startTransition(async () => {
      const res = await upsertAdminTask({ id: t.id, title: t.title, notes: t.notes ?? undefined, priority: t.priority, status: next })
      if (!res.ok) onToast(res.error ?? 'שגיאה', false)
    })
  }

  function remove(t: AdminTask) {
    if (!confirm(`למחוק את "${t.title}"?`)) return
    startTransition(async () => {
      const res = await deleteAdminTask(t.id)
      if (res.ok) { setTasks(prev => prev.filter(x => x.id !== t.id)); onToast('נמחק') }
      else onToast(res.error ?? 'שגיאה', false)
    })
  }

  const statusIcon = (s: string) =>
    s === 'done' ? <CheckCircle2 className="w-4 h-4" style={{ color: '#4A7C59' }} />
    : s === 'doing' ? <CircleDot className="w-4 h-4" style={{ color: '#B8860B' }} />
    : <Circle className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />

  const sorted = [...tasks].sort((a, b) =>
    STATUS_ORDER.indexOf(a.status as typeof STATUS_ORDER[number]) - STATUS_ORDER.indexOf(b.status as typeof STATUS_ORDER[number]))

  const openCount = tasks.filter(t => t.status !== 'done').length

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>משימות לאפליקציה</h2>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268' }}>{openCount} פתוחות</span>
      </div>

      <form onSubmit={addTask} className="flex gap-2 mb-5 flex-wrap">
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="מה צריך לעשות באפליקציה?"
          className="flex-1 min-w-[180px] px-3 py-2.5 rounded-xl border text-sm outline-none" style={inputSty} />
        <select value={priority} onChange={e => setPriority(e.target.value)}
          className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={inputSty}>
          <option value="high">דחוף</option>
          <option value="medium">רגיל</option>
          <option value="low">נמוך</option>
        </select>
        <button type="submit" disabled={isPending}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
          style={{ background: '#7F5268' }}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}הוספה
        </button>
      </form>

      <div className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>אין משימות עדיין</p>
        ) : sorted.map(t => (
          <div key={t.id} className="flex items-center gap-3 px-3 py-3 rounded-xl border"
            style={{ borderColor: 'var(--border)', opacity: t.status === 'done' ? 0.55 : 1 }}>
            <button onClick={() => cycleStatus(t)} title="שינוי סטטוס" className="shrink-0">
              {statusIcon(t.status)}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate"
                style={{ color: 'var(--text)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                {t.title}
              </p>
              <span className="text-xs">{STATUS_LABEL[t.status]}</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
              style={{ background: `${PRIORITY_COLOR[t.priority]}18`, color: PRIORITY_COLOR[t.priority] }}>
              {PRIORITY_LABEL[t.priority]}
            </span>
            <button onClick={() => remove(t)} className="p-1.5 rounded-lg shrink-0"
              style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
