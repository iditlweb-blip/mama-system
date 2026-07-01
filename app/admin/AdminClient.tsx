'use client'

import { useState, useTransition } from 'react'
import {
  Users, Activity, Baby, CheckSquare, Shield,
  Search, TrendingUp, UserCheck, Clock, Trash2,
  KeyRound, UserPlus, X, Loader2, Smartphone, Eye, EyeOff,
  Briefcase, ShoppingBag, Plus, Edit2, BarChart2,
  Home, MessageCircle, ShoppingCart, BookOpen, User, LogIn, Mail,
  CheckCircle2, Hourglass, XCircle, Lock, Timer,
} from 'lucide-react'
import {
  deleteUser, sendPasswordReset, createUserByAdmin,
  upsertProfessional, deleteProfessional,
  upsertProduct, deleteProduct,
} from './actions'

interface UserRow {
  id: string
  email: string
  name: string
  provider: string
  created_at: string
  last_sign_in: string | null
  confirmed: boolean
  pwa_installed_at: string | null
  weeklySeconds: number
  topPage: string | null
}

interface Professional {
  id: string
  name: string
  title: string | null
  phone: string | null
  region: string | null
  image_url: string | null
  sort_order: number | null
}

interface Product {
  id: string
  name: string
  description: string | null
  image_url: string | null
  coupon_code: string | null
  buy_link: string | null
  sort_order: number | null
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

interface Props {
  users: UserRow[]
  stats: Stats
  professionals: Professional[]
  products: Product[]
}

type ModalType = 'delete' | 'reset' | 'create' | 'user-detail' | null
type ManageTab = 'professionals' | 'products'

export default function AdminClient({ users: initialUsers, stats, professionals: initPros, products: initProducts }: Props) {
  const [users, setUsers]   = useState(initialUsers)
  const [pros, setPros]     = useState(initPros)
  const [products, setProducts] = useState(initProducts)
  const [search, setSearch] = useState('')
  const [sort, setSort]     = useState<'newest' | 'active' | 'name'>('newest')
  const [modal, setModal]   = useState<ModalType>(null)
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [toast, setToast]   = useState<{ msg: string; ok: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [manageTab, setManageTab] = useState<ManageTab>('professionals')

  // Pro form
  const emptyPro = { id: '', name: '', title: '', phone: '', region: '', sort_order: '' }
  const [proForm, setProForm]       = useState(emptyPro)
  const [showProForm, setShowProForm] = useState(false)

  // Product form
  const emptyProduct = { id: '', name: '', description: '', coupon_code: '', buy_link: '', sort_order: '' }
  const [productForm, setProductForm]       = useState(emptyProduct)
  const [showProductForm, setShowProductForm] = useState(false)

  // Create-user form
  const [newEmail, setNewEmail] = useState('')
  const [newPass,  setNewPass]  = useState('')
  const [newName,  setNewName]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [formError, setFormError] = useState('')

  // ── Filtering / sorting ────────────────────────────────────────────────────────
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

  // ── Helpers ────────────────────────────────────────────────────────────────────
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  function openDelete(u: UserRow) { setSelected(u); setModal('delete') }
  function openReset(u: UserRow)  { setSelected(u); setModal('reset') }
  function openCreate()           { setModal('create'); setFormError('') }
  function openDetail(u: UserRow) { setSelected(u); setModal('user-detail') }
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

  function fmtHours(seconds: number): string {
    if (seconds < 60)  return '<1 דק׳'
    const mins = Math.floor(seconds / 60)
    if (mins < 60)     return `${mins} דק׳`
    const hrs = (seconds / 3600).toFixed(1)
    return `${hrs} ש׳`
  }

  function fmtPage(page: string | null): React.ReactNode {
    if (!page) return '—'
    const map: Record<string, { icon: React.ElementType; label: string }> = {
      '/dashboard':   { icon: Home,           label: 'בית' },
      '/tracker':     { icon: Baby,           label: 'מעקב' },
      '/pregnancy':   { icon: Baby,           label: 'הריון' },
      '/chat':        { icon: MessageCircle,  label: 'צ׳אט' },
      '/products':    { icon: ShoppingCart,   label: 'מוצרים' },
      '/development': { icon: BookOpen,       label: 'פיתוח' },
      '/personal':    { icon: User,           label: 'אישי' },
    }
    const entry = map[page]
    if (!entry) return page
    const Icon = entry.icon
    return (
      <span className="inline-flex items-center gap-1">
        <Icon className="w-3.5 h-3.5" />
        {entry.label}
      </span>
    )
  }

  const providerIcon = (p: string) =>
    p === 'google' ? <LogIn className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />

  // ── User actions ───────────────────────────────────────────────────────────────
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

  // ── Professional actions ───────────────────────────────────────────────────────
  function editPro(p: Professional) {
    setProForm({ id: p.id, name: p.name, title: p.title ?? '', phone: p.phone ?? '', region: p.region ?? '', sort_order: p.sort_order?.toString() ?? '' })
    setShowProForm(true)
  }

  function handleSavePro(e: React.FormEvent) {
    e.preventDefault()
    if (!proForm.name.trim()) return
    startTransition(async () => {
      const res = await upsertProfessional({
        id: proForm.id || undefined,
        name: proForm.name,
        title: proForm.title || undefined,
        phone: proForm.phone || undefined,
        region: proForm.region || undefined,
        sort_order: proForm.sort_order ? parseInt(proForm.sort_order) : undefined,
      })
      if (res.ok) {
        showToast(proForm.id ? 'בעל/ת מקצוע עודכן/ה' : 'בעל/ת מקצוע נוסף/ה')
        setShowProForm(false)
        setProForm(emptyPro)
        window.location.reload()
      } else {
        showToast(res.error ?? 'שגיאה בשמירה', false)
      }
    })
  }

  function handleDeletePro(id: string, name: string) {
    if (!confirm(`למחוק את ${name}?`)) return
    startTransition(async () => {
      const res = await deleteProfessional(id)
      if (res.ok) {
        setPros(prev => prev.filter(p => p.id !== id))
        showToast(`${name} נמחק/ה`)
      } else {
        showToast(res.error ?? 'שגיאה במחיקה', false)
      }
    })
  }

  // ── Product actions ────────────────────────────────────────────────────────────
  function editProduct(p: Product) {
    setProductForm({ id: p.id, name: p.name, description: p.description ?? '', coupon_code: p.coupon_code ?? '', buy_link: p.buy_link ?? '', sort_order: p.sort_order?.toString() ?? '' })
    setShowProductForm(true)
  }

  function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!productForm.name.trim()) return
    startTransition(async () => {
      const res = await upsertProduct({
        id: productForm.id || undefined,
        name: productForm.name,
        description: productForm.description || undefined,
        coupon_code: productForm.coupon_code || undefined,
        buy_link: productForm.buy_link || undefined,
        sort_order: productForm.sort_order ? parseInt(productForm.sort_order) : undefined,
      })
      if (res.ok) {
        showToast(productForm.id ? 'מוצר עודכן' : 'מוצר נוסף')
        setShowProductForm(false)
        setProductForm(emptyProduct)
        window.location.reload()
      } else {
        showToast(res.error ?? 'שגיאה בשמירה', false)
      }
    })
  }

