'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  User, Baby, Check, Loader2, Camera, AlertTriangle, X, Heart,
  UserRound, LogOut, MessageCircle
} from 'lucide-react'

function PregnancyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M12 12c-4 0-7 3-7 6h14c0-3-3-6-7-6z" />
      <path d="M12 16c1.5 0 3 1 3 2" opacity=".4" />
    </svg>
  )
}

interface ProfileFull {
  id: string
  name?: string | null
  baby_name?: string | null
  baby_birthdate?: string | null
  baby_gender?: string | null
  profile_picture_url?: string | null
  business_name?: string | null
  business_type?: string | null
  website_url?: string | null
  instagram_url?: string | null
  facebook_url?: string | null
  linkedin_url?: string | null
  google_calendar_url?: string | null
  tracking_type?: 'pregnancy' | 'baby' | null
  due_date?: string | null
  hospital_address?: string | null
  whatsapp_number?: string | null
}

interface Props {
  profile: ProfileFull | null
  userId: string
  userEmail: string
  whatsappGroup: { url: string; visible: boolean }
}

export default function SettingsClient({ profile, userId, userEmail, whatsappGroup }: Props) {
  const supabase = createClient()
  const router   = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // ── Personal
  const [name,          setName]          = useState(profile?.name || '')
  const [profilePicUrl, setProfilePicUrl] = useState(profile?.profile_picture_url || '')

  // ── Tracking mode
  const [trackingType,  setTrackingType]  = useState<'pregnancy' | 'baby'>(
    (profile?.tracking_type as 'pregnancy' | 'baby') || 'baby'
  )
  const [dueDate,       setDueDate]       = useState(profile?.due_date || '')
  const [hospitalAddress, setHospitalAddress] = useState(profile?.hospital_address || '')

  // ── Baby
  const [babyName,      setBabyName]      = useState(profile?.baby_name || '')
  const [babyBirthdate, setBabyBirthdate] = useState(profile?.baby_birthdate || '')
  const [babyGender,    setBabyGender]    = useState<'boy' | 'girl' | ''>(
    (profile?.baby_gender as 'boy' | 'girl') || ''
  )

  // ── Photo upload
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setError(null)
    try {
      const ext  = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      // The storage path is stable, so the public URL never changes between
      // uploads and the browser keeps serving the cached old image. A version
      // query param forces both this preview and the TopBar avatar to refresh.
      const bustedUrl = `${publicUrl}?v=${Date.now()}`
      setProfilePicUrl(bustedUrl)
      const { error: saveErr } = await supabase.from('profiles').upsert({ id: userId, profile_picture_url: bustedUrl })
      if (saveErr) throw saveErr
      router.refresh()
    } catch {
      setError('שגיאה בהעלאת התמונה. ודאי שה-bucket "avatars" קיים ב-Supabase Storage.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // ── Save all
  async function handleSave() {
    setSaving(true)
    setError(null)

    const payload: Record<string, unknown> = {
      id: userId,
      name:                name           || null,
      tracking_type:       trackingType,
      due_date:            trackingType === 'pregnancy' ? (dueDate || null) : null,
      hospital_address:    trackingType === 'pregnancy' ? (hospitalAddress || null) : null,
      baby_name:           babyName       || null,
      baby_birthdate:      babyBirthdate  || null,
      baby_gender:         babyGender     || null,
      profile_picture_url: profilePicUrl  || null,
    }

    const { error: saveErr } = await supabase.from('profiles').upsert(payload)
    if (saveErr) {
      setError('שגיאה בשמירה: ' + saveErr.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    }
    setSaving(false)
  }

  // ── Logout
  const [loggingOut, setLoggingOut] = useState(false)
  async function handleLogout() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  // WhatsApp personal assistant — shown as "coming soon" for now.

  const initials = name ? name.charAt(0).toUpperCase() : ''

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>הגדרות</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>פרטים אישיים, מעקב, תינוק ועסק</p>
      </div>

      {error && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <p className="text-sm flex-1" style={{ color: '#DC2626' }}>{error}</p>
          <button onClick={() => setError(null)}><X className="w-4 h-4" style={{ color: '#DC2626' }} /></button>
        </div>
      )}

      {/* ── Personal ──────────────────────────────────────────────── */}
      <Section icon={User} title="פרטים אישיים" color="#7F5268">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white"
                style={{ background: '#7F5268' }}>
                {initials || <UserRound className="w-7 h-7" />}
              </div>
            )}
            {uploadingPhoto && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.4)' }}>
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{userEmail}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs flex items-center gap-1 mt-1.5 hover:opacity-70 transition-opacity"
              style={{ color: 'var(--primary)' }}
            >
              <Camera className="w-3 h-3" /> החלפת תמונת פרופיל
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
        </div>
        <Field label="שם מלא" value={name} onChange={setName} placeholder="השם שלך" />
      </Section>

      {/* ── Tracking mode ─────────────────────────────────────────── */}
      <Section icon={Heart} title="מצב מעקב" color="#C4548A">
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          בחרי אם את עוקבת אחרי הריון או אחרי תינוק שכבר נולד
        </p>

        {/* Toggle */}
        <div className="flex rounded-xl overflow-hidden border mb-4" style={{ borderColor: 'var(--border)' }}>
          {([
            { val: 'pregnancy', label: 'מעקב הריון', Icon: PregnancyIcon },
            { val: 'baby',      label: 'מעקב תינוק', Icon: Baby },
          ] as const).map(({ val, label, Icon }) => (
            <button key={val} onClick={() => setTrackingType(val)}
              className="flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              style={trackingType === val
                ? { background: '#7F5268', color: '#fff' }
                : { background: 'transparent', color: 'var(--text-muted)' }}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Pregnancy — due date */}
        {trackingType === 'pregnancy' && (
          <div className="space-y-4">
            <Field
              label="תאריך לידה משוער (דד-ליין)"
              value={dueDate}
              onChange={setDueDate}
              type="date"
            />
            <Field
              label="כתובת בית החולים ללידה"
              value={hospitalAddress}
              onChange={setHospitalAddress}
              placeholder="לדוגמה: בית חולים איכילוב, תל אביב"
            />
            <p className="text-xs -mt-2" style={{ color: 'var(--text-muted)' }}>
              הכתובת תשמש את כפתור הניווט ב-Waze בעמוד מד הצירים.
            </p>
          </div>
        )}

        {/* Baby — baby info */}
        {trackingType === 'baby' && (
          <div className="space-y-4">
            <Field label="שם התינוק/ת" value={babyName} onChange={setBabyName} placeholder="שם יפה" />
            <Field
              label="תאריך לידה"
              value={babyBirthdate}
              onChange={setBabyBirthdate}
              type="date"
              max={new Date().toISOString().split('T')[0]}
            />
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>מגדר</label>
              <div className="flex gap-3">
                {([['boy', 'בן'], ['girl', 'בת']] as const).map(([val, lbl]) => (
                  <button key={val} onClick={() => setBabyGender(val)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                    style={babyGender === val
                      ? { background: 'var(--primary)', color: 'white' }
                      : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                    }>
                    <UserRound className="w-4 h-4" />
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ── WhatsApp app group (admin-controlled visibility) ──────── */}
      {whatsappGroup.visible && whatsappGroup.url && (
        <Section icon={MessageCircle} title="קבוצת הוואטסאפ של האפליקציה" color="#25D366">
          <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
            הצטרפי לקבוצת האפליקציה כדי לקבל עדכונים, טיפים ותמיכה מאמהות אחרות 💜
          </p>
          <a href={whatsappGroup.url} target="_blank" rel="noopener noreferrer"
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: '#25D366' }}>
            <MessageCircle className="w-4 h-4" />
            הצטרפות לקבוצה
          </a>
        </Section>
      )}

      {/* ── WhatsApp personal assistant (coming soon) ─────────────── */}
      <Section icon={MessageCircle} title="עוזרת אישית בוואטסאפ" color="#25D366">
        <div className="py-8 text-center">
          <p className="text-2xl font-bold mb-2" style={{ color: '#7F5268' }}>בקרוב</p>
          <p className="text-sm font-light" style={{ color: 'var(--text-muted)' }}>יש למה לחכות 💜</p>
        </div>
      </Section>

      {/* ── Save ──────────────────────────────────────────────────── */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
        style={{ background: saved ? '#4A7C59' : '#7F5268' }}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
        {saving ? 'שומרת...' : saved ? 'נשמר בהצלחה!' : 'שמירת הגדרות'}
      </button>

      {/* ── Logout ────────────────────────────────────────────────── */}
      <button onClick={handleLogout} disabled={loggingOut}
        className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
        style={{ background: 'transparent', color: '#DC2626', border: '1px solid #FECACA' }}>
        {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
        {loggingOut ? 'מתנתקת...' : 'התנתקות'}
      </button>

      {/* ── Legal & copyright ──────────────────────── */}
      <div className="pt-2 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
          <a href="/legal/privacy" className="underline" style={{ color: 'var(--text-muted)' }}>מדיניות פרטיות</a>
          <span style={{ color: 'var(--border-solid)' }}>·</span>
          <a href="/legal/accessibility" className="underline" style={{ color: 'var(--text-muted)' }}>הצהרת נגישות</a>
          <span style={{ color: 'var(--border-solid)' }}>·</span>
          <a href="/legal/terms" className="underline" style={{ color: 'var(--text-muted)' }}>תנאי שימוש</a>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          כל הזכויות שמורות לעידית לאוב
        </p>
        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)', opacity: 0.85 }}>
          המידע באפליקציה הוא כללי בלבד ואינו מהווה ייעוץ רפואי או תחליף לרופא.
        </p>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, color, children }: {
  icon: React.ElementType; title: string; color: string; children: React.ReactNode
}) {
  return (
    <div className="card space-y-4">
      <h2 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {title}
      </h2>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', max }: {
  label: React.ReactNode; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; max?: string
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 flex items-center gap-1.5" style={{ color: 'var(--text)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} max={max}
        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
      />
    </div>
  )
}
