'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, Baby, Briefcase, Link, Check, Loader2, Camera, AlertTriangle, X } from 'lucide-react'

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
}

interface Props { profile: ProfileFull | null; userId: string; userEmail: string }

export default function SettingsClient({ profile, userId, userEmail }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [name, setName] = useState(profile?.name || '')
  const [babyName, setBabyName] = useState(profile?.baby_name || '')
  const [babyBirthdate, setBabyBirthdate] = useState(profile?.baby_birthdate || '')
  const [babyGender, setBabyGender] = useState<'boy' | 'girl' | ''>(
    (profile?.baby_gender as 'boy' | 'girl') || ''
  )
  const [profilePicUrl, setProfilePicUrl] = useState(profile?.profile_picture_url || '')
  const [businessName, setBusinessName] = useState(profile?.business_name || '')
  const [businessType, setBusinessType] = useState(profile?.business_type || '')
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url || '')
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url || '')
  const [facebookUrl, setFacebookUrl] = useState(profile?.facebook_url || '')
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || '')
  const [calendarUrl, setCalendarUrl] = useState(profile?.google_calendar_url || '')

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    setError(null)

    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      setProfilePicUrl(publicUrl)

      await supabase.from('profiles').upsert({ id: userId, profile_picture_url: publicUrl })
      // Refresh server components so TopBar picks up the new photo immediately
      router.refresh()
    } catch (err: unknown) {
      setError('שגיאה בהעלאת התמונה. ודאי שה-bucket "avatars" קיים ב-Supabase Storage.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setWarning(null)

    // Step 1: Save basic fields (guaranteed to exist in migration 001)
    const { error: basicError } = await supabase.from('profiles').upsert({
      id: userId,
      name: name || null,
      baby_name: babyName || null,
      baby_birthdate: babyBirthdate || null,
    })

    if (basicError) {
      setError('שגיאה בשמירה: ' + basicError.message)
      setSaving(false)
      return
    }

    // Step 2: Try to save extended fields (requires migration 002)
    const { error: extError } = await supabase.from('profiles').upsert({
      id: userId,
      baby_gender: babyGender || null,
      profile_picture_url: profilePicUrl || null,
      business_name: businessName || null,
      business_type: businessType || null,
      website_url: websiteUrl || null,
      instagram_url: instagramUrl || null,
      facebook_url: facebookUrl || null,
      linkedin_url: linkedinUrl || null,
      google_calendar_url: calendarUrl || null,
    })

    if (extError) {
      // Migration 002 probably not run
      setWarning('השם ותאריך הלידה נשמרו. לשמירת שאר השדות (מגדר, עסק, קישורים), יש להריץ את הקובץ supabase/migrations/002_profile_extensions.sql בדשבורד Supabase → SQL Editor.')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      // Refresh server components (TopBar name, baby name, etc.)
      router.refresh()
    }

    setSaving(false)
  }

  const initials = name ? name.charAt(0).toUpperCase() : '👩'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>הגדרות</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>פרטים אישיים, תינוק, ועסק</p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#DC2626' }} />
          <p className="text-sm flex-1" style={{ color: '#DC2626' }}>{error}</p>
          <button onClick={() => setError(null)}><X className="w-4 h-4" style={{ color: '#DC2626' }} /></button>
        </div>
      )}

      {/* Warning */}
      {warning && (
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: '#D97706' }}>שמירה חלקית</p>
            <p className="text-xs mt-1" style={{ color: '#92400E' }}>{warning}</p>
          </div>
          <button onClick={() => setWarning(null)}><X className="w-4 h-4" style={{ color: '#D97706' }} /></button>
        </div>
      )}

      {/* Personal */}
      <Section icon={User} title="פרטים אישיים" color="#7F5268">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            {profilePicUrl ? (
              <img src={profilePicUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white"
                style={{ background: '#7F5268' }}>
                {initials}
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
              <Camera className="w-3 h-3" /> העלאת תמונת פרופיל
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        </div>
        <Field label="שם מלא" value={name} onChange={setName} placeholder="השם שלך" />
      </Section>

      {/* Baby */}
      <Section icon={Baby} title="פרטי התינוק/ת" color="#C4A0B4">
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
            {([['boy', '👦 בן'], ['girl', '👧 בת']] as const).map(([val, lbl]) => (
              <button key={val} onClick={() => setBabyGender(val)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={babyGender === val
                  ? { background: 'var(--primary)', color: 'white' }
                  : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Business */}
      <Section icon={Briefcase} title="פרטי העסק" color="#4A7C59">
        <Field label="שם העסק" value={businessName} onChange={setBusinessName} placeholder="סטודיו X, פרילנסר Y..." />
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>סוג עסק</label>
          <select value={businessType} onChange={e => setBusinessType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            <option value="">בחרי...</option>
            <option value="freelance">פרילנסרית / עצמאית</option>
            <option value="content">תוכן / סושיאל מדיה</option>
            <option value="design">עיצוב / יצירה</option>
            <option value="consulting">ייעוץ / הדרכה</option>
            <option value="ecommerce">חנות אונליין</option>
            <option value="other">אחר</option>
          </select>
        </div>
      </Section>

      {/* Links */}
      <Section icon={Link} title="קישורים מהירים" color="#5C7A6A">
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>הקישורים יופיעו בעמוד ניהול העסק לגישה מהירה</p>
        <Field label="🌐 אתר אינטרנט" value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://www.yoursite.com" type="url" />
        <Field label="📸 אינסטגרם" value={instagramUrl} onChange={setInstagramUrl} placeholder="https://instagram.com/yourname" type="url" />
        <Field label="👥 פייסבוק" value={facebookUrl} onChange={setFacebookUrl} placeholder="https://facebook.com/yourpage" type="url" />
        <Field label="💼 לינקדאין" value={linkedinUrl} onChange={setLinkedinUrl} placeholder="https://linkedin.com/in/yourname" type="url" />
        <Field label="📅 Google Calendar" value={calendarUrl} onChange={setCalendarUrl} placeholder="https://calendar.google.com/..." type="url" />
      </Section>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
        style={{ background: saved ? '#4A7C59' : '#7F5268' }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
        {saving ? 'שומרת...' : saved ? '✓ נשמר בהצלחה!' : 'שמירת הגדרות'}
      </button>
    </div>
  )
}

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
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; max?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} max={max}
        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-current"
        style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
      />
    </div>
  )
}
