'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2, KeyRound, Heart, ChevronLeft } from 'lucide-react'

type Mode = 'login' | 'signup' | 'forgot'

// ─── Hebrew error translations ────────────────────────────────
function translateError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'כתובת מייל או סיסמא שגויים'
  if (m.includes('email not confirmed'))
    return 'המייל עדיין לא אושר — בדקי את תיבת הדואר ולחצי על קישור האישור'
  if (m.includes('user already registered') || m.includes('already been registered') || m.includes('already registered'))
    return 'כתובת המייל הזו כבר רשומה במערכת — נסי להיכנס במקום להירשם'
  if (m.includes('password should be at least'))
    return 'הסיסמא חייבת להכיל לפחות 6 תווים'
  if (m.includes('unable to validate email'))
    return 'כתובת מייל לא תקינה'
  if (m.includes('signup is disabled'))
    return 'ההרשמה מושבתת כרגע'
  if (m.includes('rate limit') || m.includes('too many') || m.includes('over_email') || m.includes('email rate limit'))
    return 'הגבלת שליחת מיילים — נסי שוב בעוד שעה, או פני לעידית לקבלת קישור כניסה ישיר'
  if (m.includes('provider is not enabled') || m.includes('oauth'))
    return 'כניסה עם Google אינה מוגדרת עדיין — השתמשי בכניסה עם מייל וסיסמא'
  return msg
}

