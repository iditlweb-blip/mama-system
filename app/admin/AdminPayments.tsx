'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, Trash2, Check, CircleDollarSign, CalendarClock } from 'lucide-react'
import { upsertAdminPayment, deleteAdminPayment } from './actions'

export interface AdminPayment {
  id: string
  name: string
  amount: number
  currency: string
  recurrence: string
  due_date: string | null
  paid: boolean
  notes: string | null
}

const RECUR_LABEL: Record<string, string> = { monthly: 'חודשי', yearly: 'שנתי', once: 'חד-פעמי' }
const CUR_SYMBOL: Record<string, string> = { ILS: '₪', USD: '$' }

export default function AdminPayments({ initialPayments, onToast }: {
  initialPayments: AdminPayment[]
  onToast: (msg: string, ok?: boolean) => void
}) {
  const [items, setItems] = useState(initialPayments)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', currency: 'ILS', recurrence: 'monthly', due_date: '', notes: '' })
  const [isPending, startTransition] = useTransition()

  const inputSty: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }

  function resetForm() {
    setForm({ name: '', amount: '', currency: 'ILS', recurrence: 'monthly', due_date: '', notes: '' })
    setShowForm(false)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    startTransition(async () => {
      const res = await upsertAdminPayment({
        name: form.name.trim(), amount: parseFloat(form.amount) || 0, currency: form.currency,
        recurrence: form.recurrence, due_date: form.due_date || undefined, notes: form.notes || undefined,
      })
      if (res.ok) { onToast('נשמר'); resetForm(); window.location.reload() }
      else onToast(res.error ?? 'שגיאה', false)
    })
  }

  function togglePaid(p: AdminPayment) {
    const paid = !p.paid
    setItems(prev => prev.map(x => x.id === p.id ? { ...x, paid } : x))
    startTransition(async () => {
      const res = await upsertAdminPayment({
        id: p.id, name: p.name, amount: p.amount, currency: p.currency,
        recurrence: p.recurrence, due_date: p.due_date ?? undefined, paid, notes: p.notes ?? undefined,
      })
      if (!res.ok) onToast(res.error ?? 'שגיאה', false)
    })
  }

  function remove(p: AdminPayment) {
    if (!confirm(`למחוק את "${p.name}"?`)) return
    startTransition(async () => {
      const res = await deleteAdminPayment(p.id)
      if (res.ok) { setItems(prev => prev.filter(x => x.id !== p.id)); onToast('נמחק') }
      else onToast(res.error ?? 'שגיאה', false)
    })
  }

  // ── Calculator: monthly-equivalent & yearly totals, per currency ──────────
  function totals(currency: string) {
    const rows = items.filter(i => i.currency === currency && i.recurrence !== 'once')
    let monthly = 0
    for (const r of rows) monthly += r.recurrence === 'yearly' ? r.amount / 12 : r.amount
    const onceUnpaid = items
      .filter(i => i.currency === currency && i.recurrence === 'once' && !i.paid)
      .reduce((s, i) => s + i.amount, 0)
    return { monthly, yearly: monthly * 12, onceUnpaid }
  }
  const currencies = Array.from(new Set(items.map(i => i.currency)))
  const fmt = (n: number, cur: string) => `${CUR_SYMBOL[cur] ?? ''}${n.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`

  return (
    <div className="card">
      <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>תשלומים והוצאות</h2>

      {/* ── Calculator summary ── */}
      {currencies.length === 0 ? null : (
        <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `repeat(${Math.min(currencies.length, 2)}, minmax(0,1fr))` }}>
          {currencies.map(cur => {
            const t = totals(cur)
            return (
              <div key={cur} className="p-4 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'rgba(127,82,104,0.04)' }}>
                <p className="text-xs mb-2 font-semibold" style={{ color: '#7F5268' }}>סיכום ({cur})</p>
                <div className="space-y-1.5">
                  <Row label="חודשי (ממוצע)" value={fmt(t.monthly, cur)} strong />
                  <Row label="שנתי" value={fmt(t.yearly, cur)} />
                  {t.onceUnpaid > 0 && <Row label="חד-פעמי שלא שולם" value={fmt(t.onceUnpaid, cur)} />}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex justify-end mb-4">
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#7F5268' }}>
          <Plus className="w-4 h-4" />הוספת תשלום
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="p-4 rounded-xl mb-4 border space-y-3"
          style={{ borderColor: 'var(--border)', background: 'rgba(127,82,104,0.04)' }}>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="שם ההוצאה (Vercel, דומיין...) *" required
              className="col-span-2 px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
            <input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="סכום"
              className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty}>
              <option value="ILS">₪ שקל</option>
              <option value="USD">$ דולר</option>
            </select>
            <select value={form.recurrence} onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}
              className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty}>
              <option value="monthly">חודשי</option>
              <option value="yearly">שנתי</option>
              <option value="once">חד-פעמי</option>
            </select>
            <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="הערה (אופציונלי)"
              className="col-span-2 px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
              style={{ background: '#7F5268' }}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}שמירה
            </button>
            <button type="button" onClick={resetForm}
              className="px-5 py-2 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>ביטול</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>אין תשלומים עדיין</p>
        ) : items.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ borderColor: 'var(--border)', opacity: p.paid ? 0.6 : 1 }}>
            <button onClick={() => togglePaid(p)} title={p.paid ? 'שולם' : 'סמן כשולם'}
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
              style={p.paid
                ? { background: '#4A7C59', borderColor: '#4A7C59', color: '#fff' }
                : { borderColor: 'var(--border)', color: 'transparent' }}>
              <Check className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{p.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{RECUR_LABEL[p.recurrence]}</span>
                {p.due_date && (
                  <span className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <CalendarClock className="w-3 h-3" />{new Date(p.due_date).toLocaleDateString('he-IL')}
                  </span>
                )}
                {p.notes && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>· {p.notes}</span>}
              </div>
            </div>
            <span className="text-sm font-bold shrink-0 inline-flex items-center gap-1" style={{ color: '#7F5268' }}>
              <CircleDollarSign className="w-3.5 h-3.5" />
              {CUR_SYMBOL[p.currency] ?? ''}{p.amount.toLocaleString('he-IL', { maximumFractionDigits: 2 })}
            </span>
            <button onClick={() => remove(p)} className="p-1.5 rounded-lg shrink-0"
              style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className={strong ? 'text-base font-bold' : 'text-sm font-medium'} style={{ color: strong ? '#7F5268' : 'var(--text)' }}>{value}</span>
    </div>
  )
}
