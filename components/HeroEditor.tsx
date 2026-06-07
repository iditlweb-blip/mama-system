'use client'

import { useState, useCallback, useRef } from 'react'

// ──────────────────────────────────────────────────────────────────────────────
// Floating live-editor — only renders in development mode.
// Drag it anywhere. Adjust sliders → see hero changes instantly.
// When happy, copy the values shown at the bottom and send to Claude.
// ──────────────────────────────────────────────────────────────────────────────

type Vals = {
  h1Size: number        // rem  (desktop)
  subtitleSize: number  // rem
  displaySize: number   // vw
  displayBottom: number // %
  imageTop: number      // %
  imageWidth: number    // %  (mobile: always 88)
  logoSize: number      // px height
}

const DEFAULTS: Vals = {
  h1Size:       2.7,
  subtitleSize: 1.1,
  displaySize:  12,
  displayBottom: 15,
  imageTop:     6,
  imageWidth:   52,
  logoSize:     52,
}

declare global {
  interface Window { __heroVals?: Vals }
}

export default function HeroEditor() {
  if (process.env.NODE_ENV !== 'development') return null

  return <EditorInner />
}

function EditorInner() {
  const [open, setOpen]   = useState(true)
  const [vals, setVals]   = useState<Vals>(DEFAULTS)
  const [pos, setPos]     = useState({ x: 16, y: 80 })
  const dragging = useRef(false)
  const offset   = useRef({ x: 0, y: 0 })

  const set = useCallback((key: keyof Vals, v: number) => {
    setVals(prev => {
      const next = { ...prev, [key]: v }
      applyToDOM(next)
      window.__heroVals = next
      return next
    })
  }, [])

  function onMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
  function onMouseMove(e: MouseEvent) {
    if (!dragging.current) return
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y })
  }
  function onMouseUp() {
    dragging.current = false
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  const sliders: { key: keyof Vals; label: string; min: number; max: number; step: number; unit: string }[] = [
    { key: 'h1Size',        label: 'כותרת ראשית',    min: 1.2, max: 4,   step: 0.05, unit: 'rem' },
    { key: 'subtitleSize',  label: 'כותרת משנה',     min: 0.7, max: 1.8, step: 0.05, unit: 'rem' },
    { key: 'displaySize',   label: '"אמא בסדר" גודל', min: 5,   max: 18,  step: 0.5,  unit: 'vw'  },
    { key: 'displayBottom', label: '"אמא בסדר" גובה', min: 5,   max: 30,  step: 0.5,  unit: '%'   },
    { key: 'imageTop',      label: 'תמונה — ירידה',   min: 0,   max: 20,  step: 0.5,  unit: '%'   },
    { key: 'imageWidth',    label: 'תמונה — רוחב',    min: 30,  max: 100, step: 1,    unit: '%'   },
    { key: 'logoSize',      label: 'לוגו — גובה',     min: 24,  max: 80,  step: 2,    unit: 'px'  },
  ]

  const prompt = `
h1Size: ${vals.h1Size}rem  |  subtitleSize: ${vals.subtitleSize}rem  |  displaySize: ${vals.displaySize}vw
displayBottom: ${vals.displayBottom}%  |  imageTop: ${vals.imageTop}%  |  imageWidth: ${vals.imageWidth}%  |  logoSize: ${vals.logoSize}px
`.trim()

  return (
    <div
      id="hero-editor"
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 280,
        background: 'rgba(18,18,20,0.96)',
        color: '#fff',
        borderRadius: 14,
        zIndex: 9999,
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        userSelect: 'none',
        direction: 'rtl',
      }}
    >
      {/* Header / drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          padding: '10px 14px',
          background: '#7F5268',
          borderRadius: '14px 14px 0 0',
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13 }}>✏️ עורך Hero</span>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
        >
          {open ? '▲' : '▼'}
        </button>
      </div>

      {open && (
        <div style={{ padding: '12px 14px 14px' }}>
          {sliders.map(s => (
            <div key={s.key} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ opacity: 0.8 }}>{s.label}</span>
                <span style={{ color: '#F9A8D4', fontWeight: 700 }}>{vals[s.key]}{s.unit}</span>
              </div>
              <input
                type="range"
                min={s.min} max={s.max} step={s.step}
                value={vals[s.key]}
                onChange={e => set(s.key, parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#7F5268' }}
              />
            </div>
          ))}

          {/* Reset */}
          <button
            onClick={() => { setVals(DEFAULTS); applyToDOM(DEFAULTS) }}
            style={{
              width: '100%',
              padding: '6px',
              background: 'rgba(127,82,104,0.3)',
              border: '1px solid rgba(127,82,104,0.5)',
              color: '#F9A8D4',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 10,
              fontSize: 11,
            }}
          >
            ↺ איפוס לברירת מחדל
          </button>

          {/* Copy prompt */}
          <div
            onClick={() => { navigator.clipboard.writeText(prompt); alert('הועתק! שלחי לClaudeלעדכן') }}
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '8px 10px',
              cursor: 'pointer',
              lineHeight: 1.6,
              fontSize: 10.5,
              wordBreak: 'break-all',
              color: '#a3e635',
            }}
            title="לחצי להעתיק"
          >
            📋 לחצי להעתיק ולשלוח לClaude<br />
            <span style={{ color: '#7dd3fc', fontSize: 10 }}>{prompt}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Apply values directly to DOM elements ─────────────────────────────────────
function applyToDOM(v: Vals) {
  // h1
  const h1 = document.querySelector<HTMLElement>('[data-hero="h1"]')
  if (h1) h1.style.fontSize = `clamp(1.2rem, 3.2vw, ${v.h1Size}rem)`

  // subtitle
  const sub = document.querySelector<HTMLElement>('[data-hero="subtitle"]')
  if (sub) sub.style.fontSize = `clamp(0.8rem, 1.7vw, ${v.subtitleSize}rem)`

  // "אמא בסדר" text
  const display = document.querySelector<HTMLElement>('[data-hero="display-text"]')
  if (display) {
    display.style.fontSize = `clamp(3rem, ${v.displaySize}vw, 10rem)`
  }
  const displayWrap = document.querySelector<HTMLElement>('[data-hero="display-wrap"]')
  if (displayWrap) displayWrap.style.bottom = `clamp(60px, ${v.displayBottom}%, 130px)`

  // image
  const imgWrap = document.querySelector<HTMLElement>('[data-hero="img-wrap"]')
  if (imgWrap) imgWrap.style.top = `${v.imageTop}%`
  const img = document.querySelector<HTMLElement>('[data-hero="img"]')
  if (img) img.style.width = `clamp(200px, ${v.imageWidth}%, 520px)`

  // logo
  const logo = document.querySelector<HTMLElement>('[data-hero="logo"]')
  if (logo) {
    logo.style.height = `${v.logoSize}px`
    logo.style.width = 'auto'
  }
}
