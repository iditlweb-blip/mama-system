'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Loader2 } from 'lucide-react'
import { postQuestion } from './actions'

export default function AskQuestionForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', category: '' })
  const [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  // Shared pill used for both the logged-out and collapsed states so the button
  // looks identical to the Figma regardless of auth.
  const pill: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 9, background: '#7F5268', color: '#fff',
    borderRadius: 999, padding: '13px 30px', fontSize: '1rem', fontWeight: 600,
    border: 'none', cursor: 'pointer', textDecoration: 'none',
  }

  // Not signed in: the pill routes to login (posting requires an account).
  if (!isLoggedIn) {
    return (
      <Link href="/auth?next=/community" style={pill}>
        שאלי שאלה חדשה
        <Plus style={{ width: 19, height: 19 }} />
      </Link>
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('צריך לכתוב שאלה'); return }
    startTransition(async () => {
      const res = await postQuestion({ title: form.title, body: form.body || undefined, category: form.category || undefined, anonymous })
      if (!res.ok) { setError(res.error ?? 'שגיאה'); return }
      setForm({ title: '', body: '', category: '' })
      setAnonymous(false)
      setOpen(false)
      if (res.id) router.push(`/community/${res.id}`)
      else router.refresh()
    })
  }

  const inputSty: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 12,
    border: '1px solid rgba(127,82,104,0.2)', background: '#fff', color: '#3a1e2d',
    fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit',
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={pill}>
        שאלי שאלה חדשה
        <Plus style={{ width: 19, height: 19 }} />
      </button>
    )
  }

  return (
    <form onSubmit={submit} style={{ width: '100%', maxWidth: 560, textAlign: 'right', background: '#fff', borderRadius: 16, border: '1px solid rgba(127,82,104,0.12)', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        placeholder="מה השאלה שלך? *" style={inputSty} autoFocus />
      <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
        placeholder="פרטים נוספים (אופציונלי)" rows={4} style={{ ...inputSty, resize: 'vertical' }} />
      <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
        placeholder="נושא (למשל: שינה, הנקה)" style={inputSty} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: '#6b5560', cursor: 'pointer' }}>
        <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)}
          style={{ width: 17, height: 17, accentColor: '#7F5268', cursor: 'pointer' }} />
        לפרסם כאנונימית (השם ותמונת הפרופיל שלך לא יוצגו)
      </label>
      {error && <p style={{ color: '#C0392B', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={isPending}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#7F5268', color: '#fff', borderRadius: 12, padding: '9px 22px', fontSize: '0.9rem', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>
          {isPending && <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />}פרסום
        </button>
        <button type="button" onClick={() => { setOpen(false); setError('') }}
          style={{ background: 'transparent', color: '#6b5560', borderRadius: 12, padding: '9px 20px', fontSize: '0.9rem', border: '1px solid rgba(127,82,104,0.2)', cursor: 'pointer' }}>
          ביטול
        </button>
      </div>
    </form>
  )
}
