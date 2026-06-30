'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface Props {
  onClose: () => void
}

export default function GaveBirthModal({ onClose }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    birth_date: new Date().toISOString().split('T')[0],
    baby_name: '',
    baby_gender: '' as 'boy' | 'girl' | '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.baby_gender) { setError('אנא בחרי מין תינוק/ת'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: err } = await supabase.from('profiles').update({
      has_given_birth:   true,
      birth_date:        form.birth_date || null,
      birth_baby_name:   form.baby_name || null,
      birth_baby_gender: form.baby_gender,
      tracking_type:     'baby',
      baby_birthdate:    form.birth_date || null,
      baby_name:         form.baby_name || null,
      baby_gender:       form.baby_gender,
    }).eq('id', user.id)

    setLoading(false)
    if (err) { setError('שגיאה בשמירה, נסי שוב'); return }

    router.refresh()
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        fontFamily: 'var(--font-body)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 24,
          padding: 'clamp(24px,4vw,40px)',
          maxWidth: 400,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          direction: 'rtl',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <h2 style={{ color: '#7F5268', fontSize: '1.4rem', fontWeight: 700, margin: 0, letterSpacing: '0.04em' }}>
            מזל טוב!
          </h2>
          <p style={{ color: '#888', fontSize: '0.9rem', marginTop: 6, lineHeight: 1.5 }}>
            ספרי לנו על התינוק/ת החדש/ה שלך
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Birth date */}
          <div>
            <label style={{ display: 'block', color: '#7F5268', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
              תאריך לידה
            </label>
            <input
              type="date"
              value={form.birth_date}
              onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid rgba(127,82,104,0.3)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: '0.95rem', color: '#3a1e2d',
                outline: 'none', background: '#fafafa',
                direction: 'rtl',
              }}
            />
          </div>

          {/* Baby name */}
          <div>
            <label style={{ display: 'block', color: '#7F5268', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
              שם התינוק/ת
            </label>
            <input
              type="text"
              placeholder="למשל: רוני"
              value={form.baby_name}
              onChange={e => setForm(f => ({ ...f, baby_name: e.target.value }))}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid rgba(127,82,104,0.3)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: '0.95rem', color: '#3a1e2d',
                outline: 'none', background: '#fafafa',
              }}
            />
          </div>

          {/* Gender */}
          <div>
            <label style={{ display: 'block', color: '#7F5268', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
              מין
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { value: 'girl', label: '👧 בת' },
                { value: 'boy',  label: '👦 בן' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, baby_gender: opt.value as 'boy' | 'girl' }))}
                  style={{
                    flex: 1, padding: '12px 8px',
                    borderRadius: 12,
                    border: form.baby_gender === opt.value
                      ? '2px solid #7F5268'
                      : '1.5px solid rgba(127,82,104,0.2)',
                    background: form.baby_gender === opt.value
                      ? 'rgba(127,82,104,0.06)'
                      : '#fafafa',
                    color: form.baby_gender === opt.value ? '#7F5268' : '#888',
                    fontSize: '1rem', fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ color: '#C0392B', fontSize: '0.82rem', margin: 0 }}>{error}</p>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: '13px',
                background: '#7F5268', color: '#fff',
                border: 'none', borderRadius: 14,
                fontSize: '1rem', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.03em',
              }}
            >
              {loading ? '...שומרת' : 'שמירה ✓'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '13px',
                background: 'transparent', color: '#888',
                border: '1.5px solid #ddd', borderRadius: 14,
                fontSize: '1rem', cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
