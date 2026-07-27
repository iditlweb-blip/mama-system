'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { setActiveParent, getActiveParent, PARENT_LABEL, PARENT_COLOR, type Parent } from '@/lib/activeParent'

// Asked once per browser session when the app opens: who is logging right now?
// Skipped entirely when the mother set a fixed parent in settings, or turned
// the popup off. "תמיד" saves the choice to the profile so it never asks again.
export default function ParentPopup({ userId, defaultParent, showPopup }: {
  userId: string
  defaultParent: Parent | null
  showPopup: boolean
}) {
  const supabase = createClient()
  const [visible, setVisible] = useState(false)
  const [always, setAlways] = useState(false)

  useEffect(() => {
    // A fixed parent from settings always wins - apply it and never ask.
    if (defaultParent) { setActiveParent(defaultParent); return }
    if (!showPopup) return
    try { if (sessionStorage.getItem('parentAsked')) return } catch { /* ignore */ }
    // Already chosen on this device earlier in the session? don't nag.
    if (getActiveParent()) { /* still ask once per session so it stays correct */ }
    setVisible(true)
  }, [defaultParent, showPopup])

  async function choose(p: Parent) {
    setActiveParent(p)
    try { sessionStorage.setItem('parentAsked', '1') } catch { /* ignore */ }
    setVisible(false)
    if (always) await supabase.from('profiles').update({ default_parent: p }).eq('id', userId)
  }

  function skip() {
    setActiveParent(null)
    try { sessionStorage.setItem('parentAsked', '1') } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(30,20,26,0.45)',
      backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div dir="rtl" style={{
        background: 'var(--surface, #fff)', borderRadius: 20, padding: 24,
        maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center',
      }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text, #3a1e2d)' }}>
          מי מתעד/ת עכשיו?
        </h2>
        <p style={{ margin: '0 0 18px', fontSize: '0.82rem', color: 'var(--text-muted, #8a7680)' }}>
          כל רישום יסומן בצבע לפי מי שתיעד אותו
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          {(['mom', 'dad'] as const).map(p => (
            <button key={p} onClick={() => choose(p)} style={{
              flex: 1, padding: '14px 10px', borderRadius: 14, cursor: 'pointer',
              background: PARENT_COLOR[p].bg, border: `1.5px solid ${PARENT_COLOR[p].border}`,
              color: PARENT_COLOR[p].text, fontSize: '1rem', fontWeight: 700,
              fontFamily: 'var(--font-body)',
            }}>
              {PARENT_LABEL[p]}
            </button>
          ))}
        </div>

        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          marginTop: 14, fontSize: '0.78rem', color: 'var(--text-muted, #8a7680)', cursor: 'pointer',
        }}>
          <input type="checkbox" checked={always} onChange={e => setAlways(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: '#7F5268' }} />
          זכור את הבחירה ואל תשאל/י שוב
        </label>

        <button onClick={skip} style={{
          marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '0.78rem', color: 'var(--text-muted, #8a7680)', fontFamily: 'var(--font-body)',
          textDecoration: 'underline',
        }}>
          דלגי - בלי לציין
        </button>
      </div>
    </div>
  )
}