  function handleDeleteProduct(id: string, name: string) {
    if (!confirm(`למחוק את ${name}?`)) return
    startTransition(async () => {
      const res = await deleteProduct(id)
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id))
        showToast(`${name} נמחק`)
      } else {
        showToast(res.error ?? 'שגיאה במחיקה', false)
      }
    })
  }

  // ── Styles ─────────────────────────────────────────────────────────────────────
  const inputSty: React.CSSProperties = {
    borderColor: 'var(--border)',
    background: 'var(--bg)',
    color: 'var(--text)',
  }

  // ─────────────────────────────────────────────────────────────────────────────
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

        {/* App usage */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <UsageCard icon={CheckSquare} color="#7F5268" label="משימות במערכת" value={stats.taskCount} />
          <UsageCard icon={Baby}        color="#5C7A6A" label="רישומי תינוק"  value={stats.logCount}  />
          <UsageCard icon={Smartphone}  color="#5C6BA0" label="התקנות PWA"    value={stats.pwaCount}  />
        </div>

        {/* ── Users table ────────────────────────────────────────────────────────── */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>
              כל המשתמשות ({users.length})
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
                className="text-sm px-3 py-1.5 rounded-xl border outline-none"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                <option value="newest">הצטרפות אחרונה</option>
                <option value="active">פעילות אחרונה</option>
                <option value="name">לפי שם</option>
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

          {/* Table header — 7 cols */}
          <div className="hidden md:grid grid-cols-7 gap-3 px-3 pb-2 border-b text-xs font-semibold uppercase"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
            <span>משתמשת</span>
            <span>מייל</span>
            <span>כניסה אחרונה</span>
            <span>במערכת</span>
            <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> שבועי</span>
            <span>סטטוס</span>
            <span>פעולות</span>
          </div>

          {/* Rows */}
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {filtered.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>אין תוצאות</p>
            ) : filtered.map(u => (
              <div key={u.id}
                className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-3 px-3 py-3 items-center hover:opacity-80 transition-opacity cursor-pointer"
                onClick={() => openDetail(u)}>

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

                {/* Email + badges */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</span>
                  <span title={u.provider}>{providerIcon(u.provider)}</span>
                  {u.pwa_installed_at && (
                    <span title={`PWA: ${new Date(u.pwa_installed_at).toLocaleDateString('he-IL')}`}>
                      <Smartphone className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* Last sign in */}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmt(u.last_sign_in)}</span>
                </div>

                {/* Membership duration */}
                <div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    {memberDuration(u.created_at)}
                  </span>
                </div>

                {/* Weekly analytics */}
                <div>
                  {u.weeklySeconds > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: '#7F5268' }}>
                        <Timer className="w-3 h-3" />
                        {fmtHours(u.weeklySeconds)}
                      </span>
                      {u.topPage && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{fmtPage(u.topPage)}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </div>

                {/* Status */}
                <div onClick={e => e.stopPropagation()}>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
                    style={u.confirmed
                      ? { background: 'rgba(74,124,89,0.12)', color: '#4A7C59' }
                      : { background: 'rgba(184,134,11,0.12)', color: '#B8860B' }
                    }>
                    {u.confirmed
                      ? <><CheckCircle2 className="w-3 h-3" />מאושרת</>
                      : <><Hourglass className="w-3 h-3" />ממתינה</>}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
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

        {/* ── Manage content ─────────────────────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>ניהול תוכן</h2>
            {/* Tabs */}
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {(['professionals', 'products'] as ManageTab[]).map(tab => (
                <button key={tab}
                  onClick={() => { setManageTab(tab); setShowProForm(false); setShowProductForm(false) }}
                  className="px-4 py-2 text-sm font-medium flex items-center gap-2 transition-colors"
                  style={manageTab === tab
                    ? { background: '#7F5268', color: '#fff' }
                    : { background: 'transparent', color: 'var(--text-muted)' }}>
                  {tab === 'professionals'
                    ? <><Briefcase className="w-3.5 h-3.5" />אנשי מקצוע</>
                    : <><ShoppingBag className="w-3.5 h-3.5" />מוצרים</>}
                </button>
              ))}
            </div>
          </div>

          {/* ── Professionals ─────────────────────────────────────────────────────── */}
          {manageTab === 'professionals' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => { setProForm(emptyPro); setShowProForm(true) }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#7F5268' }}>
                  <Plus className="w-4 h-4" />הוספת איש/ת מקצוע
                </button>
              </div>

              {showProForm && (
                <form onSubmit={handleSavePro}
                  className="p-4 rounded-xl mb-4 border space-y-3"
                  style={{ borderColor: 'var(--border)', background: 'rgba(127,82,104,0.04)' }}>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    {proForm.id ? 'עריכת' : 'הוספת'} איש/ת מקצוע
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={proForm.name} onChange={e => setProForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="שם *" required
                      className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
                    <input value={proForm.title} onChange={e => setProForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="תפקיד (עובדת סוציאלית, מטפלת...)"
                      className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
                    <input value={proForm.phone} onChange={e => setProForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="טלפון"
                      className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
                    <input value={proForm.region} onChange={e => setProForm(f => ({ ...f, region: e.target.value }))}
                      placeholder="אזור (מרכז, צפון, דרום...)"
                      className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
                    <input type="number" value={proForm.sort_order}
                      onChange={e => setProForm(f => ({ ...f, sort_order: e.target.value }))}
                      placeholder="סדר תצוגה"
                      className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={isPending}
                      className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
                      style={{ background: '#7F5268' }}>
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}שמירה
                    </button>
                    <button type="button" onClick={() => setShowProForm(false)}
                      className="px-5 py-2 rounded-xl text-sm border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>ביטול</button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {pros.length === 0 ? (
                  <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>אין אנשי מקצוע עדיין</p>
                ) : pros.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl border"
                    style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {[p.title, p.region, p.phone].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editPro(p)}
                        className="p-1.5 rounded-lg" style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268' }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeletePro(p.id, p.name)}
                        className="p-1.5 rounded-lg" style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Products ───────────────────────────────────────────────────────────── */}
          {manageTab === 'products' && (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => { setProductForm(emptyProduct); setShowProductForm(true) }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#7F5268' }}>
                  <Plus className="w-4 h-4" />הוספת מוצר
                </button>
              </div>

              {showProductForm && (
                <form onSubmit={handleSaveProduct}
                  className="p-4 rounded-xl mb-4 border space-y-3"
                  style={{ borderColor: 'var(--border)', background: 'rgba(127,82,104,0.04)' }}>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    {productForm.id ? 'עריכת' : 'הוספת'} מוצר
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="שם מוצר *" required
                      className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
                    <input value={productForm.coupon_code} onChange={e => setProductForm(f => ({ ...f, coupon_code: e.target.value }))}
                      placeholder="קוד קופון"
                      className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
                    <input value={productForm.buy_link} onChange={e => setProductForm(f => ({ ...f, buy_link: e.target.value }))}
                      placeholder="קישור לרכישה"
                      className="col-span-2 px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
                    <textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="תיאור קצר" rows={2}
                      className="col-span-2 px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                      style={inputSty} />
                    <input type="number" value={productForm.sort_order}
                      onChange={e => setProductForm(f => ({ ...f, sort_order: e.target.value }))}
                      placeholder="סדר תצוגה"
                      className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={isPending}
                      className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
                      style={{ background: '#7F5268' }}>
                      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}שמירה
                    </button>
                    <button type="button" onClick={() => setShowProductForm(false)}
                      className="px-5 py-2 rounded-xl text-sm border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>ביטול</button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {products.length === 0 ? (
                  <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>אין מוצרים עדיין</p>
                ) : products.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl border"
                    style={{ borderColor: 'var(--border)' }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {p.description ? p.description.slice(0, 60) + (p.description.length > 60 ? '...' : '') : ''}
                        {p.coupon_code ? ` · קוד: ${p.coupon_code}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editProduct(p)}
                        className="p-1.5 rounded-lg" style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268' }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-1.5 rounded-lg" style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6 flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <Lock className="w-3 h-3" />
          דף זה נגיש רק לך · אמא בסדר Admin
        </p>
      </div>

      {/* ── Delete User Modal ──────────────────────────────────────────────────── */}
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

      {/* ── Reset Password Modal ───────────────────────────────────────────────── */}
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

      {/* ── User Detail Modal ──────────────────────────────────────────────────── */}
      {modal === 'user-detail' && selected && (
        <ModalOverlay onClose={closeModal}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ background: stringToColor(selected.email) }}>
              {(selected.name || selected.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-base" style={{ color: 'var(--text)' }}>{selected.name || '—'}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selected.email}</p>
            </div>
          </div>

          <div className="space-y-2.5 mb-5 text-sm">
            <DetailRow label="ספק" value={
              <span className="inline-flex items-center gap-1.5">
                {selected.provider === 'google' ? <LogIn className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                {selected.provider === 'google' ? 'Google' : 'Email'}
              </span>
            } />
            <DetailRow label="הצטרף/ה"     value={fmt(selected.created_at)} />
            <DetailRow label="כניסה אחרונה" value={fmt(selected.last_sign_in)} />
            <DetailRow label="ותק"          value={memberDuration(selected.created_at) + ' במערכת'} />
            <DetailRow label="PWA" value={selected.pwa_installed_at
              ? <span className="inline-flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" />{new Date(selected.pwa_installed_at).toLocaleDateString('he-IL')}</span>
              : '—'} />
            <DetailRow label="סטטוס" value={
              selected.confirmed
                ? <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" />מאושרת</span>
                : <span className="inline-flex items-center gap-1.5"><Hourglass className="w-3.5 h-3.5" />ממתינה</span>
            } />
            {selected.weeklySeconds > 0 && (
              <DetailRow label={<span className="inline-flex items-center gap-1"><Timer className="w-3.5 h-3.5" />זמן השבוע</span>} value={fmtHours(selected.weeklySeconds)} highlight />
            )}
            {selected.topPage && (
              <DetailRow label={<span className="inline-flex items-center gap-1"><BarChart2 className="w-3.5 h-3.5" />עמוד מוביל</span>} value={fmtPage(selected.topPage)} />
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { const u = selected; closeModal(); setTimeout(() => openReset(u), 50) }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'rgba(92,122,138,0.12)', color: '#5C7A8A' }}>
              <KeyRound className="w-3.5 h-3.5" />איפוס סיסמא
            </button>
            <button
              onClick={() => { const u = selected; closeModal(); setTimeout(() => openDelete(u), 50) }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'rgba(192,57,43,0.10)', color: '#C0392B' }}>
              <Trash2 className="w-3.5 h-3.5" />מחיקה
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Create User Modal ──────────────────────────────────────────────────── */}
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
                placeholder="סיסמא (לפחות 6 תווים)"
                className="w-full pr-3 pl-10 py-2.5 rounded-xl border text-sm outline-none"
                style={inputSty} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formError && (
              <p className="text-xs px-3 py-2 rounded-xl"
                style={{ background: '#FEF2F2', color: '#C0392B', border: '1px solid #FECACA' }}>
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

      {/* ── Toast ─────────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-80 z-50 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium flex items-center gap-2"
          style={{ background: toast.ok ? '#4A7C59' : '#C0392B', color: '#fff', direction: 'rtl' }}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />} {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Modal wrapper ──────────────────────────────────────────────────────────────
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

function DetailRow({ label, value, highlight }: { label: React.ReactNode; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: highlight ? '#7F5268' : 'var(--text)' }}>{value}</span>
    </div>
  )
}

// ── Stat & Usage cards ─────────────────────────────────────────────────────────
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