export default function AuthPage() {
  const [mode, setMode]       = useState<Mode>('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]     = useState('')
  const [info, setInfo]       = useState('')   // blue / neutral messages
  const [success, setSuccess] = useState('')   // green messages
  const router   = useRouter()
  const supabase = createClient()

  // Handle error param from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error')) {
      setError('הכניסה עם Google נכשלה — נסי שוב, או השתמשי בכניסה עם מייל')
    }
  }, [])

  function switchMode(m: Mode) {
    setMode(m); setError(''); setInfo(''); setSuccess('')
  }

  // ── Email / Password submit ──────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setInfo(''); setSuccess('')

    if (mode === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      })
      if (err) {
        setError(translateError(err.message))
      } else if (data.session) {
        // Email confirmation disabled → logged in immediately
        router.push('/dashboard')
        return
      } else {
        // Email confirmation required
        setSuccess('החשבון נוצר! נשלח אליך מייל אישור — לחצי על הקישור שם כדי להפעיל את החשבון. אם לא מגיע, בדקי תיקיית ספאם.')
        switchMode('login')
      }

    } else if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError(translateError(err.message))
        // If email not confirmed — offer to resend
        if (err.message.toLowerCase().includes('email not confirmed')) {
          setInfo('לא קיבלת מייל אישור? לחצי כאן לשליחה מחדש')
        }
      } else {
        router.push('/dashboard')
        return
      }

    } else if (mode === 'forgot') {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      })
      if (err) {
        setError(translateError(err.message))
      } else {
        setSuccess(`נשלח לך קישור לאיפוס סיסמא לכתובת ${email} — בדקי גם בתיקיית הספאם`)
        switchMode('login')
      }
    }

    setLoading(false)
  }

  // ── Resend confirmation email ────────────────────────────────
  async function resendConfirmation() {
    if (!email) { setError('הכניסי את כתובת המייל שלך ואז לחצי שוב'); return }
    const { error: err } = await supabase.auth.resend({ type: 'signup', email })
    if (err) setError(translateError(err.message))
    else setSuccess('קישור אישור נשלח מחדש — בדקי את תיבת הדואר')
    setInfo('')
  }

  // ── Google OAuth ─────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (err) { setError(translateError(err.message)); setGoogleLoading(false) }
  }

  const inputCls = "w-full py-3 rounded-xl border text-sm outline-none transition-all focus:border-current"
  const inputSty: React.CSSProperties = {
    borderColor: 'var(--border)',
    background: 'var(--surface-2, #FAF4ED)',
    color: 'var(--text)',
  }

  const titles: Record<Mode, string> = {
    login:  'ברוכה הבאה',
    signup: 'יוצרים חשבון',
    forgot: 'איפוס סיסמא',
  }
  const subtitles: Record<Mode, string> = {
    login:  'כיף שחזרת!',
    signup: 'בואי נתחיל יחד',
    forgot: 'נשלח לך קישור לאיפוס',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F7EDE2' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/logo.svg" alt="אמא בסדר" width={28} height={46} className="mx-auto mb-3" />
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>אמא בסדר</h1>
          <p className="text-sm font-light mt-1" style={{ color: 'var(--text-muted)' }}>
            ניהול חכם לאמא המדהימה שבך
          </p>
        </div>

        <div className="rounded-2xl p-7"
          style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(127,82,104,0.08)' }}>

          {/* Mode header */}
          {mode === 'forgot' ? (
            <div className="mb-6">
              <button onClick={() => switchMode('login')}
                className="flex items-center gap-1 text-xs mb-4 hover:opacity-70 transition-opacity"
                style={{ color: 'var(--text-muted)' }}>
                <ArrowRight className="w-3.5 h-3.5" /> חזרה לכניסה
              </button>
              <h2 className="font-bold text-lg flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                <KeyRound className="w-4 h-4" /> {titles.forgot}
              </h2>
              <p className="text-sm font-light mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitles.forgot}</p>
            </div>
          ) : (
            <>
              {/* Tab toggle */}
              <div className="flex rounded-xl p-1 mb-5" style={{ background: 'var(--surface-2, #FAF4ED)' }}>
                {(['login', 'signup'] as const).map(m => (
                  <button key={m} onClick={() => switchMode(m)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={mode === m
                      ? { background: 'var(--purple)', color: '#fff' }
                      : { color: 'var(--text-muted)' }
                    }>
                    {m === 'login' ? 'כניסה' : 'הרשמה'}
                  </button>
                ))}
              </div>

              {/* Google */}
              <button onClick={handleGoogle} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border text-sm font-medium mb-4 hover:opacity-80 transition-opacity disabled:opacity-50"
                style={{ borderColor: 'var(--border)', background: '#fff', color: 'var(--text)' }}>
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
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="שם מלא" required
                className={`${inputCls} px-4`} style={inputSty} />
            )}

            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="כתובת מייל" required
                className={`${inputCls} pr-10 pl-4`} style={inputSty} />
            </div>

            {mode !== 'forgot' && (
              <div className="relative">
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="סיסמא (לפחות 6 תווים)" required minLength={6}
                  className={`${inputCls} pr-10 pl-10`} style={inputSty} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  {showPass
                    ? <EyeOff className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                    : <Eye    className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                  }
                </button>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="text-xs px-3 py-2.5 rounded-xl" style={{ background: '#FEF2F2', color: '#C0392B', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}
            {info && (
              <button type="button" onClick={resendConfirmation}
                className="text-xs px-3 py-2.5 rounded-xl w-full flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="flex-1 text-right">{info}</span>
                <ChevronLeft className="w-3.5 h-3.5 flex-shrink-0" />
              </button>
            )}
            {success && (
              <div className="text-xs px-3 py-2.5 rounded-xl flex items-start gap-2"
                style={{ background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-brand w-full justify-center py-3 disabled:opacity-60">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login'  ? 'כניסה' :
               mode === 'signup' ? 'יצירת חשבון' : 'שליחת קישור לאיפוס'}
              {!loading && <ArrowSvg />}
            </button>
          </form>

          {/* Forgot password link */}
          {mode === 'login' && (
            <button onClick={() => switchMode('forgot')}
              className="w-full text-center text-xs mt-4 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-muted)' }}>
              לא מצליחה להיכנס? <span style={{ color: 'var(--purple)', fontWeight: 600 }}>שחזרי סיסמא</span>
            </button>
          )}

          {/* Switch between login/signup */}
          {mode === 'signup' && (
            <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              כבר יש לך חשבון?{' '}
              <button onClick={() => switchMode('login')}
                className="font-semibold hover:opacity-70 transition-opacity"
                style={{ color: 'var(--purple)' }}>
                כניסה
              </button>
            </p>
          )}
        </div>

        <p className="text-center text-xs mt-5 font-light flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
          כל כך גאים בך — ממשיכה לנהל, לצמוח ולאהוב <Heart className="w-3 h-3" fill="currentColor" style={{ color: 'var(--purple, #7F5268)' }} />
        </p>
      </div>
    </div>
  )
}

function ArrowSvg() {
  return (
    <svg width="24" height="14" viewBox="0 0 36 21" fill="none" aria-hidden="true">
      <path d="M12 0C12 1.113 10.9005 2.775 9.7875 4.17C8.3565 5.97 6.6465 7.5405 4.686 8.739C3.216 9.6375 1.434 10.5 0 10.5M0 10.5C1.434 10.5 3.2175 11.3625 4.686 12.261C6.6465 13.461 8.3565 15.0315 9.7875 16.8285C10.9005 18.225 12 19.89 12 21M0 10.5H36"
        stroke="rgba(230,230,230,0.8)" strokeWidth="1.5" />
    </svg>
  )
}
