'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import BackButton from '@/components/layout/BackButton'
import GaveBirthModal from '@/components/GaveBirthModal'
import {
  PartyPopper, Baby, ClipboardList, Upload, X, Lightbulb, Check,
  Sprout, Grape, Cherry, Citrus, Apple, Banana,
  FileText, Download, Share2, ZoomIn,
  type LucideIcon,
} from 'lucide-react'

// Standard pregnancy tests by week
const STANDARD_TESTS = [
  { week: 6,  name: 'בדיקת דם ראשונה (HCG, TSH, ספירת דם)' },
  { week: 10, name: 'בדיקת שקיפות עורפית' },
  { week: 11, name: 'בדיקת סיסי שליה (CVS)' },
  { week: 12, name: 'בדיקת טרי-טסט / ביוכימיה' },
  { week: 16, name: 'בדיקת מי שפיר (אמניוצנטזה)' },
  { week: 19, name: 'אקו מורפולוגי מפורט' },
  { week: 24, name: 'העמסת סוכר (OGTT)' },
  { week: 28, name: 'בדיקת GBS + אנטיגלובולין' },
  { week: 32, name: 'אקו גדילה' },
  { week: 36, name: 'בדיקה וגינלית, תרבית GBS' },
  { week: 38, name: 'NST (מוניטור)' },
  { week: 40, name: 'ביקור אחרון + תיאום לידה' },
]

interface PregnancyTest {
  id: string
  test_name: string
  scheduled_week: number | null
  file_url: string | null
  notes: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
}

interface Profile {
  name?: string | null
  baby_name?: string | null
  baby_gender?: string | null
  due_date?: string | null
  tracking_type?: string | null
  has_given_birth?: boolean | null
  profile_picture_url?: string | null
}

interface Props {
  profile: Profile | null
  tests: PregnancyTest[]
  userId: string
}

function calcWeeks(dueDate: string | null): { weeks: number; label: string; almostTime: boolean } {
  if (!dueDate) return { weeks: 0, label: 'תאריך לידה לא הוגדר', almostTime: false }
  const due  = new Date(dueDate)
  const now  = new Date()
  const daysLeft = Math.round((due.getTime() - now.getTime()) / 86400000)
  const weeksPregnant = Math.round(40 - daysLeft / 7)
  const clamped = Math.max(1, Math.min(42, weeksPregnant))
  const remaining = 40 - clamped
  return {
    weeks: clamped,
    label: remaining > 0
      ? `שבוע ${clamped} (עוד ${remaining} שבועות ללידה)`
      : `שבוע ${clamped} — כמעט זמן!`,
    almostTime: remaining <= 0,
  }
}

// Fruit-size-per-week — one consistent icon family (closest lucide match per
// fruit where one exists, generic Sprout otherwise), scaled up week over week
// so the icon itself visually communicates "growing bigger".
const BABY_SIZES: Record<number, { name: string; icon: LucideIcon; iconSize: number }> = {
  6:  { name: 'גרגיר אפון',  icon: Sprout, iconSize: 14 },
  8:  { name: 'פטל',         icon: Grape,  iconSize: 15 },
  10: { name: 'תות',         icon: Cherry, iconSize: 16 },
  12: { name: 'ליים',        icon: Citrus, iconSize: 17 },
  14: { name: 'תפוח',        icon: Apple,  iconSize: 18 },
  16: { name: 'אגס',         icon: Apple,  iconSize: 19 },
  18: { name: 'מנגו',        icon: Citrus, iconSize: 20 },
  20: { name: 'בננה',        icon: Banana, iconSize: 21 },
  22: { name: 'פפאיה',       icon: Sprout, iconSize: 22 },
  24: { name: 'תירס',        icon: Sprout, iconSize: 23 },
  26: { name: 'בצל',         icon: Sprout, iconSize: 24 },
  28: { name: 'ברוקולי',      icon: Sprout, iconSize: 25 },
  30: { name: 'כרוב',        icon: Sprout, iconSize: 26 },
  32: { name: 'קוקוס',       icon: Sprout, iconSize: 27 },
  34: { name: 'כרובית',      icon: Sprout, iconSize: 28 },
  36: { name: 'אבוקדו',      icon: Sprout, iconSize: 29 },
  38: { name: 'אבטיח קטן',   icon: Citrus, iconSize: 30 },
  40: { name: 'תינוק!!!',    icon: Baby,   iconSize: 32 },
}
function getBabySize(week: number): { name: string; icon: LucideIcon; iconSize: number } | null {
  const keys = Object.keys(BABY_SIZES).map(Number).sort((a, b) => a - b)
  for (const k of [...keys].reverse()) {
    if (week >= k) return BABY_SIZES[k]
  }
  return null
}

