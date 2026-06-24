'use client'

import { useState, useRef, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Landing Content Editor  — מופיע רק כשה-URL מכיל ?editor
// שמירה: landing_content_v1 (טקסטים/תמונות), landing_styles_v1 (עיצוב)
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY      = 'landing_content_v1'
const LS_STYLE_KEY = 'landing_styles_v1'

type ElStyle = {
  color?:          string
  fontSize?:       string   // e.g. '2.4rem'
  fontWeight?:     string   // 'bold' | 'normal'
  fontStyle?:      string   // 'italic' | 'normal'
  textDecoration?: string   // 'underline' | 'none'
  textAlign?:      string   // 'right' | 'center' | 'left'
  lineHeight?:     string   // e.g. '1.5'
  letterSpacing?:  string   // e.g. '0.05em'
  marginTop?:      string   // e.g. '0.5rem'
  marginBottom?:   string
}

// Brand preset colors
const BRAND = ['#1a1a1a','#ffffff','#7F5268','#F9A8D4','#4A7C59','#F7EDE2','#2563eb','#dc2626','#f59e0b','#10b981']

// ── Default content (mirrors page.tsx) ──────────────────────────────────────
const DEFAULTS: Record<string, string> = {
  'le-hero-h1':  'כל מה שאת צריכה- במקום אחד',
  'le-hero-sub': 'בתוך כל הטירוף, העייפות וים העצות מסביב – אנחנו כאן כדי לעשות לך סדר.\nמהבדיקה הראשונה ועד גיל שנה, כל מה שאת באמת צריכה לדעת במקום אחד, בלי רעשי רקע. רק את והתינוק שלך, בראש שקט',

  'le-feat-0-label': 'מעקב הריון',   'le-feat-0-sub': 'שבועות, גדלים, בדיקות',
  'le-feat-1-label': 'מעקב תינוק',   'le-feat-1-sub': 'האכלות, שינה, חיתולים',
  'le-feat-2-label': 'AI בעברית',    'le-feat-2-sub': 'שאלות, ייעוץ, תמיכה',
  'le-feat-3-label': 'ניהול יומי',   'le-feat-3-sub': 'משימות, תזכורות, סדר',

  'le-why-0-icon': '🌱', 'le-why-0-title': 'נבנה בשביל אמהות בלבד',
  'le-why-0-body': "לא אפליקציה כללית עם עוד פיצ'ר לתינוק. כל מה שיש כאן- תוכנן עבור אמא שנמצאת בתחילת הדרך, הריון ואחריה.",
  'le-why-1-icon': '🔗', 'le-why-1-title': 'הכל במקום אחד',
  'le-why-1-body': 'הריון, תינוק, יומן ומשימות- בלי לקפוץ בין 5 אפליקציות. רואים הכל בבת אחת, מנהלים בבת אחת.',
  'le-why-2-icon': '🧠', 'le-why-2-title': 'AI שמבין אמא בעברית',
  'le-why-2-body': 'שאלות על הריון, עצות לתינוק, עזרה ביומן, תמיכה רגשית- 24/7, בלי שיפוטיות, בשפה שלנו.',

  'le-daily-0-emoji': '🤰', 'le-daily-0-title': 'בשבוע 28 להריון',
  'le-daily-0-body': 'בדקי מה גודל התינוק השבוע, מה הבדיקות הקרובות שלך, ושאלי את ה-AI על כל מה שמדאיג אותך.',
  'le-daily-1-emoji': '🌅', 'le-daily-1-title': 'יום אחרי לידה',
  'le-daily-1-body': 'תבצעי רישומים של האכלות, שינה, חיתולים רטובים וכל מה שאת צריכה כדי להיות רגועה.',
  'le-daily-2-emoji': '💤', 'le-daily-2-title': 'נמנום קצר',
  'le-daily-2-body': 'לחצי Start, התינוק קם- לחצי Stop. הנמנום נרשם אוטומטית. את פנויה לנשום.',
  'le-daily-3-emoji': '💜', 'le-daily-3-title': 'רגע של ספק',
  'le-daily-3-body': 'שאלי את ה-AI- "האם זה נורמלי?", "כמה אמורה לאכול?", "מרגישה אבודה"- היא תקשיב.',

  'le-test-0-name': 'נועה כ.',    'le-test-0-role': 'אמא טרייה',          'le-test-0-quote': '"סוף סוף אני יודעת בכל רגע מה קורה עם התינוק שלי. זה נתן לי שקט אמיתי"',
  'le-test-1-name': 'שירלי מ.',   'le-test-1-role': 'בהריון 32 שבועות',  'le-test-1-quote': '"הפסקתי לשאול את גוגל בשלוש בלילה. עכשיו יש לי AI שמבין ולא שופט"',
  'le-test-2-name': 'גלית ר.',    'le-test-2-role': 'אמא + עצמאית',       'le-test-2-quote': '"ניהלתי הריון ועסק במקביל. בלי המערכת הזו הייתי קורסת"',
  'le-test-3-name': 'יעל ב.',     'le-test-3-role': 'אמא לתאומות',         'le-test-3-quote': '"רישום האכלות לשתי תינוקות בלחיצה אחת. שינה לי את החיים"',
  'le-test-4-name': 'מיכל ש.',    'le-test-4-role': 'אחרי לידה ראשונה',   'le-test-4-quote': '"הרגשתי שמישהי בנתה את זה בשבילי בדיוק. לא גנרי בכלל"',
  'le-test-5-name': 'אורית ד.',   'le-test-5-role': '4 חודשים אחרי לידה', 'le-test-5-quote': '"הדשבורד הבוקר הוא הדבר הראשון שאני פותחת. כל יום"',

  'le-cta-heading': 'מתחילות?',
  'le-cta-sub':     'הצטרפי לאמהות שכבר לא מנסות להסתדר לבד',
}

// ── DOM helpers ───────────────────────────────────────────────────────────────
function escHtml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function applyToDom(id: string, value: string) {
  const el = document.getElementById(id)
  if (!el) return
  if (value.startsWith('data:image')) {
    el.innerHTML = `<img src="${value}" style="width:1.2em;height:1.2em;object-fit:contain;vertical-align:middle;display:inline-block;" alt="icon" />`
  } else if (value.includes('\n')) {
    el.innerHTML = value.split('\n').map(escHtml).join('<br>')
  } else {
    el.textContent = value
  }
}

const STYLE_PROPS: (keyof ElStyle)[] = [
  'color','fontSize','fontWeight','fontStyle','textDecoration',
  'textAlign','lineHeight','letterSpacing','marginTop','marginBottom',
]

function applyStyleToEl(id: string, style: ElStyle) {
  const el = document.getElementById(id)
  if (!el) return
  STYLE_PROPS.forEach(p => {
    (el.style as unknown as Record<string, string>)[p] = style[p] ?? ''
  })
}

function applySavedContent() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const saved: Record<string, string> = JSON.parse(raw)
    Object.entries(saved).forEach(([id, v]) => applyToDom(id, v))
  } catch { /* ignore */ }
}

