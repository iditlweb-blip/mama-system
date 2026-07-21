'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Briefcase, CheckSquare, Calendar, Plus, Trash2, Check,
  ChevronDown, Loader2, X,
  Baby, Flower2, Coffee, AlertTriangle, PartyPopper,
  Sparkles, CheckCircle2, Pencil, StickyNote,
  CalendarDays, Package, Wallet, Info
} from 'lucide-react'
import { Profile, Task, WeeklyScheduleItem } from '@/types/database'

interface Props {
  profile: Profile | null
  tasks: Task[]
  schedule: WeeklyScheduleItem[]
  userId: string
}

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const DAYS_SHORT = ['א’', 'ב’', 'ג’', 'ד’', 'ה’', 'ו’', 'ש’']

const scheduleTypeColors = {
  work: { bg: '#7F526820', border: '#7F526840', text: '#7F5268', label: 'עבודה', icon: Briefcase },
  baby: { bg: '#C4A0B420', border: '#C4A0B440', text: '#7F5268', label: 'תינוק', icon: Baby },
  personal: { bg: '#4A7C5920', border: '#4A7C5940', text: '#4A7C59', label: 'אישי', icon: Flower2 },
  break: { bg: '#5C7A6A20', border: '#5C7A6A40', text: '#5C7A6A', label: 'הפסקה', icon: Coffee },
}

const priorityColors = { high: '#C0392B', medium: '#B8860B', low: '#4A7C59' }

