'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, Trash2, Circle, CircleDot, CheckCircle2, Edit2, X } from 'lucide-react'
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

const emptyForm = { id: '', title: '', priority: 'medium', notes: '' }

export default function AdminTasks({ initialTasks, onToast }: {
  initialTasks: AdminTask[]
  onToast: (msg: string, ok?: boolean) => void
}) {
  const [tasks, setTasks] = useState(initialTasks)
  const [form, setForm] = useState(emptyForm)
  const [isPending, startTransition] = useTransition()

  const inputSty: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }
  const editing = !!form.id

  function resetForm() { setForm(emptyForm) }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    const id = form.id || (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)
    const existing = form.id ? tasks.find(t => t.id === form.id) : undefined
    const task: AdminTask = {
      id,
      title: form.title.trim(),
      notes: form.notes.trim() || null,
      status: existing?.status ?? 'todo',
      priority: form.priority,
      sort_order: existing?.sort_order ?? null,
      created_at: existing?.created_at ?? new Date().toISOString(),
    }
    // Optimistic update - no page reload.
    setTasks(prev => form.id ? prev.map(t => t.id === id ? task : t) : [task, ...prev])
    resetForm()
    startTransition(async () => {
      const res = await upsertAdminTask({
        id, title: task.title, notes: task.notes ?? undefined,
        priority: task.priority, status: task.status,
      })
      if (res.ok) onToast(existing ? 'משימה עודכנה' : 'משימה נוספה')
      else onToast(res.error ?? 'שגיאה', false)
    })
  }

  function editTask(t: AdminTask) {
    setForm({ id: t.id, title: t.title, priority: t.priority, notes: t.notes ?? '' })
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

      <form onSubmit={save} className="mb-5 space-y-2">
        {editing && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold" style={{ color: '#7F5268' }}>עריכת משימה</span>
            <button type="button" onClick={resetForm}
              className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <X className="w-3 h-3" />ביטול עריכה
            </button>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="מה צריך לעשות באפליקציה?"
            className="flex-1 min-w-[180px] px-3 py-2.5 rounded-xl border text-sm outline-none" style={inputSty} />
          <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            className="px-3 py-2.5 rounded-xl border text-sm outline-none" style={inputSty}>
            <option value="high">דחוף</option>
            <option value="medium">רגיל</option>
            <option value="low">נמוך</option>
          </select>
          <button type="submit" disabled={isPending}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
            style={{ background: '#7F5268' }}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}{editing ? 'עדכון' : 'הוספה'}
          </button>
        </div>
        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="פרטים / הערות (אופציונלי)"
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none" style={inputSty} />
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{STATUS_LABEL[t.status]}</span>
                {t.notes && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {t.notes}</span>}
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
              style={{ background: `${PRIORITY_COLOR[t.priority]}18`, color: PRIORITY_COLOR[t.priority] }}>
              {PRIORITY_LABEL[t.priority]}
            </span>
            <button onClick={() => editTask(t)} className="p-1.5 rounded-lg shrink-0"
              style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268' }}>
              <Edit2 className="w-3.5 h-3.5" />
            </button>
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
