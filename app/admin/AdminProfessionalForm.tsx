'use client'

import { useRef, useState, useTransition } from 'react'
import { Loader2, Upload, Trash2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { upsertProfessional } from './actions'
import ProfessionalCard, { ProAvatar } from '@/components/professionals/ProfessionalCard'
import type { Professional } from '@/components/professionals/types'

// Add / edit form for a professional — the same fields as the Google sign-up
// form, with a profile-photo upload and a live preview of the card exactly as
// it appears in the app. Used for both "add" (initial = null) and "edit".

type FormState = Record<
  'name' | 'title' | 'phone' | 'email' | 'region' | 'category' | 'service_mode' | 'image_url' |
  'tagline' | 'about' | 'credentials' | 'services' | 'price_range' | 'response_time' |
  'benefit' | 'coupon_code' | 'benefit_terms' | 'benefit_valid_until' |
  'instagram' | 'website' | 'facebook' | 'sort_order', string
> & { id: string; is_active: boolean }

function toForm(p: Professional | null): FormState {
  const v = (x: string | null | undefined) => x ?? ''
  return {
    id: p?.id ?? '', name: v(p?.name), title: v(p?.title), phone: v(p?.phone), email: v(p?.email),
    region: v(p?.region), category: v(p?.category), service_mode: v(p?.service_mode),
    image_url: v(p?.image_url), tagline: v(p?.tagline), about: v(p?.about),
    credentials: v(p?.credentials), services: v(p?.services), price_range: v(p?.price_range),
    response_time: v(p?.response_time), benefit: v(p?.benefit), coupon_code: v(p?.coupon_code),
    benefit_terms: v(p?.benefit_terms), benefit_valid_until: v(p?.benefit_valid_until),
    instagram: v(p?.instagram), website: v(p?.website), facebook: v(p?.facebook),
    sort_order: p?.sort_order?.toString() ?? '', is_active: p?.is_active ?? true,
  }
}

const inputSty: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }
const inputCls = 'w-full px-3 py-2 rounded-xl border text-sm outline-none'

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="block text-xs font-medium mb-1" style={{ color: 'var(--text)' }}>{label}</span>
      {children}
      {hint && <span className="block text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{hint}</span>}
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border p-3 sm:p-4" style={{ borderColor: 'var(--border)', background: '#fff' }}>
      <legend className="px-2 text-sm font-semibold" style={{ color: '#7F5268' }}>{title}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export default function AdminProfessionalForm({ initial, onSaved, onCancel, onToast }: {
  initial: Professional | null
  onSaved: () => void
  onCancel: () => void
  onToast: (msg: string, ok?: boolean) => void
}) {
  const [f, setF] = useState<FormState>(() => toForm(initial))
  const [uploading, setUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF(prev => ({ ...prev, [key]: e.target.value }))

  // Same bucket + path convention as the blog editor (admin-only write,
  // public read): blog-images/<admin-uid>/professionals/<file>
  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { onToast('צריך להתחבר', false); return }
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/professionals/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('blog-images').upload(path, file, { upsert: true, contentType: file.type || undefined })
      if (error) { onToast(`העלאה נכשלה: ${error.message}`, false); return }
      const { data } = supabase.storage.from('blog-images').getPublicUrl(path)
      setF(prev => ({ ...prev, image_url: data.publicUrl }))
      onToast('התמונה הועלתה')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!f.name.trim()) return
    const { id, sort_order, is_active, ...text } = f
    startTransition(async () => {
      const res = await upsertProfessional({
        ...text,
        id: id || undefined,
        sort_order: sort_order ? parseInt(sort_order) : undefined,
        is_active,
      })
      if (res.ok) {
        onToast(id ? 'הכרטיס עודכן' : 'איש/ת המקצוע נוספ/ה')
        onSaved()
      } else {
        onToast(res.error ?? 'שגיאה בשמירה', false)
      }
    })
  }

  const preview: Professional = {
    ...f, id: f.id || 'preview', name: f.name || 'שם איש/ת המקצוע',
    sort_order: f.sort_order ? parseInt(f.sort_order) : null,
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 sm:p-4 rounded-xl mb-4 border"
      style={{ borderColor: 'var(--border)', background: 'rgba(127,82,104,0.04)' }}>
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
          {f.id ? `עריכת הכרטיס של ${initial?.name ?? ''}` : 'הוספת איש/ת מקצוע'}
        </p>
        <button type="button" onClick={() => setShowPreview(v => !v)}
          className="text-xs inline-flex items-center gap-1 lg:hidden" style={{ color: '#7F5268' }}>
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showPreview ? 'הסתרת תצוגה מקדימה' : 'תצוגה מקדימה'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Fields ── */}
        <div className="space-y-4 min-w-0">
          <Section title="פרטים בסיסיים">
            <Field label="שם מלא *">
              <input value={f.name} onChange={set('name')} required className={inputCls} style={inputSty} />
            </Field>
            <Field label="תואר מקצועי (כפי שיופיע בכרטיס)">
              <input value={f.title} onChange={set('title')} placeholder="יועצת שינה" className={inputCls} style={inputSty} />
            </Field>
            <Field label="תחום עיקרי">
              <input value={f.category} onChange={set('category')} placeholder="שינה, הנקה, פיזיותרפיה…" className={inputCls} style={inputSty} />
            </Field>
            <Field label="אזור פעילות">
              <input value={f.region} onChange={set('region')} placeholder="השרון, מרכז, צפון…" className={inputCls} style={inputSty} />
            </Field>
            <Field label="אופן מתן השירות">
              <input value={f.service_mode} onChange={set('service_mode')} list="pro-service-modes" placeholder="פרונטלי ואונליין" className={inputCls} style={inputSty} />
              <datalist id="pro-service-modes">
                <option value="פרונטלי" /><option value="אונליין" /><option value="פרונטלי ואונליין" /><option value="ביקורי בית" />
              </datalist>
            </Field>
            <Field label="זמן תגובה ממוצע">
              <input value={f.response_time} onChange={set('response_time')} placeholder="תוך יומיים" className={inputCls} style={inputSty} />
            </Field>
          </Section>

          <Section title="תמונת פרופיל">
            <div className="sm:col-span-2 flex items-center gap-4 flex-wrap">
              <div className="rounded-full" style={{ boxShadow: '0 4px 12px rgba(127,82,104,0.2)' }}>
                <ProAvatar pro={f} size={80} border={4} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: '#7F5268' }}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {f.image_url ? 'החלפת תמונה' : 'העלאת תמונה'}
                </button>
                {f.image_url && (
                  <button type="button" onClick={() => setF(p => ({ ...p, image_url: '' }))}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border"
                    style={{ borderColor: 'var(--border)', color: '#C0392B' }}>
                    <Trash2 className="w-4 h-4" />הסרה
                  </button>
                )}
              </div>
            </div>
            <Field label="או קישור לתמונה" wide hint="עד 5MB · עדיף תמונה מרובעת · בלי תמונה יוצג הלוגו של אמא בסדר">
              <input value={f.image_url} onChange={set('image_url')} dir="ltr" placeholder="https://…" className={inputCls} style={inputSty} />
            </Field>
          </Section>

          <Section title="על עצמי">
            <Field label="משפט אחד שמתאר אותך" wide>
              <input value={f.tagline} onChange={set('tagline')} className={inputCls} style={inputSty} />
            </Field>
            <Field label="קצת עליי" wide>
              <textarea value={f.about} onChange={set('about')} rows={4} className={inputCls} style={inputSty} />
            </Field>
            <Field label="הכשרה והסמכות" wide>
              <input value={f.credentials} onChange={set('credentials')} className={inputCls} style={inputSty} />
            </Field>
            <Field label="השירותים שאת/ה נותן/ת" wide hint="שירות אחד בכל שורה">
              <textarea value={f.services} onChange={set('services')} rows={4} className={inputCls} style={inputSty} />
            </Field>
            <Field label="טווח מחירים" wide>
              <input value={f.price_range} onChange={set('price_range')} placeholder="₪350–₪1,200" className={inputCls} style={inputSty} />
            </Field>
          </Section>

          <Section title="הטבה לאמהות">
            <Field label="מהי ההטבה?" wide>
              <input value={f.benefit} onChange={set('benefit')} placeholder="15% הנחה על ליווי ייעוץ שינה" className={inputCls} style={inputSty} />
            </Field>
            <Field label="קוד קופון">
              <input value={f.coupon_code} onChange={set('coupon_code')} dir="ltr" className={inputCls} style={inputSty} />
            </Field>
            <Field label="תוקף ההטבה" hint="אחרי התאריך ההטבה תוסתר אוטומטית">
              <input type="date" value={f.benefit_valid_until} onChange={set('benefit_valid_until')} className={inputCls} style={inputSty} />
            </Field>
            <Field label="תנאים והגבלות" wide>
              <textarea value={f.benefit_terms} onChange={set('benefit_terms')} rows={2} className={inputCls} style={inputSty} />
            </Field>
          </Section>

          <Section title="יצירת קשר וקישורים">
            <Field label="טלפון לוואטסאפ">
              <input value={f.phone} onChange={set('phone')} dir="ltr" placeholder="05X-XXXXXXX" className={inputCls} style={inputSty} />
            </Field>
            <Field label="אימייל ליצירת קשר">
              <input type="email" value={f.email} onChange={set('email')} dir="ltr" className={inputCls} style={inputSty} />
            </Field>
            <Field label="אינסטגרם" hint="@שם או קישור מלא">
              <input value={f.instagram} onChange={set('instagram')} dir="ltr" className={inputCls} style={inputSty} />
            </Field>
            <Field label="אתר אינטרנט">
              <input value={f.website} onChange={set('website')} dir="ltr" className={inputCls} style={inputSty} />
            </Field>
            <Field label="פייסבוק" wide>
              <input value={f.facebook} onChange={set('facebook')} dir="ltr" className={inputCls} style={inputSty} />
            </Field>
          </Section>

          <Section title="תצוגה">
            <Field label="סדר תצוגה" hint="מספר נמוך מופיע ראשון">
              <input type="number" value={f.sort_order} onChange={set('sort_order')} className={inputCls} style={inputSty} />
            </Field>
            <label className="flex items-center gap-2 self-center text-sm cursor-pointer" style={{ color: 'var(--text)' }}>
              <input type="checkbox" checked={f.is_active} onChange={e => setF(p => ({ ...p, is_active: e.target.checked }))}
                className="h-4 w-4" style={{ accentColor: '#7F5268' }} />
              מוצג באפליקציה
            </label>
          </Section>
        </div>

        {/* ── Live preview ── */}
        <div className={`min-w-0 ${showPreview ? '' : 'hidden lg:block'}`}>
          <div className="lg:sticky lg:top-4">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>תצוגה מקדימה – כך הכרטיס ייראה באפליקציה</p>
            <ProfessionalCard pro={preview} showExpiredBenefit />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 sticky bottom-0 py-2" style={{ background: 'linear-gradient(transparent, #faf5f0 30%)' }}>
        <button type="submit" disabled={isPending || uploading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
          style={{ background: '#7F5268' }}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}שמירה
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm border bg-white"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>ביטול</button>
      </div>
    </form>
  )
}
