'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Baby, CheckSquare, Moon, ChevronLeft, Milk, BedDouble, Plus, Droplets } from 'lucide-react'
import { Task, BabyLog, Profile } from '@/types/database'

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

// Tracker quick-log colors aligned with new palette
const TRACK = [
  { type: 'feed'   as const, icon: Milk,     label: 'האכלה', color: '#7F5268' },
  { type: 'sleep'  as const, icon: BedDouble, label: 'שינה',  color: '#5C7A6A' },
  { type: 'diaper' as const, icon: Droplets,  label: 'חיתול', color: '#7A6A3C' },
]

export default function DashboardClient({
  profile, tasks, motivation, babyWeeks, babyAgeLabel,
  nextMilestone, lastFeedAgo, lastSleepAgo, todayLogs,
}: Props) {
  const [quickLoading, setQuickLoading] = useState<string | null>(null)
  const supabase = createClient()

  const feedCount   = todayLogs.filter(l => l.type === 'feed').length
  const sleepCount  = todayLogs.filter(l => l.type === 'sleep').length
  const diaperCount = todayLogs.filter(l => l.type === 'diaper').length

  async function quickLog(type: 'feed' | 'sleep' | 'diaper') {
    setQuickLoading(type)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('baby_logs').insert({ user_id: user!.id, type, start_time: new Date().toISOString() })
    setQuickLoading(null)
    window.location.reload()
  }

  const progressPercent = Math.min((babyWeeks / 52) * 100, 100)

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Greeting card ─────────────────────────── */}
      <div className="card" style={{ background: 'rgba(127,82,104,0.06)', borderColor: 'rgba(127,82,104,0.14)' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
              שלום {profile?.name?.split(' ')[0] || 'אמא'} 👋
            </h1>
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
              <p className="text-sm leading-relaxed font-light" style={{ color: 'var(--text-muted)' }}>
                {motivation}
              </p>
            </div>
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
          <h2 className="font-medium text-sm mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Plus className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
            רישום מהיר
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {TRACK.map(({ type, icon: Icon, label, color }) => (
              <button
                key={type}
                onClick={() => quickLog(type)}
                disabled={quickLoading === type}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all hover:opacity-80"
                style={{ background: `${color}12`, border: `1px solid ${color}28` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-xs" style={{ color }}>{label}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {TRACK.map(({ type, label, color }) => (
              <div key={type} className="text-center py-2 rounded-lg" style={{ background: `${color}0d` }}>
                <p className="text-base font-semibold" style={{ color }}>
                  {type === 'feed' ? feedCount : type === 'sleep' ? sleepCount : diaperCount}
                </p>
                <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
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
        {tasks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm mb-2 font-light" style={{ color: 'var(--text-muted)' }}>אין משימות פתוחות 🎉</p>
            <Link href="/tasks" className="text-sm font-medium" style={{ color: 'var(--primary)' }}>הוסיפי משימה</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.slice(0, 5).map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--surface-2, #FAF4ED)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priorityColors[task.priority] }} />
                <span className="flex-1 text-sm font-light" style={{ color: 'var(--text)' }}>{task.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryClass[task.category]}`}>
                  {categoryLabels[task.category]}
                </span>
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

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center py-2 rounded-lg" style={{ background: `${color}0d` }}>
      <p className="text-base font-semibold" style={{ color }}>{value}</p>
      <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}