export default function BusinessClient({ profile, tasks: initialTasks, schedule: initialSchedule, userId }: Props) {
  const supabase = createClient()
  const isPregnancy = profile?.tracking_type === 'pregnancy'
  const [tasks, setTasks] = useState(initialTasks)
  const [schedule, setSchedule] = useState(initialSchedule)
  const [activeTab, setActiveTab] = useState<'tasks' | 'schedule' | 'leave' | 'equipment'>('tasks')

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
  const [schedNotes, setSchedNotes] = useState('')
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

  async function updateTask(id: string, title: string, priority: 'high' | 'medium' | 'low') {
    const t = title.trim()
    if (!t) return
    setTasks(prev => prev.map(x => x.id === id ? { ...x, title: t, priority } : x))
    await supabase.from('tasks').update({ title: t, priority }).eq('id', id)
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
      notes: schedNotes.trim() || null,
    }).select().single()
    if (data) setSchedule(prev => [...prev, data].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)))
    setSchedTitle('')
    setSchedStart('09:00')
    setSchedEnd('10:00')
    setSchedNotes('')
    setShowScheduleForm(false)
    setSchedSaving(false)
  }

  async function toggleScheduleComplete(id: string, completed: boolean) {
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, completed } : s))
    await supabase.from('weekly_schedule').update({ completed }).eq('id', id)
  }

  async function updateScheduleNote(id: string, notes: string) {
    const n = notes.trim() || null
    setSchedule(prev => prev.map(s => s.id === id ? { ...s, notes: n } : s))
    await supabase.from('weekly_schedule').update({ notes: n }).eq('id', id)
  }

  async function deleteScheduleItem(id: string) {
    await supabase.from('weekly_schedule').delete().eq('id', id)
    setSchedule(prev => prev.filter(s => s.id !== id))
  }

  // In pregnancy mode there's no baby yet, so baby-category tasks are noise —
  // hide them here (they still live in the DB for when tracking switches).
  const visibleTasks = isPregnancy ? tasks.filter(t => t.category !== 'baby') : tasks
  const doneTasks = visibleTasks.filter(t => t.status === 'done')
  const openTasks = visibleTasks.filter(t => t.status !== 'done')

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="card" style={{ background: 'rgba(127,82,104,0.06)', borderColor: 'rgba(127,82,104,0.14)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
              {profile?.business_name || 'ניהול'}
              <Briefcase size={18} style={{ color: '#7F5268' }} />
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {profile?.business_type ? businessTypeLabel(profile.business_type) : 'לוז ומשימות'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>משימות פתוחות</p>
            <p className="text-2xl font-bold" style={{ color: '#4A7C59' }}>{openTasks.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: 'var(--surface)' }}>
        {([
          { id: 'tasks', label: 'משימות', icon: CheckSquare },
          { id: 'schedule', label: 'לוז שבועי', icon: Calendar },
          ...(isPregnancy ? [
            { id: 'leave', label: 'חופשת לידה', icon: CalendarDays },
            { id: 'equipment', label: 'ציוד לחדר לידה', icon: Package },
          ] as const : []),
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex-1 flex-shrink-0 whitespace-nowrap flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
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
        <div className="space-y-3 pb-24 md:pb-0">
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
                    <option value="high">דחוף</option>
                    <option value="medium">בינוני</option>
                    <option value="low">נמוך</option>
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
              <div className="flex justify-center mb-2">
                <PartyPopper size={32} style={{ color: '#7F5268' }} />
              </div>
              <p className="font-semibold" style={{ color: 'var(--text)' }}>כל המשימות הושלמו!</p>
              <p className="text-sm mt-1 flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
                את מדהימה <Sparkles size={14} style={{ color: '#7F5268' }} />
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {openTasks.map(task => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} onEdit={updateTask} onDelete={deleteTask} />
              ))}
            </div>
          )}

          {/* Done tasks */}
          {doneTasks.length > 0 && (
            <details className="card">
              <summary className="cursor-pointer text-sm font-medium list-none flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4A7C59' }} />
                  הושלמו ({doneTasks.length})
                </span>
                <ChevronDown className="w-4 h-4" />
              </summary>
              <div className="mt-3 space-y-2">
                {doneTasks.map(task => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} onEdit={updateTask} onDelete={deleteTask} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* SCHEDULE TAB */}
      {activeTab === 'schedule' && (
        <div className="space-y-4 pb-24 md:pb-0">
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
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>הערה (אופציונלי)</label>
                <textarea
                  value={schedNotes}
                  onChange={e => setSchedNotes(e.target.value)}
                  placeholder="פרטים נוספים על האירוע..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
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
              <div className="flex justify-center mb-2">
                <Calendar size={32} style={{ color: '#7F5268' }} />
              </div>
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
                      {dayItems.map(item => (
                        <ScheduleRow
                          key={item.id}
                          item={item}
                          colors={scheduleTypeColors[item.type]}
                          onToggle={toggleScheduleComplete}
                          onSaveNote={updateScheduleNote}
                          onDelete={deleteScheduleItem}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* MATERNITY LEAVE TAB (pregnancy only) */}
      {activeTab === 'leave' && isPregnancy && (
        <div className="pb-24 md:pb-0"><MaternityLeave dueDate={profile?.due_date ?? null} /></div>
      )}

      {/* DELIVERY-ROOM EQUIPMENT TAB (pregnancy only) */}
      {activeTab === 'equipment' && isPregnancy && (
        <div className="pb-24 md:pb-0"><DeliveryEquipment userId={userId} /></div>
      )}
    </div>
  )
}

// ── Maternity-leave calculator ──────────────────────────────────────────────
// Israeli "דמי לידה" (Bituach Leumi maternity allowance) rough estimate:
//   daily benefit ≈ average of the 3 months' salary before the leave / 90,
//   capped at the legal daily maximum, paid across the entitlement period
//   (15 weeks = 105 days for the full grant, 8 weeks = 56 days for the partial).
// This is an estimate only — the exact sum depends on Bituach Leumi records.
const DAILY_CAP = 1651.25 // approx. legal daily maximum (2025), updated yearly

function MaternityLeave({ dueDate }: { dueDate: string | null }) {
  const [salary, setSalary] = useState('')
  const [fullGrant, setFullGrant] = useState(true)

  const monthly = parseFloat(salary) || 0
  const rawDaily = monthly / 30
  const daily = Math.min(rawDaily, DAILY_CAP)
  const capped = rawDaily > DAILY_CAP
  const days = fullGrant ? 105 : 56
  const total = Math.round(daily * days)

  // Earliest leave start: up to 7 weeks before the due date.
  const earliestStart = dueDate
    ? new Date(new Date(dueDate).getTime() - 49 * 86400000)
    : null

  return (
    <div className="space-y-4">
      {/* When to go on leave */}
      <div className="card">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <CalendarDays className="w-4 h-4" style={{ color: '#7F5268' }} />
          מתי לצאת לחופשת לידה?
        </h3>
        {earliestStart ? (
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            ניתן להתחיל את חופשת הלידה החל מ־
            <strong style={{ color: '#7F5268' }}> {earliestStart.toLocaleDateString('he-IL')} </strong>
            (עד 7 שבועות לפני תאריך הלידה המשוער
            {dueDate && <> — {new Date(dueDate).toLocaleDateString('he-IL')}</>}).
            את חייבת לצאת לכל המאוחר ביום הלידה עצמו.
          </p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            הזיני תאריך לידה משוער בהגדרות כדי לחשב את התאריך המוקדם ביותר לחופשת לידה.
          </p>
        )}
      </div>

      {/* Salary → allowance calculator */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Wallet className="w-4 h-4" style={{ color: '#7F5268' }} />
          מחשבון דמי לידה
        </h3>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>שכר ברוטו חודשי ממוצע (₪)</label>
          <input
            type="number"
            inputMode="numeric"
            value={salary}
            onChange={e => setSalary(e.target.value)}
            placeholder="לדוגמה: 12000"
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>תקופת הזכאות</label>
          <div className="grid grid-cols-2 gap-2">
            {([[true, '15 שבועות (מלא)'], [false, '8 שבועות (חלקי)']] as const).map(([val, lbl]) => (
              <button
                key={String(val)}
                onClick={() => setFullGrant(val)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={fullGrant === val
                  ? { background: '#7F5268', color: 'white' }
                  : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {monthly > 0 && (
          <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(127,82,104,0.08)' }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>דמי לידה ליום</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>₪{Math.round(daily).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--text-muted)' }}>מספר ימים</span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{days}</span>
            </div>
            <div className="h-px my-1" style={{ background: 'rgba(127,82,104,0.2)' }} />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>סה”כ מוערך</span>
              <span className="text-xl font-bold" style={{ color: '#4A7C59' }}>₪{total.toLocaleString()}</span>
            </div>
            {capped && (
              <p className="text-xs flex items-start gap-1" style={{ color: '#B8860B' }}>
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                השכר חורג מהתקרה — החישוב הוגבל לתקרת דמי הלידה המקסימלית ליום.
              </p>
            )}
          </div>
        )}

        <p className="text-xs flex items-start gap-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          זהו אומדן בלבד. דמי הלידה מחושבים לפי ההכנסות שבתיק הביטוח הלאומי שלך בשלושת החודשים
          שקדמו להפסקת העבודה. לפרטים המדויקים פני לביטוח הלאומי.
        </p>
      </div>
    </div>
  )
}

// ── Delivery-room equipment checklist ───────────────────────────────────────
// Persisted in localStorage (per user) so it works without an extra DB table /
// migration. Items are editable, addable and deletable.
interface EquipItem { id: string; text: string; done: boolean }

const DEFAULT_EQUIPMENT: string[] = [
  'תעודת זהות + טופס קופת חולים',
  'מסמכי הריון ובדיקות',
  'מטען לטלפון (כבל ארוך)',
  'בגדים נוחים לאמא',
  'כתונת/חלוק ונעלי בית',
  'כלי רחצה ומגבת',
  'חטיפים ובקבוק מים',
  'בגד גוף + חיתולים לתינוק',
  'שמיכה/חיתול קפוצ’ון לתינוק',
  'סלקל (כיסא בטיחות) לרכב',
  'רשימת טלפונים חשובים',
  'כרית הנקה (אופציונלי)',
]

function DeliveryEquipment({ userId }: { userId: string }) {
  const storageKey = `mama-delivery-equipment-${userId}`
  const [items, setItems] = useState<EquipItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Load once on mount (client-side only).
  useEffect(() => {
    let initial: EquipItem[] = []
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) initial = JSON.parse(raw)
    } catch { /* ignore */ }
    if (initial.length === 0) {
      initial = DEFAULT_EQUIPMENT.map((text, i) => ({ id: `d${i}`, text, done: false }))
    }
    setItems(initial)
    setLoaded(true)
  }, [storageKey])

  // Persist on every change (after initial load).
  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(storageKey, JSON.stringify(items)) } catch { /* ignore */ }
  }, [items, loaded, storageKey])

  function toggle(id: string) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, done: !it.done } : it))
  }
  function remove(id: string) {
    setItems(prev => prev.filter(it => it.id !== id))
  }
  function add() {
    const t = newItem.trim()
    if (!t) return
    setItems(prev => [...prev, { id: `${Date.now()}`, text: t, done: false }])
    setNewItem('')
  }
  function saveEdit(id: string) {
    const t = editText.trim()
    if (!t) return
    setItems(prev => prev.map(it => it.id === id ? { ...it, text: t } : it))
    setEditingId(null)
    setEditText('')
  }

  const packed = items.filter(i => i.done).length

  return (
    <div className="space-y-4">
      <div className="card" style={{ background: 'rgba(127,82,104,0.06)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Package className="w-4 h-4" style={{ color: '#7F5268' }} />
            תיק ללידה
          </h3>
          <span className="text-sm font-bold" style={{ color: '#4A7C59' }}>{packed}/{items.length}</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden mt-2" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${items.length > 0 ? (packed / items.length) * 100 : 0}%`, background: 'linear-gradient(90deg, #7F5268, #C4A0B4)' }} />
        </div>
      </div>

      {/* Add item */}
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="הוספת פריט..."
          className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
        <button
          onClick={add}
          disabled={!newItem.trim()}
          className="px-4 rounded-xl text-white text-sm font-semibold flex items-center gap-1 disabled:opacity-50"
          style={{ background: '#7F5268' }}
        >
          <Plus className="w-4 h-4" /> הוספה
        </button>
      </div>

      {/* List */}
      <div className="card space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>הרשימה ריקה — הוסיפי פריטים למעלה</p>
        ) : items.map(item => (
          editingId === item.id ? (
            <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid rgba(127,82,104,0.3)' }}>
              <input
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingId(null) }}
                autoFocus
                className="flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <button onClick={() => saveEdit(item.id)} className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ background: '#4A7C59' }}>
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl transition-all group" style={{ background: 'var(--surface)', opacity: item.done ? 0.6 : 1 }}>
              <button
                onClick={() => toggle(item.id)}
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={item.done ? { background: '#4A7C59', borderColor: '#4A7C59' } : { borderColor: '#7F5268' }}
              >
                {item.done && <Check className="w-3 h-3 text-white" />}
              </button>
              <span className="flex-1 text-sm" style={{ color: 'var(--text)', textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.text}
              </span>
              <button onClick={() => { setEditingId(item.id); setEditText(item.text) }} title="עריכה" className="opacity-30 group-hover:opacity-100 transition-opacity">
                <Pencil className="w-3.5 h-3.5" style={{ color: '#7F5268' }} />
              </button>
              <button onClick={() => remove(item.id)} title="מחיקה" className="opacity-30 hover:opacity-100 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" style={{ color: '#C0392B' }} />
              </button>
            </div>
          )
        ))}
      </div>
    </div>
  )
}

