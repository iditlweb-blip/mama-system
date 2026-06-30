'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Loader2, Camera } from 'lucide-react'
import Image from 'next/image'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    trackingType: '' as 'pregnancy' | 'baby' | '',
    due_date: '',
    baby_birthdate: '',
    baby_name: '',
    baby_gender: '' as 'boy' | 'girl' | '',
    user_goal: '' as 'learn' | 'organize' | 'recommendations' | '',
    profileFile: null as File | null,
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    update('profileFile', file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleComplete(skip = false) {
    setLoading(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let profile_picture_url: string | undefined = undefined

      if (!skip && form.profileFile) {
        setUploading(true)
        const ext = form.profileFile.name.split('.').pop()
        const path = `${user.id}/profile.${ext}`
        const { data: uploadData } = await supabase.storage
          .from('avatars')
          .upload(path, form.profileFile, { upsert: true })
        if (uploadData) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          profile_picture_url = urlData.publicUrl
        }
        setUploading(false)
      }

      await supabase.from('profiles').upsert({
        id: user.id,
        name: form.name,
        tracking_type: form.trackingType || 'baby',
        due_date: form.trackingType === 'pregnancy' ? form.due_date || null : null,
        baby_birthdate: form.trackingType === 'baby' ? form.baby_birthdate || null : null,
        baby_name: form.trackingType === 'baby' ? form.baby_name || null : null,
        baby_gender: form.trackingType === 'baby' ? form.baby_gender || null : null,
        user_goal: form.user_goal || null,
        ...(profile_picture_url ? { profile_picture_url } : {}),
        setup_complete: true,
        setup_step: 4,
      })

      router.push('/dashboard')
    } catch (err) {
      console.error('Onboarding error:', err)
    } finally {
      setLoading(false)
    }
  }

  const canAdvanceStep1 = form.name.trim().length > 0
  const canAdvanceStep2 = form.trackingType !== ''
  const canAdvanceStep3 = form.user_goal !== ''

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: '#f7ede2', direction: 'rtl', fontFamily: 'var(--font-body, sans-serif)' }}
    >
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className="flex-1 h-1.5 rounded-full transition-all duration-500"
              style={{ background: s <= step ? '#7F5268' : '#e5d0c5' }}
            />
          ))}
        </div>

        {/* Step 1 — Name */}
        {step === 1 && (
          <div>
            <h1 className="text-3xl font-bold mb-2 text-center" style={{ color: '#3d2b2b' }}>
              ברוכה הבאה! 🌸
            </h1>
            <p className="text-center mb-8" style={{ color: '#7a5a5a' }}>ספרי לנו עליך</p>

            <div
              className="rounded-2xl p-6 mb-6"
              style={{ background: '#fff', border: '1px solid #e5d0c5' }}
            >
              <label className="block text-sm font-medium mb-2" style={{ color: '#3d2b2b' }}>
                שם מלא
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                placeholder="מה שמך?"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border outline-none text-base transition-all"
                style={{
                  borderColor: form.name ? '#7F5268' : '#e5d0c5',
                  background: '#fafafa',
                  color: '#3d2b2b',
                }}
              />
            </div>

            <button
              onClick={() => canAdvanceStep1 && setStep(2)}
              disabled={!canAdvanceStep1}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-40"
              style={{ background: '#7F5268' }}
            >
              הבא
            </button>
          </div>
        )}

        {/* Step 2 — Tracking type */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: '#3d2b2b' }}>
              מה מצבך?
            </h1>
            <p className="text-center mb-6" style={{ color: '#7a5a5a' }}>בחרי את המצב שמתאים לך</p>

            <div className="space-y-3 mb-4">
              {/* Pregnancy card */}
              <button
                onClick={() => update('trackingType', 'pregnancy')}
                className="w-full text-right p-5 rounded-2xl transition-all"
                style={{
                  background: form.trackingType === 'pregnancy' ? 'rgba(127,82,104,0.05)' : '#fff',
                  border: `2px solid ${form.trackingType === 'pregnancy' ? '#7F5268' : '#e5d0c5'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤰</span>
                  <span className="font-semibold text-base" style={{ color: '#3d2b2b' }}>אני בהריון</span>
                </div>
              </button>

              {form.trackingType === 'pregnancy' && (
                <div className="px-2">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a5a5a' }}>
                    תאריך לידה משוער
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => update('due_date', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border outline-none text-base"
                    style={{ borderColor: '#e5d0c5', background: '#fff', color: '#3d2b2b' }}
                  />
                </div>
              )}

              {/* Baby card */}
              <button
                onClick={() => update('trackingType', 'baby')}
                className="w-full text-right p-5 rounded-2xl transition-all"
                style={{
                  background: form.trackingType === 'baby' ? 'rgba(127,82,104,0.05)' : '#fff',
                  border: `2px solid ${form.trackingType === 'baby' ? '#7F5268' : '#e5d0c5'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👶</span>
                  <span className="font-semibold text-base" style={{ color: '#3d2b2b' }}>יש לי תינוק/ת</span>
                </div>
              </button>

              {form.trackingType === 'baby' && (
                <div className="px-2 space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a5a5a' }}>
                      תאריך לידה
                    </label>
                    <input
                      type="date"
                      value={form.baby_birthdate}
                      onChange={e => update('baby_birthdate', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl border outline-none text-base"
                      style={{ borderColor: '#e5d0c5', background: '#fff', color: '#3d2b2b' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: '#7a5a5a' }}>
                      שם התינוק/ת
                    </label>
                    <input
                      type="text"
                      value={form.baby_name}
                      onChange={e => update('baby_name', e.target.value)}
                      placeholder="מה השם?"
                      className="w-full px-4 py-3 rounded-xl border outline-none text-base"
                      style={{ borderColor: '#e5d0c5', background: '#fff', color: '#3d2b2b' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#7a5a5a' }}>מין</label>
                    <div className="flex gap-3">
                      {([['boy', 'בן'], ['girl', 'בת']] as const).map(([val, label]) => (
                        <label
                          key={val}
                          className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl flex-1 justify-center"
                          style={{
                            border: `2px solid ${form.baby_gender === val ? '#7F5268' : '#e5d0c5'}`,
                            background: form.baby_gender === val ? 'rgba(127,82,104,0.05)' : '#fff',
                            color: '#3d2b2b',
                          }}
                        >
                          <input
                            type="radio"
                            name="baby_gender"
                            value={val}
                            checked={form.baby_gender === val}
                            onChange={() => update('baby_gender', val)}
                            className="sr-only"
                          />
                          <span className="font-medium">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => canAdvanceStep2 && setStep(3)}
              disabled={!canAdvanceStep2}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-40 mb-3"
              style={{ background: '#7F5268' }}
            >
              הבא
            </button>
            <button
              onClick={() => setStep(1)}
              className="w-full py-2 text-sm font-medium transition-all"
              style={{ color: '#7F5268', background: 'transparent', border: 'none' }}
            >
              חזרה
            </button>
          </div>
        )}

        {/* Step 3 — Goal */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: '#3d2b2b' }}>
              מה הכי יעזור לך?
            </h1>
            <p className="text-center mb-6" style={{ color: '#7a5a5a' }}>בחרי את המטרה העיקרית שלך</p>

            <div className="space-y-3 mb-6">
              {([
                { value: 'learn' as const, emoji: '📚', label: 'ללמוד ולהתפתח' },
                { value: 'organize' as const, emoji: '📋', label: 'לעשות לעצמי סדר' },
                { value: 'recommendations' as const, emoji: '🛍️', label: 'לקבל המלצות ומוצרים' },
              ]).map(({ value, emoji, label }) => (
                <button
                  key={value}
                  onClick={() => update('user_goal', value)}
                  className="w-full text-right p-5 rounded-2xl transition-all"
                  style={{
                    background: form.user_goal === value ? 'rgba(127,82,104,0.05)' : '#fff',
                    border: `2px solid ${form.user_goal === value ? '#7F5268' : '#e5d0c5'}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <span className="font-semibold text-base" style={{ color: '#3d2b2b' }}>{label}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => canAdvanceStep3 && setStep(4)}
              disabled={!canAdvanceStep3}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-40 mb-3"
              style={{ background: '#7F5268' }}
            >
              הבא
            </button>
            <button
              onClick={() => setStep(2)}
              className="w-full py-2 text-sm font-medium transition-all"
              style={{ color: '#7F5268', background: 'transparent', border: 'none' }}
            >
              חזרה
            </button>
          </div>
        )}

        {/* Step 4 — Profile photo */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: '#3d2b2b' }}>
              רוצה להוסיף תמונה?
            </h1>
            <p className="text-center mb-8" style={{ color: '#7a5a5a' }}>תמונה אישית תעזור לנו להכיר אותך</p>

            {/* Photo picker */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="relative flex flex-col items-center justify-center transition-all"
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: '50%',
                  border: '2.5px dashed #7F5268',
                  background: previewUrl ? 'transparent' : 'rgba(127,82,104,0.05)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="תמונת פרופיל"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8" style={{ color: '#7F5268' }} />
                    <span className="text-xs font-medium" style={{ color: '#7F5268' }}>לחצי להוספה</span>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>

            <button
              onClick={() => handleComplete(false)}
              disabled={loading || uploading}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-60 mb-3 flex items-center justify-center gap-2"
              style={{ background: '#7F5268' }}
            >
              {(loading || uploading) ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {uploading ? 'מעלה תמונה...' : loading ? 'שומרת...' : 'סיום'}
            </button>
            <button
              onClick={() => handleComplete(true)}
              disabled={loading || uploading}
              className="w-full py-2 text-sm font-medium transition-all"
              style={{ color: '#7F5268', background: 'transparent', border: 'none' }}
            >
              דלגי
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={loading || uploading}
              className="w-full py-2 text-sm font-medium mt-1 transition-all"
              style={{ color: '#7a5a5a', background: 'transparent', border: 'none' }}
            >
              חזרה
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
