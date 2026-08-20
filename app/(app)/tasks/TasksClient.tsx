'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Plus, X, Home, Baby, CheckCircle2, Circle, Calendar, Bell, Pencil,
  Trash2, Paperclip, ChevronRight, Sparkles, AlertTriangle, ClipboardList,
  Loader2, FileText,
} from 'lucide-react'
import { Task, TaskCategory, TaskPriority } from '@/types/database'
import { useRouter } from 'next/navigation'

interface Props { tasks: Task[]; userId: string; trackingType: 'pregnancy' | 'baby' | null }

// "work" was removed - tasks are either home or baby/pregnancy (per settings).
type Cat = 'home' | 'baby'

const prioConfig: Record<TaskPriority, { label: string; color: string }> = {
  high:   { label: 'דחוף',   color: '#C0392B' },
  medium: { label: 'בינוני', color: '#B8860B' },
  low:    { label: 'נמוך',   color: '#4A7C59' },
}

export default function TasksClient({ tasks: initialTasks, userId, trackingType }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [tasks, setTasks] = useState(initialTasks)
  const [showForm, setShowForm] = useState(false)
  const [filterCat, setFilterCat] = useState<Cat | 'all'>('all')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  // New-task form
  const [nTitle, setNTitle] = useState('')
  const [nCat, setNCat] = useState<Cat>('baby')
  const [nPrio, setNPrio] = useState<TaskPriority>('medium')
  const [nDue, setNDue] = useState('')
  const [nRemind, setNRemind] = useState('')
  const [nNotes, setNNotes] = useState('')

  const babyLabel = trackingType === 'pregnancy' ? 'הריון' : 'תינוק'
  const catLabel = (c: string) => (c === 'home' ? 'בית' : babyLabel)
  const CatIcon = (c: string) => (c === 'home' ? Home : Baby)
  const inputSty: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }

  const today = new Date().toISOString().split('T')[0]
  const isDone = (t: Task) => t.status === 'done'
  const filtered = tasks.filter(t => filterCat === 'all' ? true : t.category === filterCat)
  // Open tasks first (by created desc), done at the bottom.
  const sorted = [...filtered].sort((a, b) => (isDone(a) === isDone(b) ? 0 : isDone(a) ? 1 : -1))
  const openCount = tasks.filter(t => !isDone(t)).length
  const doneCount = tasks.filter(t => isDone(t)).length

  async function addTask() {
    if (!nTitle.trim()) return
    setSaving(true)
    const row: Record<string, unknown> = {
      user_id: userId, title: nTitle.trim(), category: nCat, priority: nPrio,
      due_date: nDue || null, status: 'todo',
    }
    if (nRemind) { row.remind_at = new Date(nRemind).toISOString(); row.reminded = false }
    if (nNotes.trim()) row.notes = nNotes.trim()
    const { data, error } = await supabase.from('tasks').insert(row).select().single()
    setSaving(false)
    if (error || !data) { alert(`שמירת המשימה נכשלה: ${error?.message ?? 'שגיאה'}`); return }
    setTasks(prev => [data as Task, ...prev])
    setNTitle(''); setNDue(''); setNRemind(''); setNNotes(''); setNPrio('medium'); setShowForm(false)
  }

  async function toggleDone(t: Task) {
    const next = isDone(t) ? 'todo' : 'done'
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: next } : x))
    await supabase.from('tasks').update({ status: next }).eq('id', t.id)
  }

  async function deleteTask(id: string) {
    if (!confirm('למחוק את המשימה?')) return
    setTasks(prev => prev.filter(x => x.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  async function saveEdit(id: string, patch: Partial<Task>) {
    setTasks(prev => prev.map(x => x.id === id ? { ...x, ...patch } as Task : x))
    const { error } = await supabase.from('tasks').update(patch).eq('id', id)
    if (error) alert(`עדכון נכשל: ${error.message}`)
    else setEditingId(null)
  }

  async function uploadFile(id: string, file: File) {
    setUploadingId(id)
    const ext = (file.name.split('.').pop() || 'dat').toLowerCase()
    const path = `${userId}/tasks/${id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('task-files').upload(path, file, { upsert: true, contentType: file.type || undefined })
    if (error) {
      alert(/bucket|not found|exist/i.test(error.message) ? 'האחסון עדיין לא הוגדר - יש להריץ מיגרציה 020 ב-Supabase' : `שגיאה בהעלאה: ${error.message}`)
      setUploadingId(null); return
    }
    const { data: url } = supabase.storage.from('task-files').getPublicUrl(path)
    setTasks(prev => prev.map(x => x.id === id ? { ...x, file_url: url.publicUrl } : x))
    await supabase.from('tasks').update({ file_url: url.publicUrl }).eq('id', id)
    setUploadingId(null)
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex justify-end">
        <button onClick={() => router.back()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs"
          style={{ color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <ChevronRight className="w-3.5 h-3.5" /> חזרה
        </button>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>ניהול משימות</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{openCount} פתוחות · {doneCount} הושלמו</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-brand text-sm px-4 py-2">
          <Plus className="w-4 h-4" /> משימה חדשה
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'home', 'baby'] as const).map(cat => (
          <button key={cat} onClick={() => setFilterCat(cat)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5"
            style={filterCat === cat
              ? { background: 'var(--primary)', color: 'white' }
              : { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {cat === 'all' ? `הכל (${tasks.length})` : `${catLabel(cat)} (${tasks.filter(t => t.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="card text-center py-10">
            <ClipboardList className="w-7 h-7 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>אין משימות עדיין - לחצי "משימה חדשה"</p>
          </div>
        ) : sorted.map(task => (
          <TaskRow
            key={task.id} task={task} today={today}
            catLabel={catLabel} CatIcon={CatIcon} babyLabel={babyLabel}
            editing={editingId === task.id} uploading={uploadingId === task.id}
            onToggle={() => toggleDone(task)}
            onDelete={() => deleteTask(task.id)}
            onEdit={() => setEditingId(task.id)}
            onCancelEdit={() => setEditingId(null)}
            onSave={patch => saveEdit(task.id, patch)}
            onUpload={file => uploadFile(task.id, file)}
          />
        ))}
      </div>

      {/* Add modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 pb-[calc(64px+env(safe-area-inset-bottom)+1rem)] md:pb-4 bg-black/40" onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-sm space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text)' }}>משימה חדשה <Sparkles className="w-4 h-4" style={{ color: '#7F5268' }} /></h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <input value={nTitle} onChange={e => setNTitle(e.target.value)} placeholder="מה צריך לעשות?" autoFocus
              onKeyDown={e => e.key === 'Enter' && addTask()}
              className="w-full px-3 py-2.5 rounded-xl border outline-none text-sm" style={inputSty} />
            <div className="grid grid-cols-2 gap-2">
              <select value={nCat} onChange={e => setNCat(e.target.value as Cat)} className="px-3 py-2 rounded-xl border outline-none text-sm" style={inputSty}>
                <option value="baby">{babyLabel}</option>
                <option value="home">בית</option>
              </select>
              <select value={nPrio} onChange={e => setNPrio(e.target.value as TaskPriority)} className="px-3 py-2 rounded-xl border outline-none text-sm" style={inputSty}>
                <option value="high">דחוף</option>
                <option value="medium">בינוני</option>
                <option value="low">נמוך</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>תאריך יעד (אופציונלי)</label>
              <input type="date" value={nDue} onChange={e => setNDue(e.target.value)} className="w-full px-3 py-2 rounded-xl border outline-none text-sm" style={inputSty} />
            </div>
            <div>
              <label className="text-xs font-medium flex items-center gap-1 mb-1" style={{ color: 'var(--text-muted)' }}><Bell className="w-3 h-3" /> תזכורת (אופציונלי)</label>
              <input type="datetime-local" value={nRemind} onChange={e => setNRemind(e.target.value)} className="w-full px-3 py-2 rounded-xl border outline-none text-sm" style={inputSty} />
            </div>
            <textarea value={nNotes} onChange={e => setNNotes(e.target.value)} placeholder="הערות (אופציונלי)" rows={2}
              className="w-full px-3 py-2 rounded-xl border outline-none text-sm resize-none" style={inputSty} />
            <button onClick={addTask} disabled={saving || !nTitle.trim()}
              className="w-full py-3 rounded-xl font-semibold text-white disabled:opacity-60" style={{ background: '#7F5268' }}>
              {saving ? 'שומרת...' : '+ הוסיפי משימה'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, today, catLabel, CatIcon, editing, uploading, onToggle, onDelete, onEdit, onCancelEdit, onSave, onUpload }: {
  task: Task; today: string
  catLabel: (c: string) => string; CatIcon: (c: string) => React.ElementType; babyLabel: string
  editing: boolean; uploading: boolean
  onToggle: () => void; onDelete: () => void; onEdit: () => void; onCancelEdit: () => void
  onSave: (patch: Partial<Task>) => void; onUpload: (file: File) => void
}) {
  const done = task.status === 'done'
  const { color } = prioConfig[task.priority]
  const Icon = CatIcon(task.category)
  const isOverdue = task.due_date && task.due_date < today && !done

  const [title, setTitle] = useState(task.title)
  const [notes, setNotes] = useState(task.notes ?? '')
  const [prio, setPrio] = useState<TaskPriority>(task.priority)
  const [cat, setCat] = useState<TaskCategory>(task.category)
  const [due, setDue] = useState(task.due_date ?? '')
  const [remind, setRemind] = useState(task.remind_at ? task.remind_at.slice(0, 16) : '')
  const inputSty: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }

  return (
    <div className="card p-3" style={{ background: isOverdue ? 'rgba(192,57,43,0.04)' : undefined, opacity: done ? 0.7 : 1 }}>
      <div className="flex items-start gap-3">
        <button onClick={onToggle} className="mt-0.5 flex-shrink-0 hover:scale-110 transition-transform" title="סימון כבוצע">
          {done ? <CheckCircle2 className="w-5 h-5" style={{ color: '#4A7C59' }} /> : <Circle className="w-5 h-5" style={{ color: 'var(--border)' }} />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug" style={{ color: 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{task.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268' }}>
              <Icon className="w-3 h-3" /> {catLabel(task.category)}
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color }}><Circle className="w-2.5 h-2.5" fill={color} stroke="none" /> {prioConfig[task.priority].label}</span>
            {task.due_date && (
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: isOverdue ? '#C0392B' : 'var(--text-muted)' }}>
                {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                {new Date(task.due_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {task.remind_at && (
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: '#7F5268' }}>
                <Bell className="w-3 h-3" /> {new Date(task.remind_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} {new Date(task.remind_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {task.file_url && (
              <a href={task.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium flex items-center gap-1" style={{ color: '#5C6BA0' }}>
                <FileText className="w-3 h-3" /> קובץ מצורף
              </a>
            )}
          </div>
          {task.notes && !editing && <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{task.notes}</p>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={editing ? onCancelEdit : onEdit} className="p-1.5 rounded-lg" style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268' }} title="עריכה">
            {editing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg" style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }} title="מחיקה">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl border outline-none text-sm" style={inputSty} />
          <div className="grid grid-cols-2 gap-2">
            <select value={cat} onChange={e => setCat(e.target.value as TaskCategory)} className="px-3 py-2 rounded-xl border outline-none text-sm" style={inputSty}>
              <option value="baby">{catLabel('baby')}</option>
              <option value="home">בית</option>
            </select>
            <select value={prio} onChange={e => setPrio(e.target.value as TaskPriority)} className="px-3 py-2 rounded-xl border outline-none text-sm" style={inputSty}>
              <option value="high">דחוף</option>
              <option value="medium">בינוני</option>
              <option value="low">נמוך</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs flex flex-col gap-1" style={{ color: 'var(--text-muted)' }}>תאריך יעד
              <input type="date" value={due} onChange={e => setDue(e.target.value)} className="px-2 py-1.5 rounded-lg border outline-none text-sm" style={inputSty} /></label>
            <label className="text-xs flex flex-col gap-1" style={{ color: 'var(--text-muted)' }}>תזכורת
              <input type="datetime-local" value={remind} onChange={e => setRemind(e.target.value)} className="px-2 py-1.5 rounded-lg border outline-none text-sm" style={inputSty} /></label>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="הערות" rows={2} className="w-full px-3 py-2 rounded-xl border outline-none text-sm resize-none" style={inputSty} />
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer" style={{ background: 'rgba(92,107,160,0.1)', color: '#5C6BA0' }}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
              {task.file_url ? 'החלפת קובץ' : 'צירוף קובץ'}
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }} />
            </label>
            <button
              onClick={() => onSave({
                title: title.trim() || task.title, notes: notes.trim() || null, priority: prio, category: cat,
                due_date: due || null, remind_at: remind ? new Date(remind).toISOString() : null, reminded: false,
              })}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#4A7C59' }}>
              שמירה
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
