'use client'

import { useState } from 'react'
import { Users, Activity, MessageCircle, Baby, CheckSquare, Shield, Search, TrendingUp, UserCheck, Clock } from 'lucide-react'

interface UserRow {
  id: string
  email: string
  name: string
  provider: string
  created_at: string
  last_sign_in: string | null
  confirmed: boolean
}

interface Stats {
  total: number
  newThisWeek: number
  activeToday: number
  confirmed: number
  taskCount: number
  logCount: number
  chatCount: number
}

interface Props { users: UserRow[]; stats: Stats }

export default function AdminClient({ users, stats }: Props) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'newest' | 'active' | 'name'>('newest')

  const filtered = users
    .filter(u =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'active') {
        if (!a.last_sign_in) return 1
        if (!b.last_sign_in) return -1
        return new Date(b.last_sign_in).getTime() - new Date(a.last_sign_in).getTime()
      }
      return a.name.localeCompare(b.name, 'he')
    })

  function fmt(dateStr: string | null) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    const now = Date.now()
    const diff = now - d.getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins < 2)    return 'עכשיו'
    if (mins < 60)   return `לפני ${mins} דק׳`
    if (hours < 24)  return `לפני ${hours} ש׳`
    if (days < 7)    return `לפני ${days} ימים`
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const providerEmoji = (p: string) => p === 'google' ? '🔵' : '📧'

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg)', direction: 'rtl' }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: '#7F5268' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>מנהל מערכת</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>פאנל בלעדי — אמא בסדר</p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users}       color="#7F5268" label="משתמשות רשומות" value={stats.total}       />
          <StatCard icon={TrendingUp}  color="#4A7C59" label="חדשות השבוע"    value={stats.newThisWeek} />
          <StatCard icon={UserCheck}   color="#B8860B" label="פעילות היום"    value={stats.activeToday} />
          <StatCard icon={Activity}    color="#5C7A8A" label="מאושרות"        value={stats.confirmed}   />
        </div>

        {/* App usage stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <UsageCard icon={CheckSquare} color="#7F5268" label="משימות במערכת"   value={stats.taskCount} />
          <UsageCard icon={Baby}        color="#5C7A6A" label="רישומי תינוק"    value={stats.logCount}  />
          <UsageCard icon={MessageCircle} color="#8B5A2B" label="הודעות AI"     value={stats.chatCount} />
        </div>

        {/* Users table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>
              כל המשתמשות ({users.length})
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sort */}
              <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                className="text-sm px-3 py-1.5 rounded-xl border outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                <option value="newest">🕐 הצטרפות אחרונה</option>
                <option value="active">⚡ פעילות אחרונה</option>
                <option value="name">🔤 לפי שם</option>
              </select>
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="חיפוש מייל / שם..."
                  className="text-sm pr-9 pl-3 py-1.5 rounded-xl border outline-none w-48"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              </div>
            </div>
          </div>

          {/* Table header */}
          <div className="hidden md:grid grid-cols-5 gap-4 px-3 pb-2 border-b text-xs font-semibold uppercase"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
            <span>משתמשת</span>
            <span>מייל</span>
            <span>כניסה</span>
            <span>הצטרפות</span>
            <span>סטטוס</span>
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>אין תוצאות</p>
            ) : filtered.map(u => (
              <div key={u.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-4 px-3 py-3 items-center hover:opacity-80 transition-opacity">
                {/* Name + avatar */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: stringToColor(u.email) }}>
                    {(u.name || u.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {u.name || '—'}
                  </span>
                </div>

                {/* Email */}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</span>
                  <span title={u.provider}>{providerEmoji(u.provider)}</span>
                </div>

                {/* Last sign in */}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(u.last_sign_in)}</span>
                </div>

                {/* Created */}
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(u.created_at)}</span>

                {/* Status badges */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={u.confirmed
                      ? { background: 'rgba(74,124,89,0.12)', color: '#4A7C59' }
                      : { background: 'rgba(184,134,11,0.12)', color: '#B8860B' }
                    }>
                    {u.confirmed ? '✓ מאושרת' : '⏳ ממתינה'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          🔒 דף זה נגיש רק לך · אמא בסדר Admin
        </p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, color, label, value }: {
  icon: React.ElementType; color: string; label: string; value: number
}) {
  return (
    <div className="card text-center py-5">
      <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center"
        style={{ background: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <p className="text-3xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs mt-1 font-light" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  )
}

function UsageCard({ icon: Icon, color, label, value }: {
  icon: React.ElementType; color: string; label: string; value: number
}) {
  return (
    <div className="card flex items-center gap-3 py-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{value.toLocaleString()}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  )
}

// Deterministic color from email string
function stringToColor(str: string): string {
  const colors = ['#7F5268', '#4A7C59', '#5C7A8A', '#8B5A2B', '#5C6BA0', '#7A6A3C']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
