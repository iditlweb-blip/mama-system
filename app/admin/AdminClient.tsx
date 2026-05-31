'use client'

import { useState, useTransition } from 'react'
import {
  Users, Activity, Baby, CheckSquare, Shield,
  Search, TrendingUp, UserCheck, Clock, Trash2,
  KeyRound, UserPlus, X, Loader2, Smartphone, Eye, EyeOff
} from 'lucide-react'
import { deleteUser, sendPasswordReset, createUserByAdmin } from './actions'

interface UserRow {
  id: string
  email: string
  name: string
  provider: string
  created_at: string
  last_sign_in: string | null
  confirmed: boolean
  pwa_installed_at: string | null
}

interface Stats {
  total: number
  newThisWeek: number
  activeToday: number
  confirmed: number
  taskCount: number
  logCount: number
  pwaCount: number
}

interface Props { users: UserRow[]; stats: Stats }

type ModalType = 'delete' | 'reset' | 'create' | null

export default function AdminClient({ users: initialUsers, stats }: Props) {
  const [users, setUsers]       = useState(initialUsers)
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState<'newest' | 'active' | 'name'>('newest')
  const [modal, setModal]       = useState<ModalType>(null)
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Create form state
  const [newEmail, setNewEmail]       = useState('')
  const [newPass, setNewPass]         = useState('')
  const [newName, setNewName]         = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [formError, setFormError]     = useState('')

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

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  function openDelete(u: UserRow) { setSelected(u); setModal('delete') }
  function openReset(u: UserRow)  { setSelected(u); setModal('reset') }
  function openCreate()           { setModal('create'); setFormError('') }
  function closeModal()           { setModal(null); setSelected(null); setFormError('') }

  function fmt(dateStr: string | null) {
    if (!dateStr) return '—'
    const d    = new Date(dateStr)
    const diff = Date.now() - d.getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)
    if (mins < 2)   return 'עכשיו'
    if (mins < 60)  return `לפני ${mins} דק׳`
    if (hours < 24) return `לפני ${hours} ש׳`
    if (days < 7)   return `לפני ${days} ימים`
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function memberDuration(dateStr: string): string {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (days === 0) return 'היום'
    if (days === 1) return 'יום'
    if (days < 7)   return `${days} ימים`
    const weeks = Math.floor(days / 7)
    if (weeks < 5)  return `${weeks} שב׳`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} חוד׳`
    return `${Math.floor(days / 365)} שנים`
  }

  const providerEmoji = (p: string) => p === 'google' ? '🔵' : '📧'

  // ─── Actions ────────────────────────────────────────────────────────────────

  function handleDelete() {
    if (!selected) return
    startTransition(async () => {
      const res = await deleteUser(selected.id)
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== selected.id))
        showToast(`${selected.name || selected.email} נמחקה בהצלחה`)
      } else {
        showToast(res.error ?? 'שגיאה במחיקה', false)
      }
      closeModal()
    })
  }

  function handleReset() {
    if (!selected) return
    startTransition(async () => {
      const res = await sendPasswordReset(selected.email)
      if (res.ok) {
        showToast(`מייל איפוס נשלח ל-${selected.email}`)
      } else {
        showToast(res.error ?? 'שגיאה בשליחה', false)
      }
      closeModal()
    })
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!newEmail || !newPass || !newName) { setFormError('יש למלא את כל השדות'); return }
    if (newPass.length < 6) { setFormError('הסיסמא חייבת להכיל לפחות 6 תווים'); return }

    startTransition(async () => {
      const res = await createUserByAdmin(newEmail, newPass, newName)
      if (res.ok) {
        showToast(`משתמשת ${newName} נוצרה בהצלחה`)
        setNewEmail(''); setNewPass(''); setNewName('')
        closeModal()
      } else {
        setFormError(res.error ?? 'שגיאה ביצירת המשתמשת')
      }
    })
  }

  // ─── Shared input styles ────────────────────────────────────────────────────
  const inputSty: React.CSSProperties = {
    borderColor: 'var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
  }

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg)', direction: 'rtl' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#7F5268' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>מנהל מערכת</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>פאנל בלעדי — אמא בסדר</p>
            </div>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#4A7C59' }}>
            <UserPlus className="w-4 h-4" />
            יצירת משתמשת חדשה
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Users}      color="#7F5268" label="משתמשות רשומות" value={stats.total}       />
          <StatCard icon={TrendingUp} color="#4A7C59" label="חדשות השבוע"    value={stats.newThisWeek} />
          <StatCard icon={UserCheck}  color="#B8860B" label="פעילות היום"    value={stats.activeToday} />
          <StatCard icon={Activity}   color="#5C7A8A" label="מאושרות"        value={stats.confirmed}   />
        </div>

        {/* App usage (no chat) */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <UsageCard icon={CheckSquare} color="#7F5268" label="משימות במערכת" value={stats.taskCount} />
          <UsageCard icon={Baby}        color="#5C7A6A" label="רישומי תינוק"  value={stats.logCount}  />
          <UsageCard icon={Smartphone}  color="#5C6BA0" label="התקנות PWA"    value={stats.pwaCount}  />
        </div>

        {/* Users table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>
              כל המשתמשות ({users.length})
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                className="text-sm px-3 py-1.5 rounded-xl border outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                <option value="newest">🕐 הצטרפות אחרונה</option>
                <option value="active">⚡ פעילות אחרונה</option>
                <option value="name">🔤 לפי שם</option>
              </select>
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
          <div className="hidden md:grid grid-cols-6 gap-3 px-3 pb-2 border-b text-xs font-semibold uppercase"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
            <span>משתמשת</span>
            <span>מייל</span>
            <span>כניסה אחרונה</span>
            <span>זמן במערכת</span>
            <span>סטטוס</span>
            <span>פעולות</span>
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>אין תוצאות</p>
            ) : filtered.map(u => (
              <div key={u.id}
                className="grid grid-cols-1 md:grid-cols-6 gap-2 md:gap-3 px-3 py-3 items-center hover:opacity-80 transition-opacity">

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

                {/* Email + provider + PWA */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</span>
                  <span title={u.provider}>{providerEmoji(u.provider)}</span>
                  {u.pwa_installed_at && (
                    <span title={`התקינה PWA: ${new Date(u.pwa_installed_at).toLocaleDateString('he-IL')}`}>📱</span>
                  )}
                </div>

                {/* Last sign in */}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(u.last_sign_in)}</span>
                </div>

                {/* Member duration */}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    {memberDuration(u.created_at)}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>במערכת</span>
                </div>

                {/* Status */}
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={u.confirmed
                      ? { background: 'rgba(74,124,89,0.12)', color: '#4A7C59' }
                      : { background: 'rgba(184,134,11,0.12)', color: '#B8860B' }
                    }>
                    {u.confirmed ? '✓ מאושרת' : '⏳ ממתינה'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openReset(u)} title="שליחת מייל איפוס סיסמא"
                    className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ background: 'rgba(92,122,138,0.12)', color: '#5C7A8A' }}>
                    <KeyRound className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openDelete(u)} title="מחיקת משתמשת"
                    className="p-1.5 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ background: 'rgba(192,57,43,0.10)', color: '#C0392B' }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          🔒 דף זה נגיש רק לך · אמא בסדר Admin
        </p>
      </div>

      {/* ─── Delete Modal ──────────────────────────────────────────────────────── */}
      {modal === 'delete' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(192,57,43,0.10)' }}>
            <Trash2 className="w-5 h-5" style={{ color: '#C0392B' }} />
          </div>
          <h3 className="font-bold text-lg mb-1 text-center" style={{ color: 'var(--text)' }}>מחיקת משתמשת</h3>
          <p className="text-sm text-center mb-5" style={{ color: 'var(--text-muted)' }}>
            האם למחוק לצמיתות את <b style={{ color: 'var(--text)' }}>{selected.name || selected.email}</b>?<br />
            <span className="text-xs">כל הנתונים שלה יימחקו ולא ניתן לשחזר.</span>
          </p>
          <div className="flex gap-2">
            <button onClick={handleDelete} disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: '#C0392B' }}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              מחיקה
            </button>
            <button onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              ביטול
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ─── Reset Password Modal ──────────────────────────────────────────────── */}
      {modal === 'reset' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(92,122,138,0.12)' }}>
            <KeyRound className="w-5 h-5" style={{ color: '#5C7A8A' }} />
          </div>
          <h3 className="font-bold text-lg mb-1 text-center" style={{ color: 'var(--text)' }}>איפוס סיסמא</h3>
          <p className="text-sm text-center mb-5" style={{ color: 'var(--text-muted)' }}>
            ישלח מייל איפוס לכתובת:<br />
            <b style={{ color: 'var(--text)' }}>{selected.email}</b>
          </p>
          <div className="flex gap-2">
            <button onClick={handleReset} disabled={isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: '#5C7A8A' }}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              שלח מייל
            </button>
            <button onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              ביטול
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ─── Create User Modal ─────────────────────────────────────────────────── */}
      {modal === 'create' && (
        <ModalOverlay onClose={closeModal}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(74,124,89,0.12)' }}>
            <UserPlus className="w-5 h-5" style={{ color: '#4A7C59' }} />
          </div>
          <h3 className="font-bold text-lg mb-1 text-center" style={{ color: 'var(--text)' }}>יצירת משתמשת</h3>
          <p className="text-sm text-center mb-5" style={{ color: 'var(--text-muted)' }}>הרשמה ידנית עבור לקוחה</p>

          <form onSubmit={handleCreate} className="space-y-3">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="שם מלא" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={inputSty} />
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
              placeholder="כתובת מייל" className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
              style={inputSty} />
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)}
                placeholder="סיסמא (לפחות 6 תווים)" className="w-full pr-3 pl-10 py-2.5 rounded-xl border text-sm outline-none"
                style={inputSty} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {formError && (
              <p className="text-xs px-3 py-2 rounded-xl" style={{ background: '#FEF2F2', color: '#C0392B', border: '1px solid #FECACA' }}>
                {formError}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: '#4A7C59' }}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                יצירה
              </button>
              <button type="button" onClick={closeModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                ביטול
              </button>
            </div>
          </form>
        </ModalOverlay>
      )}

      {/* ─── Toast ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-80 z-50 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium flex items-center gap-2"
          style={{
            background: toast.ok ? '#4A7C59' : '#C0392B',
            color: '#fff',
            direction: 'rtl',
          }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}
    </div>
  )
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-6 relative"
        style={{ background: 'var(--bg)', border: '1px solid var(--border)', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 left-4 p-1 rounded-lg hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

// ─── Stat cards ────────────────────────────────────────────────────────────────
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

function stringToColor(str: string): string {
  const colors = ['#7F5268', '#4A7C59', '#5C7A8A', '#8B5A2B', '#5C6BA0', '#7A6A3C']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
