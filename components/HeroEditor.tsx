'use client'

import { useState, useRef, useEffect } from 'react'

// ────────────────────────────────────────────────────────────────────────────
// Floating Hero Editor — dev only (process.env.NODE_ENV === 'development')
// Two tabs: Desktop 🖥️  |  Mobile 📱
// Mobile tab simulates a phone frame (390px) via CSS transform.
// Copy the values panel and send to Claude to bake into code.
// ────────────────────────────────────────────────────────────────────────────

type DeskVals = {
  h1Size: number;        subtitleSize: number;  displaySize: number
  displayBottom: number; imageTop: number;      imageWidth: number
  logoSize: number;      ctaBottom: number
}
type MobVals = {
  h1Size: number;        subtitleSize: number;  displaySize: number
  displayBottom: number; imageTop: number;      imageWidth: number
  ctaBottom: number
}

const DESK_DEF: DeskVals = {
  h1Size: 3.3, subtitleSize: 1.5, displaySize: 12,
  displayBottom: 14.5, imageTop: 3, imageWidth: 60, logoSize: 62, ctaBottom: 2.5,
}
const MOB_DEF: MobVals = {
  h1Size: 1.85, subtitleSize: 0.85, displaySize: 42,
  displayBottom: 21, imageTop: 5, imageWidth: 90, ctaBottom: 2.5,
}

export default function HeroEditor() {
  if (process.env.NODE_ENV !== 'development') return null
  return <EditorPanel />
}

