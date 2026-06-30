'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Baby, CheckSquare, Moon, ChevronLeft, Milk, BedDouble, Plus, Droplets, X, Check, Pencil } from 'lucide-react'
import { Task, BabyLog, Profile } from '@/types/database'
import SelfCarePopup from './SelfCarePopup'
import BirthdayPopup from '@/components/BirthdayPopup'
import GaveBirthModal from '@/components/GaveBirthModal'

interface Props {
  profile: Profile | null
  tasks: Task[]
  motivation: string
  babyWeeks: number
  babyAgeLabel: string
  nextMilestone: string
  lastFeedAgo: string | null
  lastSleepAgo: string | null
  todayLogs: BabyLog[]
}

const priorityColors = { high: '#C0392B', medium: '#B8860B', low: '#4A7C59' }
const categoryLabels  = { work: '💼 עבודה', home: '🏠 בית', baby: '👶 תינוק' }
const categoryClass   = { work: 'cat-work', home: 'cat-home', baby: 'cat-baby' }

const TRACK = [
  { type: 'feed'   as const, icon: Milk,     label: 'האכלה', color: '#7F5268' },
  { type: 'sleep'  as const, icon: BedDouble, label: 'שינה',  color: '#5C7A6A' },
  { type: 'diaper' as const, icon: Droplets,  label: 'חיתול', color: '#7A6A3C' },
]

