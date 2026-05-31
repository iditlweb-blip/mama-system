'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword]     = useState('')
  const [confirm, setConfirm]       = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase sends hash params like #access_token=...&type=recovery
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
  }, [supabase])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return }
    if (password.length < 6)  { setError('הסיסמא חייבת להכיל לפחות 6 תווים'); return }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      setError('שגיאה בעדכון הסיסמא — נסי לבקש קישור איפוס חדש')
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    }
    setLoading(false)
  }

  const inputCls = "w-full py-3 rounded-xl border text-sm outline-none transition-all"
  const inputSty: React.CSSProperties = {
    borderColor: 'var(--border)',
    background: 'var(--surface-2, #FAF4ED)',
    color: 'var(--text)',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F7EDE2' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="אמא בסדר" width={28} height={46} className="mx-auto mb-3" />
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>אמא בסדר</h1>
        </div>

        <div className="rounded-2xl p-7"
          style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(127,82,104,0.08)' }}>

          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#4A7C59' }} />
              <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>הסיסמא עודכנה!</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>מעבירה אותך לדשבורד...</p>
            </div>
          ) : (
            <>
              <h2 className="font-bold text-lg mb-1" style={{ color: 'var(--text)' }}>סיסמא חדשה 🔑</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>בחרי סיסמא חדשה לחשבון שלך</p>

              <form onSubmit={handleReset} className="space-y-3">
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="סיסמא חדשה" required minLength={6}
                    className={`${inputCls} pr-10 pl-10`} style={inputSty} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    {showPass
                      ? <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                      : <Eye    className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    }
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  <input type={showPass ? 'text' : 'password'} value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="אישור סיסמא" required minLength={6}
                    className={`${inputCls} pr-10 pl-4`} style={inputSty} />
                </div>

                {error && (
                  <div className="text-xs px-3 py-2.5 rounded-xl"
                    style={{ background: '#FEF2F2', color: '#C0392B', border: '1px solid #FECACA' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="btn-brand w-full justify-center py-3 disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'מעדכנת...' : 'עדכון סיסמא'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