const priorityLabels: Record<'high' | 'medium' | 'low', string> = { high: 'דחוף', medium: 'בינוני', low: 'נמוך' }

function TaskRow({ task, onToggle, onEdit, onDelete }: {
  task: Task
  onToggle: (id: string, status: string) => void
  onEdit: (id: string, title: string, priority: 'high' | 'medium' | 'low') => void
  onDelete: (id: string) => void
}) {
  const done = task.status === 'done'
  const overdue = task.due_date && !done && new Date(task.due_date) < new Date()
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>(task.priority)

  function startEdit() {
    setEditTitle(task.title)
    setEditPriority(task.priority)
    setEditing(true)
  }

  function save() {
    if (!editTitle.trim()) return
    onEdit(task.id, editTitle, editPriority)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="p-3 rounded-xl space-y-2" style={{ background: 'var(--surface)', border: '1px solid rgba(127,82,104,0.3)' }}>
        <input
          value={editTitle}
          onChange={e => setEditTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        />
        <div className="flex items-center gap-2">
          <select
            value={editPriority}
            onChange={e => setEditPriority(e.target.value as 'high' | 'medium' | 'low')}
            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            <option value="high">דחוף</option>
            <option value="medium">בינוני</option>
            <option value="low">נמוך</option>
          </select>
          <button onClick={save} className="px-3 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-1" style={{ background: '#4A7C59' }}>
            <Check className="w-3.5 h-3.5" /> שמירה
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            ביטול
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl transition-all group"
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
          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: overdue ? '#C0392B' : 'var(--text-muted)' }}>
            {overdue ? <AlertTriangle size={11} /> : <Calendar size={11} />}
            {new Date(task.due_date).toLocaleDateString('he-IL')}
          </p>
        )}
      </div>
      <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: `${priorityColors[task.priority]}18`, color: priorityColors[task.priority] }}>
        {priorityLabels[task.priority]}
      </span>
      {!done && (
        <button onClick={startEdit} title="עריכת משימה" className="opacity-30 group-hover:opacity-100 transition-opacity">
          <Pencil className="w-3.5 h-3.5" style={{ color: '#7F5268' }} />
        </button>
      )}
      <button onClick={() => onDelete(task.id)} title="מחיקה" className="opacity-30 hover:opacity-100 transition-opacity">
        <Trash2 className="w-3.5 h-3.5" style={{ color: '#C0392B' }} />
      </button>
    </div>
  )
}

