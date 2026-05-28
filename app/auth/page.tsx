'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode]           = useState<'login' | 'signup'>('login')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [name, setName]           = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const router   = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      })
      if (error) setError(error.message)
      else setSuccess('✓ נרשמת בהצלחה — נכנסת עכשיו...')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('כתובת מייל או סיסמא שגויים')
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  const inputClass = "w-full py-3 rounded-xl border text-sm outline-none transition-all"
  const inputStyle: React.CSSProperties = {
    borderColor: 'var(--border)',
    background: 'var(--surface-2, #FAF4ED)',
    color: 'var(--text)',
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#F7EDE2' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo + brand */}
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="MamaFlow" width={28} height={46} className="mx-auto mb-3" />
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>MamaFlow</h1>
          <p className="text-sm font-light mt-1" style={{ color: 'var(--text-muted)' }}>
            ניהול חכם לאמא המדהימה שבך
          </p>
        </div>

        <div
          className="rounded-2xl p-7"
          style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(127,82,104,0.08)' }}
        >
          {/* Tab toggle */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: 'var(--surface-2, #FAF4ED)' }}
          >
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={mode === m
                  ? { background: 'var(--purple)', color: '#fff' }
                  : { color: 'var(--text-muted)' }
                }
              >
                {m === 'login' ? 'כניסה' : 'הרשמה'}
              </button>
            ))}
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border text-sm font-medium mb-4 hover:opacity-80 transition-opacity disabled:opacity-50"
            style={{ borderColor: 'var(--border)', background: '#fff', color: 'var(--text)' }}
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {mode === 'login' ? 'כניסה עם Google' : 'הרשמה עם Google'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>או</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="שם מלא"
                required
                className={`${inputClass} px-4`}
                style={inputStyle}
              />
            )}

            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="כתובת מייל"
                required
                className={`${inputClass} pr-10 pl-4`}
                style={inputStyle}
              />
            </div>

            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="סיסמא"
                required
                minLength={6}
                className={`${inputClass} pr-10 pl-10`}
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute left-3.5 top-1/2 -translate-y-1/2">
                {showPass
                  ? <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  : <Eye    className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                }
              </button>
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#FEE2E2', color: '#C0392B' }}>
                {error}
              </p>
            )}
            {success && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#DCFCE7', color: '#15803D' }}>
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-brand w-full justify-center py-3 disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'כניסה' : 'יצירת חשבון'}
              {!loading && <ArrowIcon />}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5 font-light" style={{ color: 'var(--text-muted)' }}>
          כל כך גאים בך — ממשיכה לנהל, לצמוח ולאהוב 💜
        </p>
      </div>
    </div>
  )
}

function ArrowIcon() {
  return (
    <svg width="24" height="14" viewBox="0 0 36 21" fill="none" aria-hidden="true">
      <path
        d="M12 0C12 1.113 10.9005 2.775 9.7875 4.17C8.3565 5.97 6.6465 7.5405 4.686 8.739C3.216 9.6375 1.434 10.5 0 10.5M0 10.5C1.434 10.5 3.2175 11.3625 4.686 12.261C6.6465 13.461 8.3565 15.0315 9.7875 16.8285C10.9005 18.225 12 19.89 12 21M0 10.5H36"
        stroke="rgba(230,230,230,0.8)"
        strokeWidth="1.5"
      />
    </svg>
  )
}
