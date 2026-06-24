'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Landing Content Editor
// Visible only when URL contains ?editor (e.g. mama-system.vercel.app?editor)
// Saves all text/emoji changes to localStorage key "landing_content_v1"
// On mount applies saved values to DOM elements via their id attributes
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'landing_content_v1'

// ── Default content (mirrors page.tsx) ──────────────────────────────────────
const DEFAULTS: Record<string, string> = {
  // Hero
  'le-hero-h1':  'כל מה שאמא טרייה צריכה- במקום אחד',
  'le-hero-sub': 'מעקב הריון, מעקב תינוק, ניהול יומי, ותמיכת AI בעברית- כי את לא צריכה להסתדר לבד',

  // Features
  'le-feat-0-label': 'מעקב הריון',
  'le-feat-0-sub':   'שבועות, גדלים, בדיקות',
  'le-feat-1-label': 'מעקב תינוק',
  'le-feat-1-sub':   'האכלות, שינה, חיתולים',
  'le-feat-2-label': 'AI בעברית',
  'le-feat-2-sub':   'שאלות, ייעוץ, תמיכה',
  'le-feat-3-label': 'ניהול יומי',
  'le-feat-3-sub':   'משימות, תזכורות, סדר',

  // Why cards
  'le-why-0-icon':  '🌱',
  'le-why-0-title': 'נבנה בשביל אמהות בלבד',
  'le-why-0-body':  'לא אפליקציה כללית עם עוד פיצ\'ר לתינוק. כל מה שיש כאן- תוכנן עבור אמא שנמצאת בתחילת הדרך, הריון ואחריה.',
  'le-why-1-icon':  '🔗',
  'le-why-1-title': 'הכל במקום אחד',
  'le-why-1-body':  'הריון, תינוק, יומן ומשימות- בלי לקפוץ בין 5 אפליקציות. רואים הכל בבת אחת, מנהלים בבת אחת.',
  'le-why-2-icon':  '🧠',
  'le-why-2-title': 'AI שמבין אמא בעברית',
  'le-why-2-body':  'שאלות על הריון, עצות לתינוק, עזרה ביומן, תמיכה רגשית- 24/7, בלי שיפוטיות, בשפה שלנו.',

  // Daily scenarios
  'le-daily-0-emoji': '🤰',
  'le-daily-0-title': 'בשבוע 28 להריון',
  'le-daily-0-body':  'בדקי מה גודל התינוק השבוע, מה הבדיקות הקרובות שלך, ושאלי את ה-AI על כל מה שמדאיג אותך.',
  'le-daily-1-emoji': '🌅',
  'le-daily-1-title': 'יום אחרי לידה',
  'le-daily-1-body':  'תבצעי רישומים של האכלות, שינה, חיתולים רטובים וכל מה שאת צריכה כדי להיות רגועה.',
  'le-daily-2-emoji': '💤',
  'le-daily-2-title': 'נמנום קצר',
  'le-daily-2-body':  'לחצי Start, התינוק קם- לחצי Stop. הנמנום נרשם אוטומטית. את פנויה לנשום.',
  'le-daily-3-emoji': '💜',
  'le-daily-3-title': 'רגע של ספק',
  'le-daily-3-body':  'שאלי את ה-AI- "האם זה נורמלי?", "כמה אמורה לאכול?", "מרגישה אבודה"- היא תקשיב.',

  // Testimonials (first set only)
  'le-test-0-name':  'נועה כ.',
  'le-test-0-role':  'אמא טרייה',
  'le-test-0-quote': '"סוף סוף אני יודעת בכל רגע מה קורה עם התינוק שלי. זה נתן לי שקט אמיתי"',
  'le-test-1-name':  'שירלי מ.',
  'le-test-1-role':  'בהריון 32 שבועות',
  'le-test-1-quote': '"הפסקתי לשאול את גוגל בשלוש בלילה. עכשיו יש לי AI שמבין ולא שופט"',
  'le-test-2-name':  'גלית ר.',
  'le-test-2-role':  'אמא + עצמאית',
  'le-test-2-quote': '"ניהלתי הריון ועסק במקביל. בלי המערכת הזו הייתי קורסת"',
  'le-test-3-name':  'יעל ב.',
  'le-test-3-role':  'אמא לתאומות',
  'le-test-3-quote': '"רישום האכלות לשתי תינוקות בלחיצה אחת. שינה לי את החיים"',
  'le-test-4-name':  'מיכל ש.',
  'le-test-4-role':  'אחרי לידה ראשונה',
  'le-test-4-quote': '"הרגשתי שמישהי בנתה את זה בשבילי בדיוק. לא גנרי בכלל"',
  'le-test-5-name':  'אורית ד.',
  'le-test-5-role':  '4 חודשים אחרי לידה',
  'le-test-5-quote': '"הדשבורד הבוקר הוא הדבר הראשון שאני פותחת. כל יום"',

  // CTA
  'le-cta-heading': 'מתחילות?',
  'le-cta-sub':     'הצטרפי לאמהות שכבר לא מסתדרות לבד',
}