function ScheduleRow({ item, colors, onToggle, onSaveNote, onDelete }: {
  item: WeeklyScheduleItem
  colors: { bg: string; border: string; text: string; label: string; icon: typeof Briefcase }
  onToggle: (id: string, completed: boolean) => void
  onSaveNote: (id: string, notes: string) => void
  onDelete: (id: string) => void
}) {
  const done = !!item.completed
  const [editingNote, setEditingNote] = useState(false)
  const [noteDraft, setNoteDraft] = useState(item.notes || '')

  return (
    <div className="rounded-xl" style={{ background: colors.bg, border: `1px solid ${colors.border}`, opacity: done ? 0.55 : 1 }}>
      <div className="flex items-center gap-3 p-2.5">
        <button
          onClick={() => onToggle(item.id, !done)}
          title={done ? 'בטלי סימון' : 'סמני כהושלם'}
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
          style={done ? { background: '#4A7C59', borderColor: '#4A7C59' } : { borderColor: colors.text }}
        >
          {done && <Check className="w-3 h-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)', textDecoration: done ? 'line-through' : 'none' }}>{item.title}</p>
          <p className="text-xs" style={{ color: colors.text }}>
            {item.start_time.slice(0, 5)} – {item.end_time.slice(0, 5)}
          </p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1" style={{ background: `${colors.text}20`, color: colors.text }}>
          <colors.icon size={12} />
          {colors.label}
        </span>
        <button
          onClick={() => { setNoteDraft(item.notes || ''); setEditingNote(v => !v) }}
          title="הערה"
          className="transition-opacity"
          style={{ opacity: item.notes ? 1 : 0.4, color: colors.text }}
        >
          <StickyNote className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(item.id)} className="opacity-40 hover:opacity-100 transition-opacity">
          <Trash2 className="w-3.5 h-3.5" style={{ color: '#C0392B' }} />
        </button>
      </div>

      {!editingNote && item.notes && (
        <p className="text-xs px-3 pb-2.5 -mt-1 leading-relaxed" style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
          {item.notes}
        </p>
      )}

      {editingNote && (
        <div className="px-2.5 pb-2.5 space-y-2">
          <textarea
            value={noteDraft}
            onChange={e => setNoteDraft(e.target.value)}
            placeholder="כתבי הערה לאירוע..."
            rows={2}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => { onSaveNote(item.id, noteDraft); setEditingNote(false) }}
              className="px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1"
              style={{ background: '#4A7C59' }}
            >
              <Check className="w-3 h-3" /> שמירת הערה
            </button>
            <button onClick={() => setEditingNote(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              ביטול
            </button>
          </div>
        </div>
      )}
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