export default function PregnancyClient({ profile, tests: initialTests, userId }: Props) {
  const router = useRouter()
  const [tests, setTests]         = useState<PregnancyTest[]>(initialTests)
  const [showBirth, setShowBirth] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [toast, setToast]         = useState('')
  const [tab, setTab]             = useState<'overview' | 'tests' | 'add'>('overview')
  const fileInputRef              = useRef<HTMLInputElement>(null)
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [newNote, setNewNote]     = useState('')
  const [lightbox, setLightbox]   = useState<{ url: string; name: string } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { weeks, label, almostTime } = calcWeeks(profile?.due_date ?? null)
  const progress  = Math.min(100, Math.round((weeks / 40) * 100))
  const babySize  = getBabySize(weeks)
  const completed = tests.filter(t => t.completed).length

  function showMsg(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function toggleTest(test: PregnancyTest) {
    const newVal = !test.completed
    setTests(prev => prev.map(t => t.id === test.id ? { ...t, completed: newVal } : t))
    await supabase.from('pregnancy_tests').update({
      completed: newVal,
      completed_at: newVal ? new Date().toISOString() : null,
    }).eq('id', test.id)
  }

  async function handleFileUpload(testId: string, file: File) {
    setUploading(testId)
    const ext  = (file.name.split('.').pop() || 'dat').toLowerCase()
    // Include a timestamp so re-uploads always get a fresh, cache-busted URL.
    const path = `${userId}/pregnancy/${testId}-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('pregnancy-tests')
      .upload(path, file, { upsert: true, contentType: file.type || undefined })
    if (error) {
      // Most common cause: the `pregnancy-tests` bucket / policies haven't been
      // created yet (run migration 011_pregnancy_storage.sql in Supabase).
      const notFound = /bucket|not found|exist/i.test(error.message)
      showMsg(notFound
        ? 'האחסון עדיין לא הוגדר — יש להריץ את מיגרציה 011 ב-Supabase'
        : `שגיאה בהעלאה: ${error.message}`)
      setUploading(null)
      return
    }
    const { data: url } = supabase.storage.from('pregnancy-tests').getPublicUrl(path)
    await supabase.from('pregnancy_tests').update({ file_url: url.publicUrl }).eq('id', testId)
    setTests(prev => prev.map(t => t.id === testId ? { ...t, file_url: url.publicUrl } : t))
    setUploading(null)
    showMsg('הקובץ הועלה בהצלחה!')
  }

  // Is this attachment an image we can render as a thumbnail?
  function isImage(url: string): boolean {
    return /\.(png|jpe?g|gif|webp|heic|heif|bmp)(\?|$)/i.test(url)
  }

  // Share the file to WhatsApp (native share sheet if available, else wa.me).
  async function shareFile(url: string, name: string) {
    const text = `תוצאת בדיקה: ${name}\n${url}`
    if (navigator.share) {
      try { await navigator.share({ title: name, text, url }); return } catch { /* fall through */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  async function addStandardTest(name: string, week: number) {
    const { data } = await supabase.from('pregnancy_tests')
      .insert({ user_id: userId, test_name: name, scheduled_week: week, completed: false })
      .select().single()
    if (data) setTests(prev => [...prev, data as PregnancyTest])
    showMsg('הבדיקה נוספה!')
  }

  async function addCustomTest() {
    if (!newNote.trim()) return
    const { data } = await supabase.from('pregnancy_tests')
      .insert({ user_id: userId, test_name: newNote.trim(), completed: false })
      .select().single()
    if (data) { setTests(prev => [...prev, data as PregnancyTest]); setNewNote(''); showMsg('נוסף!') }
  }

  async function deleteTest(id: string) {
    await supabase.from('pregnancy_tests').delete().eq('id', id)
    setTests(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div style={{ padding: 'clamp(16px,3vw,36px)', maxWidth: 780, margin: '0 auto', fontFamily: 'var(--font-body)' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <BackButton href="/dashboard" />
        <button
          onClick={() => setShowBirth(true)}
          style={{
            background: 'linear-gradient(135deg,#7F5268,#9b6a85)', color: '#fff',
            border: 'none', borderRadius: 20, padding: '8px 20px',
            fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font-body)', letterSpacing: '0.02em',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ילדתי! <PartyPopper size={16} />
          </span>
        </button>
      </div>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg,#7F5268 0%,#9b6a85 100%)',
        borderRadius: 20, padding: 'clamp(20px,3vw,32px)', color: '#fff', marginBottom: 20,
      }}>
        <h1 style={{ fontSize: 'clamp(1.3rem,2.5vw,1.8rem)', fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Baby size={22} /> מעקב הריון
        </h1>
        <p style={{ opacity: 0.88, fontSize: '0.95rem', margin: '0 0 20px', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
          {label}{almostTime && <PartyPopper size={16} />}
        </p>

        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, height: 10, marginBottom: 8 }}>
          <div style={{ background: '#fff', borderRadius: 10, height: '100%', width: `${progress}%`, transition: 'width 1s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.8 }}>
          <span>שבוע 1</span><span>{progress}% מהדרך</span><span>שבוע 40</span>
        </div>

        {weeks > 0 && babySize && (
          <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 14px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>גודל התינוק/ת השבוע:</span>
            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <babySize.icon size={babySize.iconSize} />
              {babySize.name}
            </strong>
          </div>
        )}
      </div>

      {/* Progress summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'בדיקות הושלמו', value: completed, color: '#4A7C59' },
          { label: 'סה”כ בדיקות', value: tests.length, color: '#7F5268' },
          { label: 'שבוע הריון', value: weeks || '—', color: '#5C7A8A' },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: '#fff', borderRadius: 14, padding: '14px 10px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#aaa' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Contraction timer entry point */}
      <Link
        href="/contractions"
        style={{
          display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
          background: 'linear-gradient(135deg,#B24592 0%,#c86ca9 100%)', color: '#fff',
          borderRadius: 16, padding: '14px 18px', marginBottom: 20,
          boxShadow: '0 2px 10px rgba(178,69,146,0.25)',
        }}
      >
        <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>⏱️</span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontWeight: 700, fontSize: '1rem' }}>מד צירים</span>
          <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.9 }}>תזמון הצירים ומתי לצאת לבית החולים</span>
        </span>
        <span style={{ fontSize: '1.2rem' }}>‹</span>
      </Link>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'rgba(127,82,104,0.06)', borderRadius: 12, padding: 4 }}>
        {[
          { key: 'overview', label: 'לוח בדיקות' },
          { key: 'tests',    label: `הבדיקות שלי (${tests.length})` },
          { key: 'add',      label: '+ הוסיפי' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            style={{
              flex: 1, padding: '8px 4px',
              background: tab === t.key ? '#7F5268' : 'transparent',
              color: tab === t.key ? '#fff' : '#7F5268',
              border: 'none', borderRadius: 9,
              fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab — all standard tests by week */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STANDARD_TESTS.map(st => {
            const existing  = tests.find(t => t.test_name === st.name)
            const done      = existing?.completed ?? false
            const isPast    = weeks >= st.week
            const isCurrent = Math.abs(weeks - st.week) <= 2

            return (
              <div key={st.name} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fff', borderRadius: 12, padding: '12px 14px',
                border: isCurrent ? '1.5px solid #7F5268' : '1px solid rgba(127,82,104,0.1)',
                opacity: !isPast && !isCurrent ? 0.5 : 1,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#4A7C59' : 'rgba(127,82,104,0.08)',
                  color: done ? '#fff' : '#7F5268', fontSize: '0.75rem', fontWeight: 700,
                }}>
                  {done ? <Check size={14} /> : st.week}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.87rem', fontWeight: 500, color: '#3a1e2d' }}>{st.name}</p>
                  <p style={{ margin: 0, fontSize: '0.73rem', color: '#aaa' }}>שבוע {st.week}</p>
                </div>
                {isCurrent && (
                  <span style={{ fontSize: '0.7rem', background: '#7F5268', color: '#fff', borderRadius: 8, padding: '3px 8px', flexShrink: 0 }}>
                    עכשיו
                  </span>
                )}
                {!existing && (isPast || isCurrent) && (
                  <button
                    onClick={() => addStandardTest(st.name, st.week)}
                    style={{
                      background: 'rgba(127,82,104,0.1)', border: 'none', borderRadius: 8,
                      padding: '4px 10px', fontSize: '0.73rem', color: '#7F5268',
                      cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0,
                    }}
                  >
                    + הוסיפי
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* My tests tab */}
      {tab === 'tests' && (
        <div>
          {tests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>
              <ClipboardList size={40} style={{ margin: '0 auto 10px' }} />
              <p>עדיין לא הוספת בדיקות.<br/>לחצי על ”לוח בדיקות” כדי להוסיף</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tests.map(test => (
                <div key={test.id} style={{
                  background: '#fff', borderRadius: 14, padding: 16,
                  border: '1px solid rgba(127,82,104,0.1)', position: 'relative',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <button
                      onClick={() => toggleTest(test)}
                      style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        border: test.completed ? 'none' : '2px solid #7F5268',
                        background: test.completed ? '#4A7C59' : 'transparent',
                        color: '#fff', fontSize: '0.75rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                      }}
                    >{test.completed && <Check size={14} />}</button>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 3px', fontSize: '0.9rem', fontWeight: 500, color: test.completed ? '#999' : '#3a1e2d', textDecoration: test.completed ? 'line-through' : 'none' }}>
                        {test.test_name}
                      </p>
                      {test.scheduled_week && <p style={{ margin: 0, fontSize: '0.73rem', color: '#bbb' }}>שבוע {test.scheduled_week}</p>}
                      {test.file_url && (
                        <button
                          onClick={() => setLightbox({ url: test.file_url!, name: test.test_name })}
                          title="להגדלה"
                          style={{
                            marginTop: 8, padding: 0, border: 'none', background: 'transparent',
                            cursor: 'pointer', display: 'inline-block', position: 'relative',
                          }}
                        >
                          {isImage(test.file_url) ? (
                            <span style={{ position: 'relative', display: 'inline-block' }}>
                              <img
                                src={test.file_url}
                                alt={test.test_name}
                                style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, border: '1px solid rgba(127,82,104,0.2)', display: 'block' }}
                              />
                              <span style={{
                                position: 'absolute', bottom: 3, left: 3, background: 'rgba(0,0,0,0.55)',
                                borderRadius: 6, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <ZoomIn size={11} color="#fff" />
                              </span>
                            </span>
                          ) : (
                            <span style={{
                              width: 60, height: 60, borderRadius: 10, background: 'rgba(127,82,104,0.08)',
                              border: '1px solid rgba(127,82,104,0.2)', display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center', gap: 2, color: '#7F5268',
                            }}>
                              <FileText size={20} />
                              <span style={{ fontSize: '0.6rem' }}>מסמך</span>
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedTestId(test.id); fileInputRef.current?.click() }}
                      disabled={uploading === test.id}
                      style={{
                        background: 'rgba(127,82,104,0.08)', border: 'none',
                        borderRadius: 8, padding: '5px 10px', fontSize: '0.75rem',
                        color: '#7F5268', cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {uploading === test.id ? '...' : (<><Upload size={13} /> צרפי</>)}
                    </button>
                  </div>
                  <button
                    onClick={() => deleteTest(test.id)}
                    style={{
                      position: 'absolute', top: 8, left: 8,
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(192,57,43,0.1)', border: 'none',
                      color: '#C0392B', fontSize: '10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  ><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add tab */}
      {tab === 'add' && (
        <div>
          <h3 style={{ color: '#7F5268', fontSize: '0.95rem', fontWeight: 600, marginBottom: 12 }}>הוסיפי בדיקה / הערה מותאמת</h3>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            <input
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="שם הבדיקה / הערה..."
              onKeyDown={e => e.key === 'Enter' && addCustomTest()}
              style={{
                flex: 1, padding: '10px 14px',
                border: '1.5px solid rgba(127,82,104,0.3)', borderRadius: 10,
                fontSize: '0.9rem', color: '#3a1e2d', outline: 'none',
                fontFamily: 'var(--font-body)', background: '#fff',
              }}
            />
            <button
              onClick={addCustomTest}
              style={{
                background: '#7F5268', color: '#fff', border: 'none',
                borderRadius: 10, padding: '10px 18px', fontSize: '0.9rem',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}
            >הוסיפי</button>
          </div>
          <p style={{ color: '#aaa', fontSize: '0.82rem', textAlign: 'center', lineHeight: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Lightbulb size={14} /> ניתן לצלם ולהעלות תוצאות בדיקה ישירות מהגלריה
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              מתוך לשונית ”הבדיקות שלי” לחצי על ”<Upload size={13} /> צרפי”
            </span>
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0]
          if (file && selectedTestId) handleFileUpload(selectedTestId, file)
          e.target.value = ''
        }}
      />

      {/* Lightbox — enlarge, share, download */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.8)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>

          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 640, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {isImage(lightbox.url) ? (
              <img
                src={lightbox.url}
                alt={lightbox.name}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 12, background: '#fff' }}
              />
            ) : (
              <div style={{ background: '#fff', borderRadius: 12, padding: 32, textAlign: 'center', color: '#7F5268', width: '100%' }}>
                <FileText size={56} style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontWeight: 600 }}>{lightbox.name}</p>
                <a href={lightbox.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 12, color: '#7F5268', fontSize: '0.85rem' }}>
                  פתחי את המסמך בכרטיסייה חדשה
                </a>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 360 }}>
              <button
                onClick={() => shareFile(lightbox.url, lightbox.name)}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: '#25D366', color: '#fff', fontWeight: 600, fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)',
                }}
              >
                <Share2 size={16} /> שיתוף
              </button>
              <a
                href={`${lightbox.url}${lightbox.url.includes('?') ? '&' : '?'}download`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 12, cursor: 'pointer', textDecoration: 'none',
                  background: '#7F5268', color: '#fff', fontWeight: 600, fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-body)',
                }}
              >
                <Download size={16} /> הורדה
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: '#7F5268', color: '#fff', padding: '10px 24px',
          borderRadius: 20, fontSize: '0.88rem', fontWeight: 500, zIndex: 100,
          whiteSpace: 'nowrap',
        }}>
          {toast}
        </div>
      )}

      {showBirth && <GaveBirthModal onClose={() => { setShowBirth(false); router.push('/tracker') }} />}
    </div>
  )
}
