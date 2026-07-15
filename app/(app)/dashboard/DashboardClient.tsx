'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Baby, CheckSquare, Moon, ChevronLeft, Milk, BedDouble, Plus, Droplets, X, Check, Pencil, Activity, Briefcase, Home, Play, Square, Clock, Droplet, Circle } from 'lucide-react'
import { Task, BabyLog, Profile } from '@/types/database'
import EntryPopup from './EntryPopup'
import BirthdayPopup from '@/components/BirthdayPopup'
import GaveBirthModal from '@/components/GaveBirthModal'
import { useSleepTimer } from '@/lib/useSleepTimer'

function NavBabyIcon() {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8.92773 14C9.42773 14.3 10.1277 14.5 10.9277 14.5C11.7277 14.5 12.4277 14.3 12.9277 14M13.9277 10H13.9377" stroke="#7F5268" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.3082 4.813C19.0093 5.8324 19.4927 6.9854 19.7282 8.2C20.0664 8.36377 20.3515 8.61948 20.5511 8.93782C20.7506 9.25617 20.8564 9.62429 20.8564 10C20.8564 10.3757 20.7506 10.7438 20.5511 11.0622C20.3515 11.3805 20.0664 11.6362 19.7282 11.8C19.2965 13.8135 18.1874 15.618 16.5859 16.9125C14.9844 18.207 12.9875 18.9132 10.9282 18.9132C8.86898 18.9132 6.87201 18.207 5.27053 16.9125C3.66905 15.618 2.55993 13.8135 2.12822 11.8C1.79008 11.6362 1.5049 11.3805 1.30537 11.0622C1.10583 10.7438 1 10.3757 1 10C1 9.62429 1.10583 9.25617 1.30537 8.93782C1.5049 8.61948 1.79008 8.36377 2.12822 8.2C2.54249 6.1705 3.64411 4.34602 5.24725 3.03437C6.85038 1.72271 8.85688 1.00418 10.9282 1C12.9282 1 14.4282 2.1 14.4282 3.5C14.4282 4.9 13.5282 6 12.4282 6C11.6282 6 10.9282 5.6 10.9282 5M7.92822 10H7.93822" stroke="#7F5268" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function NavChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 9.5C7.66848 9.5 7.35054 9.6317 7.11612 9.86612C6.8817 10.1005 6.75 10.4185 6.75 10.75C6.75 11.0815 6.8817 11.3995 7.11612 11.6339C7.35054 11.8683 7.66848 12 8 12C8.33152 12 8.64946 11.8683 8.88388 11.6339C9.1183 11.3995 9.25 11.0815 9.25 10.75C9.25 10.4185 9.1183 10.1005 8.88388 9.86612C8.64946 9.6317 8.33152 9.5 8 9.5ZM12 9.5C11.6685 9.5 11.3505 9.6317 11.1161 9.86612C10.8817 10.1005 10.75 10.4185 10.75 10.75C10.75 11.0815 10.8817 11.3995 11.1161 11.6339C11.3505 11.8683 11.6685 12 12 12C12.3315 12 12.6495 11.8683 12.8839 11.6339C13.1183 11.3995 13.25 11.0815 13.25 10.75C13.25 10.4185 13.1183 10.1005 12.8839 9.86612C12.6495 9.6317 12.3315 9.5 12 9.5ZM14.75 10.75C14.75 10.4185 14.8817 10.1005 15.1161 9.86612C15.3505 9.6317 15.6685 9.5 16 9.5C16.3315 9.5 16.6495 9.6317 16.8839 9.86612C17.1183 10.1005 17.25 10.4185 17.25 10.75C17.25 11.0815 17.1183 11.3995 16.8839 11.6339C16.6495 11.8683 16.3315 12 16 12C15.6685 12 15.3505 11.8683 15.1161 11.6339C14.8817 11.3995 14.75 11.0815 14.75 10.75Z" fill="#7F5268"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M16.1 4.59297C13.4061 4.36331 10.6981 4.34994 8.002 4.55297L7.809 4.56797C6.56941 4.66152 5.41091 5.21991 4.56552 6.13132C3.72013 7.04272 3.25026 8.23986 3.25 9.48297V18C3.25011 18.1296 3.28384 18.257 3.34788 18.3698C3.41193 18.4825 3.5041 18.5767 3.61541 18.6432C3.72673 18.7097 3.85337 18.7462 3.983 18.7491C4.11262 18.7521 4.24079 18.7213 4.355 18.66L8.265 16.559C8.44728 16.461 8.65105 16.4098 8.858 16.41H17.834C18.966 16.41 19.936 15.6 20.139 14.487C20.551 12.23 20.583 9.91997 20.235 7.65197L20.133 6.98297C20.0423 6.39194 19.7556 5.84855 19.3189 5.44011C18.8821 5.03168 18.3208 4.78192 17.725 4.73097L16.1 4.59297ZM8.116 6.04897C10.7321 5.85125 13.3599 5.86396 15.974 6.08697L17.598 6.22597C18.134 6.27197 18.57 6.67897 18.651 7.21097L18.754 7.87897C19.0755 9.98236 19.045 12.1246 18.664 14.218C18.6292 14.4124 18.527 14.5883 18.3754 14.7148C18.2238 14.8414 18.0325 14.9105 17.835 14.91H8.858C8.40357 14.9101 7.95623 15.0227 7.556 15.238L4.75 16.746V9.48297C4.75005 8.61815 5.07679 7.78527 5.66479 7.1511C6.25279 6.51693 7.05865 6.12828 7.921 6.06297L8.116 6.04897Z" fill="#7F5268"/>
    </svg>
  )
}

