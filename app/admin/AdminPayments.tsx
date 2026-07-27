'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, Trash2, Check, CircleDollarSign, CalendarClock, Edit2, Calculator } from 'lucide-react'
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

const emptyForm = { id: '', name: '', amount: '', currency: 'ILS', recurrence: 'monthly', due_date: '', notes: '', includeTax: false }

export default function AdminPayments({ initialPayments, onToast }: {
  initialPayments: AdminPayment[]
  onToast: (msg: string, ok?: boolean) => void
}) {
  const [items, setItems] = useState(initialPayments)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isPending, startTransition] = useTransition()

  // ── Global calculator settings (VAT % + USD→ILS rate) ─────────────────────
  const [taxRate, setTaxRate] = useState('18')     // Israeli VAT (מע״מ) 18%
  const [usdRate, setUsdRate] = useState('3.7')    // USD → ILS exchange rate
  const rate = parseFloat(usdRate) || 0
  const taxMult = 1 + (parseFloat(taxRate) || 0) / 100

  const inputSty: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }

  function resetForm() { setForm(emptyForm); setShowForm(false) }

  function openAdd() { setForm(emptyForm); setShowForm(true) }
  function openEdit(p: AdminPayment) {
    setForm({
      id: p.id, name: p.name, amount: String(p.amount), currency: p.currency,
      recurrence: p.recurrence, due_date: p.due_date ?? '', notes: p.notes ?? '',
      includeTax: false,
    })
    setShowForm(true)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    // Store the *gross* amount (incl. VAT) when the checkbox is on, so the saved
    // number already reflects what actually leaves the account.
    const base = parseFloat(form.amount) || 0
    const amount = form.includeTax ? Math.round(base * taxMult * 100) / 100 : base
    const id = form.id || (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`)
    const payment: AdminPayment = {
      id, name: form.name.trim(), amount, currency: form.currency,
      recurrence: form.recurrence, due_date: form.due_date || null,
      paid: form.id ? (items.find(i => i.id === form.id)?.paid ?? false) : false,
      notes: form.notes || null,
    }
    // Optimistic update - no page reload.
    setItems(prev => form.id ? prev.map(x => x.id === id ? payment : x) : [payment, ...prev])
    const editing = !!form.id
    resetForm()
    startTransition(async () => {
      const res = await upsertAdminPayment({
        id, name: payment.name, amount: payment.amount, currency: payment.currency,
        recurrence: payment.recurrence, due_date: payment.due_date ?? undefined,
        paid: payment.paid, notes: payment.notes ?? undefined,
      })
      if (res.ok) onToast(editing ? 'עודכן' : 'נשמר')
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

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toIls = (n: number, cur: string) => (cur === 'USD' ? n * rate : n)
  const fmtIls = (n: number) => `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
  // Monthly-equivalent ILS for a single payment (recurring only; 'once' → 0).
  const monthlyIls = (p: AdminPayment) => {
    if (p.recurrence === 'once') return 0
    const ils = toIls(p.amount, p.currency)
    return p.recurrence === 'yearly' ? ils / 12 : ils
  }

  // ── Grand totals (everything converted to ILS) ────────────────────────────
  const grand = (() => {
    let monthly = 0, onceUnpaid = 0
    for (const i of items) {
      if (i.recurrence === 'once') { if (!i.paid) onceUnpaid += toIls(i.amount, i.currency) }
      else monthly += monthlyIls(i)
    }
    return { monthly, yearly: monthly * 12, onceUnpaid }
  })()

  // ── Live preview for the form being edited ────────────────────────────────
  const preview = (() => {
    const base = parseFloat(form.amount) || 0
    const gross = form.includeTax ? base * taxMult : base
    const ils = form.currency === 'USD' ? gross * rate : gross
    if (form.recurrence === 'once') return { once: ils, monthly: 0, yearly: 0 }
    const monthly = form.recurrence === 'yearly' ? ils / 12 : ils
    return { once: 0, monthly, yearly: monthly * 12 }
  })()

  return (
    <div className="card">
      <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>תשלומים והוצאות</h2>

      {/* ── Grand total in ILS ── */}
      {items.length > 0 && (
        <div className="p-4 rounded-xl border mb-3" style={{ borderColor: '#7F5268', background: 'rgba(127,82,104,0.08)' }}>
          <p className="text-xs mb-2 font-semibold" style={{ color: '#7F5268' }}>
            סה״כ בשקלים · דולר לפי שער {rate}
          </p>
          <div className="space-y-1.5">
            <Row label="חודשי (ממוצע)" value={fmtIls(grand.monthly)} strong />
            <Row label="שנתי" value={fmtIls(grand.yearly)} />
            {grand.onceUnpaid > 0 && <Row label="חד-פעמי שלא שולם" value={fmtIls(grand.onceUnpaid)} />}
          </div>
        </div>
      )}

      {/* ── Exchange-rate setting (affects ILS conversion everywhere) ── */}
      <div className="p-3 rounded-xl border mb-4 flex flex-wrap items-center gap-4"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
        <label className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          שער דולר (1$ =)
          <input type="number" step="0.01" value={usdRate} onChange={e => setUsdRate(e.target.value)}
            className="w-20 px-2 py-1 rounded-lg border text-sm outline-none" style={inputSty} />
          ₪
        </label>
        <label className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          אחוז מע״מ
          <input type="number" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)}
            className="w-16 px-2 py-1 rounded-lg border text-sm outline-none" style={inputSty} />
          %
        </label>
      </div>

      {!showForm && (
        <div className="flex justify-end mb-4">
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#7F5268' }}>
            <Plus className="w-4 h-4" />הוספת תשלום
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={save} className="p-4 rounded-xl mb-4 border space-y-3"
          style={{ borderColor: 'var(--border)', background: 'rgba(127,82,104,0.04)' }}>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
            {form.id ? 'עריכת תשלום' : 'הוספת תשלום'}
          </p>
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

          {/* VAT toggle for THIS payment */}
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text)' }}>
            <input type="checkbox" checked={form.includeTax} onChange={e => setForm(f => ({ ...f, includeTax: e.target.checked }))}
              className="w-4 h-4 accent-[#7F5268]" />
            הסכום שהזנתי הוא לפני מע״מ - הוסיפי {taxRate}% מע״מ
          </label>

          {/* Live calculation preview */}
          {(parseFloat(form.amount) || 0) > 0 && (
            <div className="p-3 rounded-xl border flex flex-wrap items-center gap-x-5 gap-y-1.5"
              style={{ borderColor: '#7F5268', background: 'rgba(127,82,104,0.06)' }}>
              <span className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: '#7F5268' }}>
                <Calculator className="w-3.5 h-3.5" />חישוב
              </span>
              {form.recurrence === 'once' ? (
                <span className="text-sm font-bold" style={{ color: '#7F5268' }}>
                  חד-פעמי: {fmtIls(preview.once)}
                </span>
              ) : (
                <>
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    לחודש: <b style={{ color: '#7F5268' }}>{fmtIls(preview.monthly)}</b>
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text)' }}>
                    לשנה: <b style={{ color: '#7F5268' }}>{fmtIls(preview.yearly)}</b>
                  </span>
                </>
              )}
              {form.currency === 'USD' && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>לפי שער {rate}</span>}
              {form.includeTax && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>כולל מע״מ</span>}
            </div>
          )}

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
            <button onClick={() => togglePaid(p)} title={p.paid ? 'שולם' : 'סמני כשולם'}
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
                {p.recurrence !== 'once' && (
                  <span className="text-xs font-medium" style={{ color: '#7F5268' }}>
                    ≈ {fmtIls(monthlyIls(p))} לחודש
                  </span>
                )}
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
            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg shrink-0"
              style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268' }}>
              <Edit2 className="w-3.5 h-3.5" />
            </button>
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