function EditorPanel() {
  const [open, setOpen]       = useState(true)
  const [tab, setTab]         = useState<'desk' | 'mob'>('desk')
  const [simOn, setSimOn]     = useState(false)
  const [pos, setPos]         = useState({ x: 12, y: 80 })
  const [desk, setDesk]       = useState<DeskVals>(DESK_DEF)
  const [mob, setMob]         = useState<MobVals>(MOB_DEF)
  const dragging = useRef(false)
  const offset   = useRef({ x: 0, y: 0 })

  // ── drag ──────────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }
  function onMove(e: MouseEvent) {
    if (!dragging.current) return
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y })
  }
  function onUp() { dragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }

  // ── apply desktop ─────────────────────────────────────────────────────────
  function applyDesk(v: DeskVals) {
    setDesk(v)
    q<HTMLElement>('h1').forEach(el => el.style.fontSize = `clamp(1.4rem, 3.2vw, ${v.h1Size}rem)`)
    q<HTMLElement>('[data-hero="subtitle"]').forEach(el => el.style.fontSize = `clamp(0.8rem, 1.7vw, ${v.subtitleSize}rem)`)
    q<HTMLElement>('[data-hero="display-text"]').forEach(el => el.style.fontSize = `clamp(3rem, ${v.displaySize}vw, 10rem)`)
    q<HTMLElement>('[data-hero="display-wrap"]').forEach(el => el.style.bottom = `clamp(60px, ${v.displayBottom}%, 120px)`)
    q<HTMLElement>('[data-hero="img-wrap"]').forEach(el => el.style.top = `${v.imageTop}%`)
    q<HTMLElement>('[data-hero="img"]').forEach(el => el.style.width = `clamp(200px, ${v.imageWidth}%, 520px)`)
    q<HTMLElement>('[data-hero="logo"]').forEach(el => { el.style.height = `${v.logoSize}px`; el.style.width = 'auto' })
    q<HTMLElement>('[data-hero="cta-wrap"]').forEach(el => el.style.bottom = `clamp(8px, ${v.ctaBottom}%, 32px)`)
  }

  // ── apply mobile (via injected style + optional sim) ─────────────────────
  function applyMob(v: MobVals, sim: boolean) {
    setMob(v)
    let el = document.getElementById('_hedge_mob') as HTMLStyleElement | null
    if (!el) { el = document.createElement('style'); el.id = '_hedge_mob'; document.head.appendChild(el) }

    if (sim) {
      // Apply directly (no media query needed — phone frame is active)
      el.textContent = `
        [data-hero="h1"]           { font-size: ${v.h1Size}rem    !important; white-space: normal !important; }
        [data-hero="subtitle"]     { font-size: ${v.subtitleSize}rem !important; white-space: normal !important; }
        [data-hero="display-text"] { font-size: ${v.displaySize}px !important; }
        [data-hero="display-wrap"] { bottom: clamp(55px, ${v.displayBottom}%, 100px) !important; }
        [data-hero="img-wrap"]     { top: ${v.imageTop}% !important; }
        [data-hero="img"]          { width: ${v.imageWidth}% !important; }
        [data-hero="cta-wrap"]     { bottom: clamp(8px, ${v.ctaBottom}%, 32px) !important; }
        [data-hero="side"]         { opacity: 0.35 !important; }
      `
    } else {
      // Real @media for actual device testing
      el.textContent = `
        @media (max-width: 767px) {
          [data-hero="h1"]           { font-size: ${v.h1Size}rem    !important; white-space: normal !important; }
          [data-hero="subtitle"]     { font-size: ${v.subtitleSize}rem !important; white-space: normal !important; }
          [data-hero="display-text"] { font-size: ${v.displaySize}px !important; }
          [data-hero="display-wrap"] { bottom: clamp(55px, ${v.displayBottom}%, 100px) !important; }
          [data-hero="img-wrap"]     { top: ${v.imageTop}% !important; }
          [data-hero="img"]          { width: ${v.imageWidth}% !important; }
          [data-hero="cta-wrap"]     { bottom: clamp(8px, ${v.ctaBottom}%, 32px) !important; }
          [data-hero="side"]         { opacity: 0.35 !important; }
        }
      `
    }
  }

  // ── phone sim toggle ──────────────────────────────────────────────────────
  useEffect(() => {
    let frame = document.getElementById('_phone_frame') as HTMLStyleElement | null
    if (!frame) { frame = document.createElement('style'); frame.id = '_phone_frame'; document.head.appendChild(frame) }

    if (simOn) {
      // Scale page so it looks like a 390px iPhone inside the browser
      const vw = window.innerWidth
      const vh = window.innerHeight
      const phoneW = 390, phoneH = 844
      const scale  = Math.min((vw - 320) / phoneW, (vh - 60) / phoneH, 1)  // leave room for editor
      const left   = Math.max(300, (vw - phoneW * scale) / 2)

      frame.textContent = `
        body > main, body > div > main {
          position: fixed !important;
          top: ${(vh - phoneH * scale) / 2}px !important;
          left: ${left}px !important;
          width: ${phoneW}px !important;
          height: ${phoneH}px !important;
          transform: scale(${scale}) !important;
          transform-origin: top left !important;
          border-radius: 44px !important;
          box-shadow: 0 0 0 14px #1a1a1a, 0 0 0 16px #444, 0 24px 80px rgba(0,0,0,0.5) !important;
          overflow: hidden !important;
          z-index: 1000 !important;
        }
        body { background: #555 !important; }
        /* Notch */
        body > main::before, body > div > main::before {
          content: '' !important; display: block !important;
          position: absolute !important; top: 8px !important; left: 50% !important;
          transform: translateX(-50%) !important;
          width: 120px !important; height: 32px !important;
          background: #1a1a1a !important; border-radius: 20px !important;
          z-index: 9999 !important;
        }
      `
      // Also apply mobile values directly so they show in simulation
      applyMob(mob, true)
    } else {
      frame.textContent = ''
      // Restore desktop values
      applyDesk(desk)
      // Re-apply mobile via @media
      applyMob(mob, false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simOn])

  // ── slider helpers ────────────────────────────────────────────────────────
  type SliderCfg = { key: string; label: string; min: number; max: number; step: number; unit: string }

  const deskSliders: SliderCfg[] = [
    { key: 'h1Size',        label: 'כותרת ראשית',     min: 1.5, max: 5,   step: 0.05, unit: 'rem' },
    { key: 'subtitleSize',  label: 'כותרת משנה',      min: 0.7, max: 2,   step: 0.05, unit: 'rem' },
    { key: 'displaySize',   label: '"אמא בסדר" גודל',  min: 6,   max: 18,  step: 0.5,  unit: 'vw'  },
    { key: 'displayBottom', label: '"אמא בסדר" גובה',  min: 5,   max: 28,  step: 0.5,  unit: '%'   },
    { key: 'imageTop',      label: 'תמונה ↓',          min: 0,   max: 18,  step: 0.5,  unit: '%'   },
    { key: 'imageWidth',    label: 'תמונה רוחב',       min: 30,  max: 100, step: 1,    unit: '%'   },
    { key: 'logoSize',      label: 'לוגו גובה',        min: 24,  max: 90,  step: 2,    unit: 'px'  },
    { key: 'ctaBottom',     label: 'כפתור גובה',       min: 0,   max: 20,  step: 0.5,  unit: '%'   },
  ]
  const mobSliders: SliderCfg[] = [
    { key: 'h1Size',        label: 'כותרת ראשית',     min: 1,   max: 3,   step: 0.05, unit: 'rem' },
    { key: 'subtitleSize',  label: 'כותרת משנה',      min: 0.6, max: 1.5, step: 0.05, unit: 'rem' },
    { key: 'displaySize',   label: '"אמא בסדר" גודל',  min: 20,  max: 80,  step: 1,    unit: 'px'  },
    { key: 'displayBottom', label: '"אמא בסדר" גובה',  min: 4,   max: 25,  step: 0.5,  unit: '%'   },
    { key: 'imageTop',      label: 'תמונה ↓',          min: 0,   max: 15,  step: 0.5,  unit: '%'   },
    { key: 'imageWidth',    label: 'תמונה רוחב',       min: 50,  max: 100, step: 1,    unit: '%'   },
    { key: 'ctaBottom',     label: 'כפתור גובה',       min: 0,   max: 20,  step: 0.5,  unit: '%'   },
  ]

  // ── copy prompt ───────────────────────────────────────────────────────────
  const deskPrompt = `DESKTOP: h1=${desk.h1Size}rem | sub=${desk.subtitleSize}rem | display=${desk.displaySize}vw | displayBottom=${desk.displayBottom}% | imgTop=${desk.imageTop}% | imgW=${desk.imageWidth}% | logo=${desk.logoSize}px`
  const mobPrompt  = `MOBILE:  h1=${mob.h1Size}rem | sub=${mob.subtitleSize}rem | display=${mob.displaySize}px | displayBottom=${mob.displayBottom}% | imgTop=${mob.imageTop}% | imgW=${mob.imageWidth}%`

  function copyAll() {
    navigator.clipboard.writeText(deskPrompt + '\n' + mobPrompt)
    alert('הועתק! שלחי לClaude ⬆️')
  }

  // ── render ────────────────────────────────────────────────────────────────
  const vals    = tab === 'desk' ? desk : mob
  const sliders = tab === 'desk' ? deskSliders : mobSliders

  function handleSlider(key: string, v: number) {
    if (tab === 'desk') {
      const next = { ...desk, [key]: v } as DeskVals
      applyDesk(next)
    } else {
      const next = { ...mob, [key]: v } as MobVals
      applyMob(next, simOn)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', left: pos.x, top: pos.y,
        width: 290, zIndex: 99999,
        background: 'rgba(15,15,18,0.97)',
        color: '#fff', borderRadius: 16,
        fontFamily: 'system-ui, sans-serif', fontSize: 12,
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        userSelect: 'none', direction: 'rtl',
      }}
    >
      {/* ── drag handle ── */}
      <div
        onMouseDown={onMouseDown}
        style={{
          padding: '10px 14px', background: '#7F5268',
          borderRadius: '16px 16px 0 0', cursor: 'grab',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13 }}>✏️ עורך Hero</span>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15 }}
        >
          {open ? '▲' : '▼'}
        </button>
      </div>

      {open && (
        <div style={{ padding: '10px 12px 12px' }}>

          {/* ── tabs ── */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {(['desk', 'mob'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: tab === t ? '#7F5268' : 'rgba(255,255,255,0.08)',
                  color: tab === t ? '#fff' : '#aaa',
                }}
              >
                {t === 'desk' ? '🖥️ דסקטופ' : '📱 מובייל'}
              </button>
            ))}
          </div>

          {/* ── phone sim toggle (mobile tab only) ── */}
          {tab === 'mob' && (
            <button
              onClick={() => setSimOn(s => !s)}
              style={{
                width: '100%', padding: '7px', borderRadius: 9, border: 'none', cursor: 'pointer',
                marginBottom: 10, fontSize: 12, fontWeight: 700,
                background: simOn ? '#4A7C59' : 'rgba(255,255,255,0.1)',
                color: simOn ? '#fff' : '#ccc',
              }}
            >
              {simOn ? '✅ מסגרת טלפון פעילה — לחצי לכיבוי' : '📱 הפעילי מסגרת טלפון'}
            </button>
          )}

          {/* ── sliders ── */}
          {sliders.map(s => (
            <div key={s.key} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ opacity: 0.75, fontSize: 11 }}>{s.label}</span>
                <span style={{ color: '#F9A8D4', fontWeight: 700 }}>
                  {(vals as Record<string, number>)[s.key]}{s.unit}
                </span>
              </div>
              <input
                type="range"
                min={s.min} max={s.max} step={s.step}
                value={(vals as Record<string, number>)[s.key]}
                onChange={e => handleSlider(s.key, parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#7F5268', height: 4 }}
              />
            </div>
          ))}

          {/* ── reset ── */}
          <button
            onClick={() => {
              if (tab === 'desk') applyDesk(DESK_DEF)
              else { applyMob(MOB_DEF, simOn) }
            }}
            style={{
              width: '100%', padding: '5px', background: 'rgba(127,82,104,0.2)',
              border: '1px solid rgba(127,82,104,0.4)', color: '#F9A8D4',
              borderRadius: 7, cursor: 'pointer', marginBottom: 8, fontSize: 11,
            }}
          >
            ↺ איפוס
          </button>

          {/* ── copy values ── */}
          <div
            onClick={copyAll}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 9, padding: '8px 10px', cursor: 'pointer', lineHeight: 1.65,
            }}
          >
            <div style={{ color: '#a3e635', fontSize: 11, marginBottom: 3 }}>
              📋 העתיקי הכל ושלחי לClaude
            </div>
            <div style={{ color: '#7dd3fc', fontSize: 9.5, wordBreak: 'break-all' }}>
              {deskPrompt}<br />{mobPrompt}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

function q<T extends Element>(sel: string): T[] {
  return Array.from(document.querySelectorAll<T>(sel))
}