function NavTaskIcon() {
  return (
    <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M2 12.5C1.86739 12.5 1.74021 12.4473 1.64645 12.3536C1.55268 12.2598 1.5 12.1326 1.5 12V2C1.5 1.86739 1.55268 1.74021 1.64645 1.64645C1.74021 1.55268 1.86739 1.5 2 1.5H11.25C11.4489 1.5 11.6397 1.42098 11.7803 1.28033C11.921 1.13968 12 0.948912 12 0.75C12 0.551088 11.921 0.360322 11.7803 0.21967C11.6397 0.0790177 11.4489 2.96403e-09 11.25 0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V12C0 12.5304 0.210714 13.0391 0.585786 13.4142C0.960859 13.7893 1.46957 14 2 14H12C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12V8.75C14 8.55109 13.921 8.36032 13.7803 8.21967C13.6397 8.07902 13.4489 8 13.25 8C13.0511 8 12.8603 8.07902 12.7197 8.21967C12.579 8.36032 12.5 8.55109 12.5 8.75V12C12.5 12.1326 12.4473 12.2598 12.3536 12.3536C12.2598 12.4473 12.1326 12.5 12 12.5H2ZM14.78 3.68C14.9125 3.53782 14.9846 3.34978 14.9812 3.15548C14.9777 2.96118 14.899 2.77579 14.7616 2.63838C14.6242 2.50097 14.4388 2.42225 14.2445 2.41882C14.0502 2.4154 13.8622 2.48752 13.72 2.62L8.162 8.177L6.289 6.241C6.22066 6.1696 6.13889 6.1124 6.04837 6.07271C5.95786 6.03301 5.86039 6.0116 5.76157 6.0097C5.66276 6.0078 5.56454 6.02545 5.47257 6.06163C5.38059 6.09782 5.29668 6.15183 5.22565 6.22055C5.15462 6.28928 5.09787 6.37136 5.05867 6.46209C5.01947 6.55282 4.99859 6.6504 4.99723 6.74923C4.99586 6.84806 5.01405 6.94618 5.05074 7.03795C5.08742 7.12973 5.14189 7.21335 5.211 7.284L7.614 9.768C7.68314 9.83971 7.76587 9.89693 7.85737 9.93631C7.94887 9.9757 8.04729 9.99646 8.1469 9.9974C8.24651 9.99833 8.34531 9.97941 8.43752 9.94174C8.52974 9.90407 8.61353 9.84841 8.684 9.778L14.78 3.68Z" fill="#7F5268"/>
    </svg>
  )
}

