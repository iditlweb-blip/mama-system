'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Send } from 'lucide-react'
import { postAnswer } from './actions'

export default function AnswerForm({ questionId, isLoggedIn, basePath = '/community' }: { questionId: string; isLoggedIn: boolean; basePath?: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  if (!isLoggedIn) {
    return (
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(127,82,104,0.12)', padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#6b5560', fontSize: '0.92rem' }}>רוצה לענות? התחברי כדי להשתתף.</span>
        <Link href={`/auth?next=${basePath}/${questionId}`} style={{ background: '#7F5268', color: '#fff', borderRadius: 18, padding: '7px 18px', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
          כניסה
        </Link>
      </div>
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!body.trim()) { setError('צריך לכתוב תשובה'); return }
    startTransition(async () => {
      const res = await postAnswer({ questionId, body, anonymous })
      if (!res.ok) { setError(res.error ?? 'שגיאה'); return }
      setBody('')
      setAnonymous(false)
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="כתבי תשובה תומכת..." rows={4}
        style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(127,82,104,0.2)', background: '#fff', color: '#3a1e2d', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', color: '#6b5560', cursor: 'pointer' }}>
        <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)}
          style={{ width: 16, height: 16, accentColor: '#7F5268', cursor: 'pointer' }} />
        לענות כאנונימית
      </label>
      {error && <p style={{ color: '#C0392B', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
      <button type="submit" disabled={isPending}
        style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#7F5268', color: '#fff', borderRadius: 12, padding: '9px 22px', fontSize: '0.9rem', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>
        {isPending ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> : <Send style={{ width: 15, height: 15 }} />}
        פרסום תשובה
      </button>
    </form>
  )
}