// ── Apply a single saved value to DOM ────────────────────────────────────────
function applyToDom(id: string, value: string) {
  const el = document.getElementById(id)
  if (el) el.textContent = value
}

// ── Load all saved overrides and apply ───────────────────────────────────────
function applySavedContent() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const saved: Record<string, string> = JSON.parse(raw)
    Object.entries(saved).forEach(([id, val]) => applyToDom(id, val))
  } catch {
    // ignore parse errors
  }
}

// ── Save one override ─────────────────────────────────────────────────────────
function saveField(id: string, value: string) {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const saved: Record<string, string> = raw ? JSON.parse(raw) : {}
    saved[id] = value
    localStorage.setItem(LS_KEY, JSON.stringify(saved))
  } catch {
    // ignore
  }
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LandingEditor() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(window.location.search.includes('editor'))
  }, [])

  if (!visible) return null
  return <EditorPanel />
}

// ── Editor panel ──────────────────────────────────────────────────────────────
function EditorPanel() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 16, y: 'calc(100vh - 64px)' as unknown as number })
  const [posNum, setPosNum] = useState({ x: 16, y: -1 }) // -1 = not yet initialized
  const [fields, setFields] = useState<Record<string, string>>(DEFAULTS)
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Sections open/close state ─────────────────────────────────────────────
  const [sections, setSections] = useState<Record<string, boolean>>({
    hero: true,
    features: false,
    why: false,
    daily: false,
    testimonials: false,
    cta: false,
  })

  function toggleSection(key: string) {
    setSections(s => ({ ...s, [key]: !s[key] }))
  }

  // ── On mount: set bottom-left position + load saved content ──────────────
  useEffect(() => {
    const y = window.innerHeight - 56
    setPosNum({ x: 16, y })

    // Load saved content
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const saved: Record<string, string> = JSON.parse(raw)
        setFields(f => ({ ...f, ...saved }))
      }
    } catch { /* ignore */ }

    // Apply to DOM (for server-rendered text)
    applySavedContent()
  }, [])

  // ── Drag ──────────────────────────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true
    offset.current = { x: e.clientX - posNum.x, y: e.clientY - posNum.y }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function onMove(e: MouseEvent) {
    if (!dragging.current) return
    setPosNum({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y })
  }

  function onUp() {
    dragging.current = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }

  // ── Handle field change ───────────────────────────────────────────────────
  const handleChange = useCallback((id: string, value: string) => {
    setFields(f => ({ ...f, [id]: value }))
    applyToDom(id, value)
    saveField(id, value)
  }, [])

  // ── Reset to defaults ─────────────────────────────────────────────────────
  function handleReset() {
    if (!confirm('לאפס את כל השינויים לברירת מחדל?')) return
    localStorage.removeItem(LS_KEY)
    setFields(DEFAULTS)
    Object.entries(DEFAULTS).forEach(([id, val]) => applyToDom(id, val))
  }

  // ── Copy changes summary ──────────────────────────────────────────────────
  function handleCopy() {
    const changed: string[] = []
    Object.entries(fields).forEach(([id, val]) => {
      if (val !== DEFAULTS[id]) {
        changed.push(`${id}: "${val}"`)
      }
    })
    if (changed.length === 0) {
      alert('אין שינויים מברירת המחדל')
      return
    }
    navigator.clipboard.writeText(changed.join('\n'))
    alert(`הועתקו ${changed.length} שינויים ללוח`)
  }

  // ── Derived position ──────────────────────────────────────────────────────
  const topPos = posNum.y < 0 ? (typeof pos === 'number' ? pos : 'auto') : posNum.y

  // ── Styles ────────────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: posNum.x,
    top: posNum.y < 0 ? undefined : posNum.y,
    bottom: posNum.y < 0 ? 8 : undefined,
    width: 340,
    zIndex: 99998,
    background: 'rgba(15,15,18,0.97)',
    color: '#fff',
    borderRadius: 16,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 12,
    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    userSelect: 'none',
    direction: 'rtl',
    maxHeight: open ? '80vh' : 'auto',
  }

  const headerStyle: React.CSSProperties = {
    padding: '10px 14px',
    background: '#4A7C59',
    borderRadius: open ? '16px 16px 0 0' : 16,
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const bodyStyle: React.CSSProperties = {
    overflowY: 'auto',
    maxHeight: 'calc(80vh - 44px)',
    padding: '10px 12px 12px',
  }

  return (
    <div ref={panelRef} style={panelStyle}>
      {/* ── Drag handle / header ── */}
      <div onMouseDown={onMouseDown} style={headerStyle}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>✏️ עורך תוכן</span>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 15 }}
        >
          {open ? '▲' : '▼'}
        </button>
      </div>

      {open && (
        <div style={bodyStyle}>

          {/* ═══ HERO ═══ */}
          <SectionHeader title="Hero" open={sections.hero} onToggle={() => toggleSection('hero')} />
          {sections.hero && (
            <div style={{ marginBottom: 12 }}>
              <FieldRow label="כותרת H1" id="le-hero-h1" value={fields['le-hero-h1']} onChange={handleChange} rows={2} />
              <FieldRow label="תת-כותרת" id="le-hero-sub" value={fields['le-hero-sub']} onChange={handleChange} rows={2} />
            </div>
          )}

          <Divider />

          {/* ═══ FEATURES ═══ */}
          <SectionHeader title="פיצ'רים (4)" open={sections.features} onToggle={() => toggleSection('features')} />
          {sections.features && (
            <div style={{ marginBottom: 12 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ opacity: 0.6, marginBottom: 4, fontSize: 11 }}>פיצ'ר {i + 1}</div>
                  <FieldRow label="תווית" id={`le-feat-${i}-label`} value={fields[`le-feat-${i}-label`]} onChange={handleChange} />
                  <FieldRow label="תת-תווית" id={`le-feat-${i}-sub`} value={fields[`le-feat-${i}-sub`]} onChange={handleChange} />
                </div>
              ))}
            </div>
          )}

          <Divider />

          {/* ═══ WHY ═══ */}
          <SectionHeader title="למה (3 כרטיסים)" open={sections.why} onToggle={() => toggleSection('why')} />
          {sections.why && (
            <div style={{ marginBottom: 12 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ opacity: 0.6, marginBottom: 4, fontSize: 11 }}>כרטיס {i + 1}</div>
                  <EmojiRow label="אייקון" id={`le-why-${i}-icon`} value={fields[`le-why-${i}-icon`]} onChange={handleChange} />
                  <FieldRow label="כותרת" id={`le-why-${i}-title`} value={fields[`le-why-${i}-title`]} onChange={handleChange} />
                  <FieldRow label="תיאור" id={`le-why-${i}-body`} value={fields[`le-why-${i}-body`]} onChange={handleChange} rows={3} />
                </div>
              ))}
            </div>
          )}

          <Divider />

          {/* ═══ DAILY SCENARIOS ═══ */}
          <SectionHeader title="תרחישים (4)" open={sections.daily} onToggle={() => toggleSection('daily')} />
          {sections.daily && (
            <div style={{ marginBottom: 12 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ opacity: 0.6, marginBottom: 4, fontSize: 11 }}>תרחיש {i + 1}</div>
                  <EmojiRow label="אמוג'י" id={`le-daily-${i}-emoji`} value={fields[`le-daily-${i}-emoji`]} onChange={handleChange} />
                  <FieldRow label="כותרת" id={`le-daily-${i}-title`} value={fields[`le-daily-${i}-title`]} onChange={handleChange} />
                  <FieldRow label="תיאור" id={`le-daily-${i}-body`} value={fields[`le-daily-${i}-body`]} onChange={handleChange} rows={3} />
                </div>
              ))}
            </div>
          )}

          <Divider />

          {/* ═══ TESTIMONIALS ═══ */}
          <SectionHeader title="המלצות (6)" open={sections.testimonials} onToggle={() => toggleSection('testimonials')} />
          {sections.testimonials && (
            <div style={{ marginBottom: 12 }}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ opacity: 0.6, marginBottom: 4, fontSize: 11 }}>המלצה {i + 1}</div>
                  <FieldRow label="שם" id={`le-test-${i}-name`} value={fields[`le-test-${i}-name`]} onChange={handleChange} />
                  <FieldRow label="תפקיד" id={`le-test-${i}-role`} value={fields[`le-test-${i}-role`]} onChange={handleChange} />
                  <FieldRow label="ציטוט" id={`le-test-${i}-quote`} value={fields[`le-test-${i}-quote`]} onChange={handleChange} rows={3} />
                </div>
              ))}
            </div>
          )}

          <Divider />

          {/* ═══ CTA ═══ */}
          <SectionHeader title="CTA" open={sections.cta} onToggle={() => toggleSection('cta')} />
          {sections.cta && (
            <div style={{ marginBottom: 12 }}>
              <FieldRow label="כותרת" id="le-cta-heading" value={fields['le-cta-heading']} onChange={handleChange} />
              <FieldRow label="תת-כותרת" id="le-cta-sub" value={fields['le-cta-sub']} onChange={handleChange} rows={2} />
            </div>
          )}

          <Divider />

          {/* ── Bottom buttons ── */}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <button
              onClick={handleReset}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 9, border: '1px solid rgba(127,82,104,0.4)',
                background: 'rgba(127,82,104,0.2)', color: '#F9A8D4', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}
            >
              ↺ איפוס לברירת מחדל
            </button>
            <button
              onClick={handleCopy}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 9, border: '1px solid rgba(163,230,53,0.3)',
                background: 'rgba(163,230,53,0.12)', color: '#a3e635', cursor: 'pointer', fontSize: 11, fontWeight: 600,
              }}
            >
              📋 העתיקי שינויים
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff',
        padding: '7px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: open ? 8 : 4,
        fontSize: 12, fontWeight: 700, textAlign: 'right',
      }}
    >
      <span style={{ opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
      <span>{title}</span>
    </button>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 0 8px' }} />
}

function FieldRow({
  label, id, value, onChange, rows = 1,
}: {
  label: string
  id: string
  value: string
  onChange: (id: string, value: string) => void
  rows?: number
}) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ opacity: 0.6, marginBottom: 3, fontSize: 10 }}>{label}</div>
      {rows > 1 ? (
        <textarea
          value={value}
          rows={rows}
          onChange={e => onChange(id, e.target.value)}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', borderRadius: 7, padding: '5px 8px', fontSize: 11, resize: 'vertical',
            fontFamily: 'system-ui, sans-serif', lineHeight: 1.5, direction: 'rtl', boxSizing: 'border-box',
          }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(id, e.target.value)}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff', borderRadius: 7, padding: '5px 8px', fontSize: 11,
            fontFamily: 'system-ui, sans-serif', direction: 'rtl', boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  )
}

function EmojiRow({
  label, id, value, onChange,
}: {
  label: string
  id: string
  value: string
  onChange: (id: string, value: string) => void
}) {
  return (
    <div style={{ marginBottom: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ opacity: 0.6, fontSize: 10, width: 40, flexShrink: 0 }}>{label}</div>
      <input
        type="text"
        value={value}
        maxLength={4}
        onChange={e => onChange(id, e.target.value)}
        style={{
          width: 52, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', borderRadius: 7, padding: '5px 8px', fontSize: 16,
          fontFamily: 'system-ui, sans-serif', textAlign: 'center',
        }}
      />
    </div>
  )
}