interface Props {
  userId: string
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
const categoryText  = { work: 'עבודה', home: 'בית', baby: 'תינוק' }
const categoryIcons = { work: Briefcase, home: Home, baby: Baby }
const categoryClass   = { work: 'cat-work', home: 'cat-home', baby: 'cat-baby' }

const TRACK = [
  { type: 'feed'   as const, icon: Milk,     label: 'האכלה', color: '#7F5268' },
  { type: 'sleep'  as const, icon: BedDouble, label: 'שינה',  color: '#5C7A6A' },
  { type: 'diaper' as const, icon: Droplets,  label: 'חיתול', color: '#7A6A3C' },
]

export default function DashboardClient({
  userId, profile, tasks: initialTasks, motivation, babyWeeks, babyAgeLabel,
  nextMilestone, lastFeedAgo, lastSleepAgo, todayLogs: initialLogs,
}: Props) {
  const supabase = createClient()
  const timer = useSleepTimer(userId)

  // Local mutable lists for optimistic deletion / editing
  const [localLogs,  setLocalLogs]  = useState<BabyLog[]>(initialLogs)
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks)

  const [feedCount,   setFeedCount]   = useState(initialLogs.filter(l => l.type === 'feed').length)
  const [sleepCount,  setSleepCount]  = useState(initialLogs.filter(l => l.type === 'sleep').length)
  const [diaperCount, setDiaperCount] = useState(initialLogs.filter(l => l.type === 'diaper').length)

  const [showGaveBirth, setShowGaveBirth] = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [savedFlash,   setSavedFlash]   = useState(false)

  // Full log-entry form state (matches the baby tracker)
  const [showForm,   setShowForm]   = useState<'feed'|'sleep'|'diaper'|null>(null)
  const [feedType,   setFeedType]   = useState<'breast'|'bottle'>('breast')
  const [amount,     setAmount]     = useState('')
  const [duration,   setDuration]   = useState('')
  const [diaperType, setDiaperType] = useState<'wet'|'dirty'|'both'>('wet')
  const [notes,      setNotes]      = useState('')
  const [startTime,  setStartTime]  = useState(() => new Date().toISOString().slice(0, 16))
  const [editingLogId, setEditingLogId] = useState<string | null>(null)

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