function applySavedStyles() {
  try {
    const raw = localStorage.getItem(LS_STYLE_KEY)
    if (!raw) return
    const saved: Record<string, ElStyle> = JSON.parse(raw)
    Object.entries(saved).forEach(([id, s]) => applyStyleToEl(id, s))
  } catch { /* ignore */ }
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LandingEditor() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setVisible(window.location.search.includes('editor')) }, [])
  if (!visible) return null
  return <EditorPanel />
}

// ── Editor panel ──────────────────────────────────────────────────────────────
function EditorPanel() {
  const [open, setOpen] = useState(false)
  const [posNum, setPosNum] = useState({ x: 16, y: -1 })
  const [fields, setFields] = useState<Record<string, string>>(DEFAULTS)
  const [elStyles, setElStyles] = useState<Record<string, ElStyle>>({})
  const elStylesRef = useRef<Record<string, ElStyle>>({})
  elStylesRef.current = elStyles   // keep ref in sync for handleStyleChange

  const dragging = useRef(false)
  const offset   = useRef({ x: 0, y: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  const [sections, setSections] = useState<Record<string, boolean>>({
    hero: true, features: false, why: false,
    daily: false, testimonials: false, cta: false,
  })
  function toggleSection(key: string) {
    setSections(s => ({ ...s, [key]: !s[key] }))
  }

  // ── Mount: position + load saved data ────────────────────────────────────
  useEffect(() => {
    setPosNum({ x: 16, y: window.innerHeight - 56 })
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) setFields(f => ({ ...f, ...JSON.parse(raw) }))
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem(LS_STYLE_KEY)
      if (raw) setElStyles(JSON.parse(raw))
    } catch { /* ignore */ }
    applySavedContent()
    applySavedStyles()
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

  // ── Content change ────────────────────────────────────────────────────────
  function handleChange(id: string, value: string) {
    setFields(f => ({ ...f, [id]: value }))
    applyToDom(id, value)
    try {
      const raw = localStorage.getItem(LS_KEY)
      const saved: Record<string, string> = raw ? JSON.parse(raw) : {}
      saved[id] = value
      localStorage.setItem(LS_KEY, JSON.stringify(saved))
    } catch { /* ignore */ }
  }

  // ── Style change ──────────────────────────────────────────────────────────
  function handleStyleChange(id: string, patch: ElStyle) {
    const prev = elStylesRef.current
    const merged: ElStyle = { ...(prev[id] || {}), ...patch }
    // Strip empty strings so we don't persist 'color: ""'
    const clean: ElStyle = {}
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== '' && v != null) (clean as Record<string, string>)[k] = v
    })
    applyStyleToEl(id, clean)
    try {
      const raw = localStorage.getItem(LS_STYLE_KEY)
      const saved: Record<string, ElStyle> = raw ? JSON.parse(raw) : {}
      saved[id] = clean
      localStorage.setItem(LS_STYLE_KEY, JSON.stringify(saved))
    } catch { /* ignore */ }
    const updated = { ...prev, [id]: clean }
    elStylesRef.current = updated
    setElStyles(updated)
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function handleReset() {
    if (!confirm('לאפס את כל השינויים לברירת מחדל?')) return
    localStorage.removeItem(LS_KEY)
    localStorage.removeItem(LS_STYLE_KEY)
    setFields(DEFAULTS)
    setElStyles({})
    Object.entries(DEFAULTS).forEach(([id, v]) => applyToDom(id, v))
    Object.keys(elStylesRef.current).forEach(id => applyStyleToEl(id, {}))
    elStylesRef.current = {}
  }

  // ── Copy changes ──────────────────────────────────────────────────────────
  function handleCopy() {
    const lines: string[] = []
    Object.entries(fields).forEach(([id, v]) => {
      if (v !== DEFAULTS[id]) lines.push(`${id}: ${v.startsWith('data:image') ? '[תמונה מועלית]' : `"${v}"`}`)
    })
    Object.entries(elStyles).forEach(([id, s]) => {
      if (Object.keys(s).length) lines.push(`${id} עיצוב: ${JSON.stringify(s)}`)
    })
    if (!lines.length) { alert('אין שינויים'); return }
    navigator.clipboard.writeText(lines.join('\n'))
    alert(`הועתקו ${lines.length} שינויים`)
  }

  // ── Shorthand for passing to FieldRow ────────────────────────────────────
  const FW = (id: string, label: string, rows = 1) => ({
    id, label, rows,
    value: fields[id] ?? DEFAULTS[id] ?? '',
    onChange: handleChange,
    elStyle: elStyles[id] || {},
    onStyleChange: handleStyleChange,
  })

  // ── Panel styles ──────────────────────────────────────────────────────────
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: posNum.x,
    top: posNum.y < 0 ? undefined : posNum.y,
    bottom: posNum.y < 0 ? 8 : undefined,
    width: 370,
    zIndex: 99998,
    background: 'rgba(12,12,16,0.97)',
    color: '#fff',
    borderRadius: 16,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 12,
    boxShadow: '0 16px 50px rgba(0,0,0,0.7)',
    userSelect: 'none',
    direction: 'rtl',
    maxHeight: open ? '82vh' : 'auto',
    backdropFilter: 'blur(12px)',
  }

  return (
    <div ref={panelRef} style={panelStyle}>
      {/* Header / drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          padding: '10px 14px',
          background: 'linear-gradient(135deg,#4A7C59,#3a6649)',
          borderRadius: open ? '16px 16px 0 0' : 16,
          cursor: 'grab',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13 }}>✏️ עורך תוכן — Elementor</span>
        <button onClick={() => setOpen(o => !o)}
          style={{ background:'none', border:'none', color:'#fff', cursor:'pointer', fontSize:16 }}>
          {open ? '▲' : '▼'}
        </button>
      </div>

      {open && (
        <div style={{ overflowY:'auto', maxHeight:'calc(82vh - 44px)', padding:'10px 12px 14px' }}>

          {/* ═══ HERO ═══ */}
          <SectionHeader title="Hero" open={sections.hero} onToggle={() => toggleSection('hero')} />
          {sections.hero && (
            <div style={{ marginBottom:12 }}>
              <FieldRow {...FW('le-hero-h1',  'כותרת H1', 2)} />
              <FieldRow {...FW('le-hero-sub', 'תת-כותרת', 2)} />
            </div>
          )}

          <Divider />

          {/* ═══ FEATURES ═══ */}
          <SectionHeader title="פיצ'רים (4)" open={sections.features} onToggle={() => toggleSection('features')} />
          {sections.features && (
            <div style={{ marginBottom:12 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={itemWrap}>
                  <Label>פיצ'ר {i+1}</Label>
                  <FieldRow {...FW(`le-feat-${i}-label`, 'תווית')} />
                  <FieldRow {...FW(`le-feat-${i}-sub`,   'תת-תווית')} />
                </div>
              ))}
            </div>
          )}

          <Divider />

          {/* ═══ WHY ═══ */}
          <SectionHeader title="למה (3 כרטיסים)" open={sections.why} onToggle={() => toggleSection('why')} />
          {sections.why && (
            <div style={{ marginBottom:12 }}>
              {[0,1,2].map(i => (
                <div key={i} style={itemWrap}>
                  <Label>כרטיס {i+1}</Label>
                  <IconRow
                    label="אייקון" id={`le-why-${i}-icon`}
                    value={fields[`le-why-${i}-icon`] ?? DEFAULTS[`le-why-${i}-icon`]}
                    defaultEmoji={DEFAULTS[`le-why-${i}-icon`]}
                    onChange={handleChange}
                  />
                  <FieldRow {...FW(`le-why-${i}-title`, 'כותרת')} />
                  <FieldRow {...FW(`le-why-${i}-body`,  'תיאור', 3)} />
                </div>
              ))}
            </div>
          )}

          <Divider />

          {/* ═══ DAILY SCENARIOS ═══ */}
          <SectionHeader title="תרחישים (4)" open={sections.daily} onToggle={() => toggleSection('daily')} />
          {sections.daily && (
            <div style={{ marginBottom:12 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={itemWrap}>
                  <Label>תרחיש {i+1}</Label>
                  <IconRow
                    label="אמוג'י" id={`le-daily-${i}-emoji`}
                    value={fields[`le-daily-${i}-emoji`] ?? DEFAULTS[`le-daily-${i}-emoji`]}
                    defaultEmoji={DEFAULTS[`le-daily-${i}-emoji`]}
                    onChange={handleChange}
                  />
                  <FieldRow {...FW(`le-daily-${i}-title`, 'כותרת')} />
                  <FieldRow {...FW(`le-daily-${i}-body`,  'תיאור', 3)} />
                </div>
              ))}
            </div>
          )}

          <Divider />

          {/* ═══ TESTIMONIALS ═══ */}
          <SectionHeader title="המלצות (6)" open={sections.testimonials} onToggle={() => toggleSection('testimonials')} />
          {sections.testimonials && (
            <div style={{ marginBottom:12 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={itemWrap}>
                  <Label>המלצה {i+1}</Label>
                  <FieldRow {...FW(`le-test-${i}-name`,  'שם')} />
                  <FieldRow {...FW(`le-test-${i}-role`,  'תפקיד')} />
                  <FieldRow {...FW(`le-test-${i}-quote`, 'ציטוט', 3)} />
                </div>
              ))}
            </div>
          )}

          <Divider />

          {/* ═══ CTA ═══ */}
          <SectionHeader title="CTA" open={sections.cta} onToggle={() => toggleSection('cta')} />
          {sections.cta && (
            <div style={{ marginBottom:12 }}>
              <FieldRow {...FW('le-cta-heading', 'כותרת')} />
              <FieldRow {...FW('le-cta-sub',     'תת-כותרת', 2)} />
            </div>
          )}

          <Divider />

          {/* Bottom actions */}
          <div style={{ display:'flex', gap:6, marginTop:4 }}>
            <button onClick={handleReset}
              style={{ flex:1, padding:'7px 0', borderRadius:9, border:'1px solid rgba(127,82,104,0.4)',
                background:'rgba(127,82,104,0.2)', color:'#F9A8D4', cursor:'pointer', fontSize:11, fontWeight:600 }}>
              ↺ איפוס
            </button>
            <button onClick={handleCopy}
              style={{ flex:1, padding:'7px 0', borderRadius:9, border:'1px solid rgba(163,230,53,0.3)',
                background:'rgba(163,230,53,0.12)', color:'#a3e635', cursor:'pointer', fontSize:11, fontWeight:600 }}>
              📋 העתיקי שינויים
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Shared style constants ────────────────────────────────────────────────────
const itemWrap: React.CSSProperties = {
  marginBottom:10, paddingBottom:10, borderBottom:'1px solid rgba(255,255,255,0.05)',
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ opacity:0.5, marginBottom:4, fontSize:10 }}>{children}</div>
}

