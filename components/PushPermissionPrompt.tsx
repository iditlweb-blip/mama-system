'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { isPushSupported, subscribeToPush } from '@/lib/pushClient'

// Asked once per DEVICE (localStorage, not per-account - a push subscription
// is tied to this specific browser, so a mother using two phones should be
// asked on each one) on first entry to the app. Skipped entirely when push
// isn't supported (e.g. iOS Safari outside an installed PWA) or the user
// already made a choice on this device.
export default function PushPermissionPrompt() {
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) return
    if (Notification.permission !== 'default') return
    try { if (localStorage.getItem('pushPrompted')) return } catch { /* ignore */ }
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    try { localStorage.setItem('pushPrompted', '1') } catch { /* ignore */ }
    setVisible(false)
  }

  async function enable() {
    setBusy(true)
    await subscribeToPush()
    setBusy(false)
    dismiss()
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9997, background: 'rgba(30,20,26,0.45)',
      backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div dir="rtl" style={{
        background: 'var(--surface, #fff)', borderRadius: 20, padding: 24,
        maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(127,82,104,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={24} color="#7F5268" strokeWidth={1.8} />
          </div>
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text, #3a1e2d)' }}>
          רוצה תזכורות ישירות לטלפון?
        </h2>
        <p style={{ margin: '0 0 18px', fontSize: '0.85rem', color: 'var(--text-muted, #8a7680)', lineHeight: 1.6 }}>
          נשלח לך התראה על משימות שקבעת, בדיקות הריון שעומדות להסתיים, ותנומה שנמשכת הרבה זמן - גם כשהאפליקציה סגורה.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={enable} disabled={busy} style={{
            flex: 1, padding: '13px 10px', borderRadius: 14, cursor: 'pointer',
            background: '#7F5268', border: 'none', color: '#fff', fontSize: '0.95rem', fontWeight: 700,
            fontFamily: 'var(--font-body)', opacity: busy ? 0.7 : 1,
          }}>
            {busy ? 'רגע...' : 'הפעלת התראות'}
          </button>
          <button onClick={dismiss} disabled={busy} style={{
            flex: 1, padding: '13px 10px', borderRadius: 14, cursor: 'pointer',
            background: 'transparent', border: '1.5px solid rgba(127,82,104,0.25)', color: 'var(--text-muted, #8a7680)',
            fontSize: '0.95rem', fontWeight: 600, fontFamily: 'var(--font-body)',
          }}>
            לא עכשיו
          </button>
        </div>
      </div>
    </div>
  )
}
