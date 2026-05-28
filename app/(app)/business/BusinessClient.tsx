'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Briefcase, CheckSquare, Calendar, Link2, Plus, Trash2, Check,
  Globe, ExternalLink, Clock,
  ChevronDown, Loader2, X
} from 'lucide-react'
import { Profile, Task, WeeklyScheduleItem } from '@/types/database'

interface Props {
  profile: Profile | null
  tasks: Task[]
  schedule: WeeklyScheduleItem[]
  userId: string
}

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const DAYS_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

const scheduleTypeColors = {
  work: { bg: '#7F526820', border: '#7F526840', text: '#7F5268', label: '💼 עבודה' },
  baby: { bg: '#C4A0B420', border: '#C4A0B440', text: '#7F5268', label: '👶 תינוק' },
  personal: { bg: '#4A7C5920', border: '#4A7C5940', text: '#4A7C59', label: '🌸 אישי' },
  break: { bg: '#5C7A6A20', border: '#5C7A6A40', text: '#5C7A6A', label: '☕ הפסקה' },
}

const priorityColors = { high: '#C0392B', medium: '#B8860B', low: '#4A7C59' }

export default function BusinessClient({ profile, tasks: initialTasks, schedule: initialSchedule, userId }: Props) {
  const supabase = createClient()
  const [tasks, setTasks] = useState(initialTasks)
  const [schedule, setSchedule] = useState(initialSchedule)
  const [activeTab, setActiveTab] = useState<'tasks' | 'schedule' | 'links'>('tasks')

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskSaving, setTaskSaving] = useState(false)

  // Schedule form
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [schedDay, setSchedDay] = useState(0)
  const [schedStart, setSchedStart] = useState('09:00')
  const [schedEnd, setSchedEnd] = useState('10:00')
  const [schedTitle, setSchedTitle] = useState('')
  const [schedType, setSchedType] = useState<'work' | 'baby' | 'personal' | 'break'>('work')
  const [schedSaving, setSchedSaving] = useState(false)

  async function addTask() {
    if (!taskTitle.trim()) return
    setTaskSaving(true)
    const { data } = await supabase.from('tasks').insert({
      user_id: userId,
      title: taskTitle,
      category: 'work',
      status: 'todo',
      priority: taskPriority,
      due_date: taskDueDate || null,
    }).select().single()
    if (data) setTasks(prev => [data, ...prev])
    setTaskTitle('')
    setTaskPriority('medium')
    setTaskDueDate('')
    setShowTaskForm(false)
    setTaskSaving(false)
  }

  async function toggleTask(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'done' ? 'todo' : 'done'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t))
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function addScheduleItem() {
    if (!schedTitle.trim()) return
    setSchedSaving(true)
    const { data } = await supabase.from('weekly_schedule').insert({
      user_id: userId,
      day_of_week: schedDay,
      start_time: schedStart,
      end_time: schedEnd,
      title: schedTitle,
      type: schedType,
    }).select().single()
    if (data) setSchedule(prev => [...prev, data].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)))
    setSchedTitle('')
    setSchedStart('09:00')
    setSchedEnd('10:00')
    setShowScheduleForm(false)
    setSchedSaving(false)
  }

  async function deleteScheduleItem(id: string) {
    await supabase.from('weekly_schedule').delete().eq('id', id)
    setSchedule(prev => prev.filter(s => s.id !== id))
  }

  const links = [
    { label: '🌐 אתר אינטרנט', url: profile?.website_url, icon: Globe },
    { label: '📸 אינסטגרם', url: profile?.instagram_url, icon: Link2 },
    { label: '👥 פייסבוק', url: profile?.facebook_url, icon: Link2 },
    { label: '💼 לינקדאין', url: profile?.linkedin_url, icon: Briefcase },
    { label: '📅 Google Calendar', url: profile?.google_calendar_url, icon: Calendar },
  ].filter(l => l.url)

  const doneTasks = tasks.filter(t => t.status === 'done')
  const openTasks = tasks.filter(t => t.status !== 'done')

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="card" style={{ background: 'rgba(127,82,104,0.06)', borderColor: 'rgba(127,82,104,0.14)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              {profile?.business_name || 'ניהול עבודה'} 💼
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {profile?.business_type ? businessTypeLabel(profile.business_type) : 'לוז, משימות וקישורים מהירים'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>משימות פתוחות</p>
            <p className="text-2xl font-bold" style={{ color: '#4A7C59' }}>{openTasks.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)' }}>
        {([
          { id: 'tasks', label: 'משימות', icon: CheckSquare },
          { id: 'schedule', label: 'לוז שבועי', icon: Calendar },
          { id: 'links', label: 'קישורים מהירים', icon: Link2 },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all"
            style={activeTab === id
              ? { background: '#7F5268', color: 'white' }
              : { color: 'var(--text-muted)' }
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {/* Add task */}
          {!showTaskForm ? (
            <button
              onClick={() => setShowTaskForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <Plus className="w-4 h-4" />
              הוספת משימה עסקית
            </button>
          ) : (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>משימה חדשה</h3>
                <button onClick={() => setShowTaskForm(false)} style={{ color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="שם המשימה..."
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                autoFocus
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>עדיפות</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    <option value="high">🔴 דחוף</option>
                    <option value="medium">🟡 בינוני</option>
                    <option value="low">🟢 נמוך</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>תאריך יעד</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={e => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
              </div>
              <button
                onClick={addTask}
                disabled={taskSaving || !taskTitle.trim()}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: '#7F5268' }}
              >
                {taskSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                הוספה
              </button>
            </div>
          )}

          {/* Open tasks */}
          {openTasks.length === 0 && !showTaskForm ? (
            <div className="card text-center py-8">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>כל המשימות הושלמו!</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>את מדהימה 💪</p>
            </div>
          ) : (
            <div className="space-y-2">
              {openTasks.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
              ))}
            </div>
          )}

          {/* Done tasks */}
          {doneTasks.length > 0 && (
            <details className="card">
              <summary className="cursor-pointer text-sm font-medium list-none flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                <span>✅ הושלמו ({doneTasks.length})</span>
                <ChevronDown className="w-4 h-4" />
              </summary>
              <div className="mt-3 space-y-2">
                {doneTasks.map(task => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {!showScheduleForm ? (
            <button
              onClick={() => setShowScheduleForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <Plus className="w-4 h-4" />
              הוספת אירוע ללוז
            </button>
          ) : (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>אירוע חדש</h3>
                <button onClick={() => setShowScheduleForm(false)} style={{ color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                value={schedTitle}
                onChange={e => setSchedTitle(e.target.value)}
                placeholder="שם האירוע..."
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>יום</label>
                  <select
                    value={schedDay}
                    onChange={e => setSchedDay(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>סוג</label>
                  <select
                    value={schedType}
                    onChange={e => setSchedType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  >
                    {Object.entries(scheduleTypeColors).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>שעת התחלה</label>
                  <input
                    type="time"
                    value={schedStart}
                    onChange={e => setSchedStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>שעת סיום</label>
                  <input
                    type="time"
                    value={schedEnd}
                    onChange={e => setSchedEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
              </div>
              <button
                onClick={addScheduleItem}
                disabled={schedSaving || !schedTitle.trim()}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: '#7F5268' }}
              >
                {schedSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                הוספה
              </button>
            </div>
          )}

          {schedule.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-2">📅</p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>הלוז ריק</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>הוסיפי זמנים קבועים לעבודה, נמנומים, וזמן אישי</p>
            </div>
          ) : (
            <div className="space-y-3">
              {DAYS.map((day, dayIndex) => {
                const dayItems = schedule.filter(s => s.day_of_week === dayIndex)
                if (dayItems.length === 0) return null
                return (
                  <div key={dayIndex} className="card">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(127,82,104,0.1)', color: 'var(--primary)' }}>
                        {DAYS_SHORT[dayIndex]}
                      </span>
                      יום {day}
                    </h3>
                    <div className="space-y-2">
                      {dayItems.map(item => {
                        const colors = scheduleTypeColors[item.type]
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl"
                            style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.text }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{item.title}</p>
                              <p className="text-xs" style={{ color: colors.text }}>
                                {item.start_time.slice(0, 5)} – {item.end_time.slice(0, 5)}
                              </p>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${colors.text}20`, color: colors.text }}>
                              {colors.label.split(' ')[1]}
                            </span>
                            <button onClick={() => deleteScheduleItem(item.id)} className="opacity-40 hover:opacity-100 transition-opacity">
                              <Trash2 className="w-3.5 h-3.5" style={{ color: '#C0392B' }} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* LINKS TAB */}
      {activeTab === 'links' && (
        <div className="space-y-3">
          {links.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-2">🔗</p>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>אין קישורים</p>
              <p className="text-sm mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>הוסיפי קישורים בעמוד ההגדרות</p>
              <a href="/settings"
                className="inline-block px-4 py-2 rounded-xl text-white text-sm font-medium"
                style={{ background: '#7F5268' }}>
                לעמוד הגדרות
              </a>
            </div>
          ) : (
            <>
              <p className="text-xs px-1" style={{ color: 'var(--text-muted)' }}>
                לפתיחה בלשונית חדשה — לחצי על הקישור
              </p>
              <div className="grid gap-3">
                {links.map(({ label, url, icon: Icon }) => (
                  <a
                    key={label}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card flex items-center gap-4 hover:opacity-90 transition-opacity group"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(127,82,104,0.1)' }}>
                      <Icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{label}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{url}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--primary)' }} />
                  </a>
                ))}
              </div>
              <a href="/settings"
                className="block text-center text-sm font-medium mt-2"
                style={{ color: 'var(--primary)' }}>
                + עריכת קישורים בהגדרות
              </a>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete }: {
  task: Task
  onToggle: (id: string, status: string) => void
  onDelete: (id: string) => void
}) {
  const done = task.status === 'done'
  const overdue = task.due_date && !done && new Date(task.due_date) < new Date()

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{ background: 'var(--surface)', opacity: done ? 0.6 : 1 }}>
      <button
        onClick={() => onToggle(task.id, task.status)}
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
        style={done
          ? { background: '#4A7C59', borderColor: '#4A7C59' }
          : { borderColor: priorityColors[task.priority] }
        }
      >
        {done && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>
          {task.title}
        </p>
        {task.due_date && (
          <p className="text-xs mt-0.5" style={{ color: overdue ? '#C0392B' : 'var(--text-muted)' }}>
            {overdue ? '⚠️ ' : '📅 '}
            {new Date(task.due_date).toLocaleDateString('he-IL')}
          </p>
        )}
      </div>
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: priorityColors[task.priority] }} />
      <button onClick={() => onDelete(task.id)} className="opacity-30 hover:opacity-100 transition-opacity">
        <Trash2 className="w-3.5 h-3.5" style={{ color: '#C0392B' }} />
      </button>
    </div>
  )
}

function businessTypeLabel(type: string): string {
  const map: Record<string, string> = {
    freelance: 'פרילנסרית / עצמאית',
    content: 'תוכן / סושיאל מדיה',
    design: 'עיצוב / יצירה',
    consulting: 'ייעוץ / הדרכה',
    ecommerce: 'חנות אונליין',
    other: 'עסק עצמאי',
  }
  return map[type] || type
}