function SectionHeader({ title, open, onToggle }: { title:string; open:boolean; onToggle:()=>void }) {
  return (
    <button onClick={onToggle} style={{
      width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center',
      background:'rgba(255,255,255,0.06)', border:'none', color:'#fff',
      padding:'7px 10px', borderRadius:8, cursor:'pointer', marginBottom: open ? 8 : 4,
      fontSize:12, fontWeight:700, textAlign:'right',
    }}>
      <span style={{ opacity:0.6 }}>{open ? '▲' : '▼'}</span>
      <span>{title}</span>
    </button>
  )
}

function Divider() {
  return <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'4px 0 8px' }} />
}

// ── FieldRow — text input + always-visible size bar + 🎨 advanced controls ────
function FieldRow({
  label, id, value, onChange, rows = 1, elStyle, onStyleChange,
}: {
  label: string; id: string; value: string
  onChange: (id: string, v: string) => void
  rows?: number
  elStyle: ElStyle
  onStyleChange: (id: string, patch: ElStyle) => void
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const hasAdvanced = Object.keys(elStyle).some(k => k !== 'fontSize')
  const fsVal = elStyle.fontSize ? parseFloat(elStyle.fontSize) : NaN

  const inputBase: React.CSSProperties = {
    width:'100%', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.11)',
    color:'#fff', borderRadius:7, padding:'5px 8px', fontSize:11,
    fontFamily:'system-ui, sans-serif', direction:'rtl', boxSizing:'border-box',
  }

  return (
    <div style={{ marginBottom:8 }}>
      {/* Label row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
        <div style={{ opacity:0.55, fontSize:10 }}>{label}</div>
        {rows > 1 && (
          <span style={{ opacity:0.3, fontSize:9, color:'#aaa' }}>↵ Enter לשבירת שורה</span>
        )}
      </div>

      {/* Input */}
      {rows > 1 ? (
        <textarea
          value={value} rows={rows}
          onChange={e => onChange(id, e.target.value)}
          style={{ ...inputBase, resize:'vertical', lineHeight:1.5 }}
        />
      ) : (
        <input type="text" value={value}
          onChange={e => onChange(id, e.target.value)}
          style={inputBase}
        />
      )}

      {/* ── Always-visible size bar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
        <span style={{ opacity:0.4, fontSize:9, flexShrink:0 }}>Aa</span>
        <input
          type="range" min={0.6} max={5} step={0.05}
          value={isNaN(fsVal) ? 1.0 : fsVal}
          onChange={e => onStyleChange(id, { fontSize: e.target.value + 'rem' })}
          style={{ flex:1, accentColor:'#7dd3fc', cursor:'pointer' }}
        />
        <span style={{ color: elStyle.fontSize ? '#7dd3fc' : 'rgba(255,255,255,0.3)', fontSize:9, minWidth:30, textAlign:'center' }}>
          {elStyle.fontSize || 'auto'}
        </span>
        {elStyle.fontSize && (
          <XBtn onClick={() => onStyleChange(id, { fontSize:'' })} />
        )}
        {/* Advanced style toggle */}
        <button
          onClick={() => setShowAdvanced(s => !s)}
          title="צבע, יישור, ריווח..."
          style={{
            padding:'2px 5px', borderRadius:5, flexShrink:0,
            border: `1px solid ${showAdvanced ? 'rgba(125,211,252,0.4)' : hasAdvanced ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.12)'}`,
            background: showAdvanced ? 'rgba(125,211,252,0.12)' : hasAdvanced ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)',
            color: showAdvanced ? '#7dd3fc' : hasAdvanced ? '#a78bfa' : 'rgba(255,255,255,0.4)',
            cursor:'pointer', fontSize:11, lineHeight:1,
          }}
        >
          {hasAdvanced ? '🎨✓' : '🎨'}
        </button>
      </div>

      {/* Advanced style panel */}
      {showAdvanced && (
        <StyleControls id={id} style={elStyle} onStyleChange={onStyleChange} />
      )}
    </div>
  )
}