  // Add a freshly-inserted log to local state + bump the matching counter.
  function addLogToState(log: BabyLog) {
    setLocalLogs(prev => [log, ...prev])
    if (log.type === 'feed')   setFeedCount(c => c + 1)
    if (log.type === 'sleep')  setSleepCount(c => c + 1)
    if (log.type === 'diaper') setDiaperCount(c => c + 1)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  function resetForm() {
    setShowForm(null)
    setEditingLogId(null)
    setAmount(''); setDuration(''); setNotes('')
    setFeedType('breast'); setDiaperType('wet')
    setStartTime(new Date().toISOString().slice(0, 16))
  }

  function openForm(type: 'feed'|'sleep'|'diaper') {
    setEditingLogId(null)
    setStartTime(new Date().toISOString().slice(0, 16))
    setShowForm(type)
  }

  function editLog(log: BabyLog) {
    setEditingLogId(log.id)
    setShowForm(log.type as 'feed'|'sleep'|'diaper')
    setStartTime(new Date(log.start_time).toISOString().slice(0, 16))
    setFeedType(log.feed_type === 'bottle' ? 'bottle' : 'breast')
    setAmount(log.amount_ml != null ? String(log.amount_ml) : '')
    setDuration(log.duration_min != null ? String(log.duration_min) : '')
    setDiaperType((log.diaper_type as 'wet'|'dirty'|'both') || 'wet')
    setNotes(log.notes || '')
  }

  async function saveLog() {
    if (!showForm) return
    setSaving(true)
    const payload: Partial<BabyLog> & { user_id: string; type: 'feed'|'sleep'|'diaper' } = {
      user_id: userId,
      type: showForm,
      start_time: new Date(startTime).toISOString(),
      notes: notes || null,
      feed_type: null,
      amount_ml: null,
      diaper_type: null,
      duration_min: null,
    }
    if (showForm === 'feed') {
      payload.feed_type = feedType
      if (amount)   payload.amount_ml   = parseInt(amount)
      if (duration) payload.duration_min = parseInt(duration)
    }
    if (showForm === 'diaper') payload.diaper_type = diaperType
    if (showForm === 'sleep' && duration) payload.duration_min = parseInt(duration)

    if (editingLogId) {
      const { data } = await supabase.from('baby_logs').update(payload).eq('id', editingLogId).select().single()
      if (data) setLocalLogs(prev => prev.map(l => l.id === editingLogId ? (data as BabyLog) : l))
    } else {
      const { data } = await supabase.from('baby_logs').insert(payload).select().single()
      if (data) addLogToState(data as BabyLog)
    }
    setSaving(false)
    resetForm()
  }

  async function handleTimerStop() {
    const log = await timer.stop()
    if (log) addLogToState(log)
  }

  const progressPercent = Math.min((babyWeeks / 52) * 100, 100)

  return (
    <div className="space-y-5 max-w-5xl">

      {/* Entry popup — sleep timer status + quick feed/diaper marking */}
      <EntryPopup userId={userId} onLog={addLogToState} />

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

      {/* ── Status ───────────────────────────────── */}
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
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryClass[task.category]}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {(() => {
                        const CatIcon = categoryIcons[task.category]
                        return <CatIcon className="w-3 h-3" />
                      })()}
                      {categoryText[task.category]}
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

      {/* ── Sleep timer shortcut ─────────────────── */}
      <div
        className="card"
        style={timer.active
          ? { background: 'rgba(92,122,106,0.1)', border: '1px solid rgba(92,122,106,0.3)' }
          : {}}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: timer.active ? 'rgba(92,122,106,0.15)' : 'var(--surface-2, #FAF4ED)' }}
            >
              <BedDouble className="w-5 h-5" style={{ color: '#5C7A6A' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {timer.active ? 'התינוק ישן עכשיו' : 'טיימר שינה'}
              </p>
              {timer.active ? (
                <p className="text-lg font-mono font-bold" style={{ color: '#5C7A6A' }}>
                  {timer.formatTimer(timer.elapsed)}
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  לחצי כשהתינוק נרדם — יירשם אוטומטית
                </p>
              )}
            </div>
          </div>
          {timer.active ? (
            <button
              onClick={handleTimerStop}
              disabled={timer.stopping}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: '#5C7A6A' }}
            >
              <Square className="w-4 h-4" fill="white" /> {timer.stopping ? 'שומרת...' : 'סיום שינה'}
            </button>
          ) : (
            <button
              onClick={timer.start}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#5C7A6A' }}
            >
              <Play className="w-4 h-4" fill="white" /> התחלה
            </button>
          )}
        </div>
      </div>

      {/* ── Quick Log ────────────────────────────── */}
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
                      onClick={() => editLog(log)}
                      title="ערוך רישום"
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 30,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'rgba(127,82,104,0.1)',
                        color: '#7F5268',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(127,82,104,0.2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(127,82,104,0.1)')}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
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

          {/* Per-type buttons — each opens the full log modal (date + time + details) */}
          <div className="grid grid-cols-3 gap-2">
            {TRACK.map(({ type, icon: Icon, label, color }) => (
              <button
                key={type}
                onClick={() => openForm(type)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:opacity-90"
                style={{ background: `${color}12`, border: `1.5px solid ${color}28` }}
              >
                <div className="flex items-center gap-1">
                  <Plus className="w-3 h-3" style={{ color }} />
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-xs font-medium" style={{ color }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Log entry modal (full, like the tracker) ── */}
      {showForm && (() => {
        const cfg = TRACK.find(t => t.type === showForm)!
        const CfgIcon = cfg.icon
        return (
          <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={e => e.target === e.currentTarget && resetForm()}
          >
            <div className="card w-full max-w-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CfgIcon className="w-6 h-6" style={{ color: cfg.color }} />
                  <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{editingLogId ? 'עריכת' : 'רישום'} {cfg.label}</h3>
                </div>
                <button
                  onClick={resetForm}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70"
                  style={{ background: 'var(--surface-2, #FAF4ED)' }}
                >
                  <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>

              <div>
                <label className="text-xs font-medium flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Clock className="w-3 h-3" /> תאריך ושעה
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>

              {showForm === 'feed' && (
                <>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>סוג האכלה</label>
                    <div className="grid grid-cols-2 gap-2">
                      {([['breast', Baby, 'שד'], ['bottle', Milk, 'בקבוק']] as const).map(([ft, FIcon, lbl]) => (
                        <button
                          key={ft}
                          onClick={() => setFeedType(ft)}
                          className="py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                          style={feedType === ft
                            ? { background: '#7F5268', color: 'white' }
                            : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          <FIcon className="w-3.5 h-3.5" />{lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {feedType === 'bottle' && (
                      <div>
                        <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>כמות (מ&quot;ל)</label>
                        <input
                          type="number"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          placeholder="120"
                          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                          style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>משך (דקות)</label>
                      <input
                        type="number"
                        value={duration}
                        onChange={e => setDuration(e.target.value)}
                        placeholder="15"
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {showForm === 'sleep' && (
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>משך שינה (דקות)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="90"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                  />
                </div>
              )}

              {showForm === 'diaper' && (
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>סוג חיתול</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([['wet', Droplet, 'רטוב'], ['dirty', Circle, 'מלוכלך'], ['both', Sparkles, 'שניהם']] as const).map(([dt, DIcon, lbl]) => (
                      <button
                        key={dt}
                        onClick={() => setDiaperType(dt)}
                        className="py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1"
                        style={diaperType === dt
                          ? { background: '#4A7C59', color: 'white' }
                          : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                      >
                        <DIcon className="w-4 h-4" fill={dt === 'dirty' ? 'currentColor' : 'none'} />{lbl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>הערות (אופציונלי)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="הוסיפי הערה..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>

              <button
                onClick={saveLog}
                disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: cfg.color }}
              >
                {saving ? 'שומרת...' : <><Check className="w-4 h-4" /> {editingLogId ? 'שמירת שינויים' : `שמירת ${cfg.label}`}</>}
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Quick nav links ────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/development', label: 'התפתחות', Icon: NavBabyIcon },
          { href: '/chat',        label: "AI",      Icon: NavChatIcon },
          { href: '/tasks',       label: 'משימות',  Icon: NavTaskIcon },
          { href: '/tracker',     label: 'מעקב',    Icon: null },
        ].map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="card flex flex-col items-center gap-2 py-4 text-center hover:opacity-80 transition-opacity"
            style={{ background: 'rgba(127,82,104,0.06)', border: '1px solid rgba(127,82,104,0.1)' }}
          >
            <span className="flex items-center justify-center" style={{ height: 22 }}>
              {Icon ? <Icon /> : <Activity className="w-5 h-5" style={{ color: '#7F5268' }} />}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--purple)' }}>{label}</span>
          </Link>
        ))}
      </div>

    </div>
  )
}