export default function DashboardClient({
  profile, tasks: initialTasks, motivation, babyWeeks, babyAgeLabel,
  nextMilestone, lastFeedAgo, lastSleepAgo, todayLogs: initialLogs,
}: Props) {
  const supabase = createClient()

  // Local mutable lists for optimistic deletion / editing
  const [localLogs,  setLocalLogs]  = useState<BabyLog[]>(initialLogs)
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks)

  const [feedCount,   setFeedCount]   = useState(initialLogs.filter(l => l.type === 'feed').length)
  const [sleepCount,  setSleepCount]  = useState(initialLogs.filter(l => l.type === 'sleep').length)
  const [diaperCount, setDiaperCount] = useState(initialLogs.filter(l => l.type === 'diaper').length)

  const [showGaveBirth, setShowGaveBirth] = useState(false)
  const [quickOpen,    setQuickOpen]    = useState(false)
  const [selectedType, setSelectedType] = useState<'feed'|'sleep'|'diaper'|null>(null)
  const [saving,       setSaving]       = useState(false)
  const [savedFlash,   setSavedFlash]   = useState(false)

  // Edit state for tasks
  const [editingTaskId,    setEditingTaskId]    = useState<string | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState('')
  const [savingTask,       setSavingTask]       = useState(false)

  async function deleteLog(id: string) {
    // Optimistic remove
    const removed = localLogs.find(l => l.id === id)
    setLocalLogs(prev => prev.filter(l => l.id !== id))
    if (removed) {
      if (removed.type === 'feed')   setFeedCount(c => Math.max(0, c - 1))
      if (removed.type === 'sleep')  setSleepCount(c => Math.max(0, c - 1))
      if (removed.type === 'diaper') setDiaperCount(c => Math.max(0, c - 1))
    }
    await supabase.from('baby_logs').delete().eq('id', id)
  }

  async function deleteTask(id: string) {
    setLocalTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  function startEditTask(task: Task) {
    setEditingTaskId(task.id)
    setEditingTaskTitle(task.title)
  }

  function cancelEditTask() {
    setEditingTaskId(null)
    setEditingTaskTitle('')
  }

  async function saveEditTask(id: string) {
    const newTitle = editingTaskTitle.trim()
    if (!newTitle) return
    setSavingTask(true)
    setLocalTasks(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t))
    await supabase.from('tasks').update({ title: newTitle }).eq('id', id)
    setSavingTask(false)
    setEditingTaskId(null)
    setEditingTaskTitle('')
  }

  async function saveLog() {
    if (!selectedType) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const now = new Date().toISOString()
    const { data: inserted } = await supabase
      .from('baby_logs')
      .insert({ user_id: user!.id, type: selectedType, start_time: now })
      .select()
      .single()
    // Optimistic counter update — no reload
    if (selectedType === 'feed')   setFeedCount(c => c + 1)
    if (selectedType === 'sleep')  setSleepCount(c => c + 1)
    if (selectedType === 'diaper') setDiaperCount(c => c + 1)
    // Prepend new log to localLogs for immediate display
    if (inserted) {
      setLocalLogs(prev => [inserted as BabyLog, ...prev])
    }
    setSaving(false)
    setSelectedType(null)
    setQuickOpen(false)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  const progressPercent = Math.min((babyWeeks / 52) * 100, 100)

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Self-care popup — once per session, 4s delay */}
      <SelfCarePopup />

      {/* Birthday milestone popup — at 6 months & 1 year */}
      {profile?.baby_name && (
        <BirthdayPopup
          babyName={profile.baby_name}
          babyGender={profile.baby_gender}
          babyWeeks={babyWeeks}
        />
      )}

      {/* GaveBirth modal */}
      {showGaveBirth && <GaveBirthModal onClose={() => setShowGaveBirth(false)} />}

      {/* ── Greeting card ─────────────────────────── */}
      <div className="card" style={{ background: 'rgba(127,82,104,0.06)', borderColor: 'rgba(127,82,104,0.14)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
              שלום {profile?.name?.split(' ')[0] || 'אמא'} 👋
            </h1>
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
              <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-muted)' }}>
                {motivation}
              </p>
            </div>

            {/* ילדתי button — only for pregnancy tracking */}
            {(profile?.tracking_type === 'pregnancy' || (!profile?.tracking_type && !profile?.baby_birthdate)) && (
              <button
                onClick={() => setShowGaveBirth(true)}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: 'rgba(127,82,104,0.12)', color: '#7F5268', border: '1.5px solid rgba(127,82,104,0.25)' }}
              >
                🎉 ילדתי!
              </button>
            )}
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
            style={{ background: 'var(--purple)', color: '#fff' }}
          >
            💜
          </div>
        </div>
      </div>

      {/* ── Baby progress ─────────────────────────── */}
      {profile?.baby_name && babyWeeks >= 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Baby className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                {profile.baby_name}
              </span>
            </div>
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: 'rgba(127,82,104,0.1)', color: 'var(--purple)' }}
            >
              {babyAgeLabel}
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: 'var(--cream-dark, #EEE0D0)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%`, background: 'var(--purple)' }}
            />
          </div>
          <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>
            💜 {profile.baby_name}{' '}
            {profile.baby_gender === 'girl'
              ? 'מתקדמת בקצב שלה ועושה עבודה מדהימה'
              : profile.baby_gender === 'boy'
              ? 'מתקדם בקצב שלו ועושה עבודה מדהים'
              : 'מתקדמ.ת בקצב שלו.ה ועושה עבודה מדהימה'}
          </p>
        </div>
      )}

      {/* ── Quick tracker + status ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Quick Log */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Plus className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
              רישום מהיר
            </h2>
            {savedFlash && (
              <span className="text-xs flex items-center gap-1" style={{ color: '#4A7C59' }}>
                <Check className="w-3 h-3" /> נשמר!
              </span>
            )}
          </div>

          {!quickOpen ? (
            /* Counts + open button */
            <div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {TRACK.map(({ type, label, color }) => (
                  <div key={type} className="text-center py-2 rounded-lg" style={{ background: `${color}0d` }}>
                    <p className="text-base font-semibold" style={{ color }}>
                      {type === 'feed' ? feedCount : type === 'sleep' ? sleepCount : diaperCount}
                    </p>
                    <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Today's log list with delete buttons */}
              {localLogs.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {localLogs.slice(0, 6).map(log => {
                    const track = TRACK.find(t => t.type === log.type)
                    if (!track) return null
                    const Icon = track.icon
                    const time = log.start_time
                      ? new Date(log.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
                      : ''
                    return (
                      <div
                        key={log.id}
                        className="flex items-center justify-between px-3 py-1.5 rounded-lg"
                        style={{ background: `${track.color}0d`, position: 'relative' }}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5" style={{ color: track.color }} />
                          <span className="text-xs font-medium" style={{ color: track.color }}>{track.label}</span>
                          {time && <span className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>{time}</span>}
                        </div>
                        <button
                          onClick={() => deleteLog(log.id)}
                          title="מחק רישום"
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: 'rgba(200,50,50,0.1)',
                            color: '#cc3333',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,50,50,0.2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(200,50,50,0.1)')}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              <button
                onClick={() => setQuickOpen(true)}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: 'rgba(127,82,104,0.1)', color: 'var(--primary)', border: '1px solid rgba(127,82,104,0.2)' }}
              >
                + הוסיפי רישום
              </button>
            </div>
          ) : (
            /* Inline type selector */
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>בחרי מה לרשום:</p>
                <button onClick={() => { setQuickOpen(false); setSelectedType(null) }}>
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {TRACK.map(({ type, icon: Icon, label, color }) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                    style={{
                      background: selectedType === type ? color : `${color}12`,
                      border: `1.5px solid ${selectedType === type ? color : `${color}28`}`,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: selectedType === type ? '#fff' : color }} />
                    <span className="text-xs font-medium" style={{ color: selectedType === type ? '#fff' : color }}>{label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={saveLog}
                disabled={!selectedType || saving}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                style={{ background: selectedType ? TRACK.find(t => t.type === selectedType)!.color : 'var(--border)' }}
              >
                {saving ? 'שומר...' : 'שמור'}
              </button>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="card">
          <h2 className="font-medium text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Moon className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
            סטטוס אחרון
          </h2>
          <div className="space-y-2">
            {[
              { icon: Milk, label: 'האכלה אחרונה', value: lastFeedAgo, color: '#7F5268' },
              { icon: BedDouble, label: 'שינה אחרונה', value: lastSleepAgo, color: '#5C7A6A' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'var(--surface-2, #FAF4ED)' }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span className="text-sm font-light" style={{ color: 'var(--text)' }}>{label}</span>
                </div>
                <span className="text-sm font-medium" style={{ color: value ? color : 'var(--text-muted)' }}>
                  {value || 'לא נרשם'}
                </span>
              </div>
            ))}
            <Link
              href="/tracker"
              className="flex items-center justify-center gap-1 mt-2 text-xs font-medium"
              style={{ color: 'var(--primary)' }}
            >
              לטרקר המלא
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tasks ──────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-sm flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <CheckSquare className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
            המשימות הדחופות
          </h2>
          <Link href="/tasks" className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
            כל המשימות
          </Link>
        </div>
        {localTasks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm mb-2 font-light" style={{ color: 'var(--text-muted)' }}>אין משימות פתוחות 🎉</p>
            <Link href="/tasks" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>הוסיפי משימה</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {localTasks.slice(0, 5).map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--surface-2, #FAF4ED)', position: 'relative' }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priorityColors[task.priority] }} />

                {/* Title — normal or edit mode */}
                {editingTaskId === task.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingTaskTitle}
                      onChange={e => setEditingTaskTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEditTask(task.id)
                        if (e.key === 'Escape') cancelEditTask()
                      }}
                      autoFocus
                      className="flex-1 text-sm px-2 py-1 rounded-lg outline-none border"
                      style={{ borderColor: 'var(--primary)', background: 'var(--bg)', color: 'var(--text)' }}
                    />
                    <button
                      onClick={() => saveEditTask(task.id)}
                      disabled={savingTask}
                      className="text-xs px-2 py-1 rounded-lg font-medium text-white"
                      style={{ background: '#4A7C59', flexShrink: 0 }}
                    >
                      {savingTask ? '...' : 'שמור'}
                    </button>
                    <button
                      onClick={cancelEditTask}
                      className="text-xs px-2 py-1 rounded-lg font-medium"
                      style={{ background: 'var(--border)', color: 'var(--text-muted)', flexShrink: 0 }}
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      className="flex-1 text-sm font-light cursor-pointer hover:opacity-70 flex items-center gap-1.5 group"
                      style={{ color: 'var(--text)' }}
                      onClick={() => startEditTask(task)}
                      title="לחצי לעריכה"
                    >
                      {task.title}
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryClass[task.category]}`}>
                      {categoryLabels[task.category]}
                    </span>
                  </>
                )}

                {/* Delete × button */}
                {editingTaskId !== task.id && (
                  <button
                    onClick={() => deleteTask(task.id)}
                    title="מחק משימה"
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'rgba(200,50,50,0.1)',
                      color: '#cc3333',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(200,50,50,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(200,50,50,0.1)')}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick nav links ────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/development', label: 'התפתחות', emoji: '🧸' },
          { href: '/chat',        label: "AI",      emoji: '💬' },
          { href: '/tasks',       label: 'משימות',  emoji: '✅' },
          { href: '/tracker',     label: 'מעקב',    emoji: '📊' },
        ].map(({ href, label, emoji }) => (
          <Link
            key={href}
            href={href}
            className="card flex flex-col items-center gap-2 py-4 text-center hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(127,82,104,0.06)', border: '1px solid rgba(127,82,104,0.1)' }}
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-xs font-medium" style={{ color: 'var(--purple)' }}>{label}</span>
          </Link>
        ))}
      </div>

    </div>
  )
}