// ── StyleControls — Elementor-style formatting panel ─────────────────────────
function StyleControls({
  id, style, onStyleChange,
}: {
  id: string; style: ElStyle; onStyleChange: (id: string, patch: ElStyle) => void
}) {
  const s = style
  function set(patch: ElStyle) { onStyleChange(id, patch) }

  const fsVal = s.fontSize ? parseFloat(s.fontSize) : NaN
  const lhVal = s.lineHeight ? parseFloat(s.lineHeight) : NaN
  const mbVal = s.marginBottom ? parseFloat(s.marginBottom) : 0
  const mtVal = s.marginTop ? parseFloat(s.marginTop) : 0
  const lsVal = s.letterSpacing ? parseFloat(s.letterSpacing) : 0

  return (
    <div style={{
      background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:9, padding:'9px 10px', marginTop:5, display:'flex', flexDirection:'column', gap:7,
    }}>

      {/* ── Color ── */}
      <Row label="צבע">
        {/* Color picker — native input overlaid by preview */}
        <div style={{ position:'relative', width:26, height:22, flexShrink:0 }}>
          <div style={{
            width:26, height:22, borderRadius:5,
            background: s.color || 'rgba(255,255,255,0.12)',
            border:`1px solid ${s.color ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)'}`,
          }} />
          <input type="color" value={s.color || '#ffffff'}
            onChange={e => set({ color: e.target.value })}
            title="בחרי צבע"
            style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%', padding:0, border:'none' }}
          />
        </div>
        {/* Brand swatches */}
        <div style={{ display:'flex', gap:3, flexWrap:'wrap', flex:1 }}>
          {BRAND.map(c => (
            <div key={c} onClick={() => set({ color: s.color===c ? '' : c })}
              style={{
                width:15, height:15, borderRadius:3, background:c, cursor:'pointer', flexShrink:0,
                border: s.color===c ? '2px solid #fff' : c==='#ffffff' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                boxSizing:'border-box',
              }} />
          ))}
        </div>
        {s.color && <XBtn onClick={() => set({ color:'' })} />}
      </Row>

      {/* ── Style toggles + Alignment ── */}
      <div style={{ display:'flex', gap:3, alignItems:'center' }}>
        <Tog active={s.fontWeight==='bold'}     onClick={() => set({ fontWeight: s.fontWeight==='bold' ? '' : 'bold' })} title="מודגש"><b>B</b></Tog>
        <Tog active={s.fontStyle==='italic'}    onClick={() => set({ fontStyle: s.fontStyle==='italic' ? '' : 'italic' })} title="נטוי"><i style={{fontStyle:'italic'}}>I</i></Tog>
        <Tog active={s.textDecoration==='underline'} onClick={() => set({ textDecoration: s.textDecoration==='underline' ? '' : 'underline' })} title="קו תחתי"><u>U</u></Tog>
        <div style={{ width:1, height:16, background:'rgba(255,255,255,0.12)', margin:'0 3px' }} />
        <Tog active={s.textAlign==='right'}  onClick={() => set({ textAlign: s.textAlign==='right'  ? '' : 'right'  })} title="ימין">⬅</Tog>
        <Tog active={s.textAlign==='center'} onClick={() => set({ textAlign: s.textAlign==='center' ? '' : 'center' })} title="מרכז">☰</Tog>
        <Tog active={s.textAlign==='left'}   onClick={() => set({ textAlign: s.textAlign==='left'   ? '' : 'left'   })} title="שמאל">➡</Tog>
      </div>

      {/* ── Line height ── */}
      <Row label="גובה שורה">
        <input type="range" min={1.0} max={2.5} step={0.05}
          value={isNaN(lhVal) ? 1.4 : lhVal}
          onChange={e => set({ lineHeight: e.target.value })}
          style={{ flex:1, accentColor:'#a78bfa' }} />
        <Val color="#a78bfa">{s.lineHeight || 'auto'}</Val>
        {s.lineHeight && <XBtn onClick={() => set({ lineHeight:'' })} />}
      </Row>

      {/* ── Letter spacing ── */}
      <Row label="ריווח אותיות">
        <input type="range" min={-0.05} max={0.3} step={0.005}
          value={lsVal}
          onChange={e => {
            const v = parseFloat(e.target.value)
            set({ letterSpacing: v === 0 ? '' : v.toFixed(3) + 'em' })
          }}
          style={{ flex:1, accentColor:'#f9a8d4' }} />
        <Val color="#f9a8d4">{s.letterSpacing || '0'}</Val>
        {s.letterSpacing && <XBtn onClick={() => set({ letterSpacing:'' })} />}
      </Row>

      {/* ── Margin top / bottom ── */}
      <Row label="ריווח מעל">
        <input type="range" min={0} max={5} step={0.1}
          value={mtVal}
          onChange={e => { const v=parseFloat(e.target.value); set({ marginTop: v>0 ? v+'rem' : '' }) }}
          style={{ flex:1, accentColor:'#4ade80' }} />
        <Val color="#4ade80">{s.marginTop || '0'}</Val>
        {s.marginTop && <XBtn onClick={() => set({ marginTop:'' })} />}
      </Row>
      <Row label="ריווח מתחת">
        <input type="range" min={0} max={5} step={0.1}
          value={mbVal}
          onChange={e => { const v=parseFloat(e.target.value); set({ marginBottom: v>0 ? v+'rem' : '' }) }}
          style={{ flex:1, accentColor:'#4ade80' }} />
        <Val color="#4ade80">{s.marginBottom || '0'}</Val>
        {s.marginBottom && <XBtn onClick={() => set({ marginBottom:'' })} />}
      </Row>

    </div>
  )
}

// ── StyleControls helpers ─────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <span style={{ opacity:0.5, fontSize:9, width:56, flexShrink:0, textAlign:'right' }}>{label}</span>
      {children}
    </div>
  )
}
function Val({ color, children }: { color: string; children: React.ReactNode }) {
  return <span style={{ color, fontSize:9, minWidth:32, textAlign:'center', flexShrink:0 }}>{children}</span>
}
function Tog({ active, onClick, title, children }: { active:boolean; onClick:()=>void; title?:string; children:React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      style={{
        width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center',
        borderRadius:5, border:`1px solid ${active ? 'rgba(125,211,252,0.4)' : 'rgba(255,255,255,0.1)'}`,
        background: active ? 'rgba(125,211,252,0.18)' : 'rgba(255,255,255,0.04)',
        color: active ? '#7dd3fc' : '#aaa', cursor:'pointer', fontSize:11, flexShrink:0,
      }}>
      {children}
    </button>
  )
}
function XBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center',
        borderRadius:3, border:'none', background:'rgba(255,80,80,0.2)',
        color:'#ff8888', cursor:'pointer', fontSize:9, flexShrink:0, padding:0,
      }}>
      ✕
    </button>
  )
}

// ── IconRow — emoji text input + image file upload ────────────────────────────
function IconRow({
  label, id, value, defaultEmoji, onChange,
}: {
  label:string; id:string; value:string; defaultEmoji:string; onChange:(id:string,v:string)=>void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const isImg = value.startsWith('data:image')

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => { if (ev.target?.result) onChange(id, ev.target.result as string) }
    r.readAsDataURL(f)
    e.target.value = ''
  }

  return (
    <div style={{ marginBottom:7, display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ opacity:0.55, fontSize:10, width:38, flexShrink:0 }}>{label}</div>

      {/* Preview */}
      <div style={{
        width:34, height:34, flexShrink:0, borderRadius:7,
        background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:20, overflow:'hidden',
      }}>
        {isImg
          ? <img src={value} alt="icon" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
          : <span>{value}</span>}
      </div>

      {/* Emoji input (only when no image) */}
      {!isImg && (
        <input type="text" value={value} maxLength={4}
          onChange={e => onChange(id, e.target.value)}
          placeholder="😊"
          style={{
            width:46, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
            color:'#fff', borderRadius:7, padding:'5px 6px', fontSize:15,
            fontFamily:'system-ui, sans-serif', textAlign:'center', flexShrink:0,
          }}
        />
      )}

      {/* Upload */}
      <button onClick={() => fileRef.current?.click()} title="העלי תמונה (PNG / JPG / SVG)"
        style={{
          padding:'5px 9px', borderRadius:7, cursor:'pointer', fontSize:13, lineHeight:1,
          background:'rgba(125,211,252,0.1)', border:'1px solid rgba(125,211,252,0.25)',
          color:'#7dd3fc', flexShrink:0,
        }}>
        🖼
      </button>

      {/* Clear image */}
      {isImg && (
        <button onClick={() => onChange(id, defaultEmoji)} title="הסרי תמונה"
          style={{
            padding:'5px 9px', borderRadius:7, cursor:'pointer', fontSize:11,
            background:'rgba(255,100,100,0.15)', border:'1px solid rgba(255,100,100,0.3)',
            color:'#fca5a5', flexShrink:0,
          }}>
          ✕
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
        style={{ display:'none' }} onChange={onFile} />
    </div>
  )
}
