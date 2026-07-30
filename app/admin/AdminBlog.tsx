'use client'

import { useState, useTransition, useRef } from 'react'
import { Plus, Loader2, Trash2, Pencil, ExternalLink, Image as ImageIcon, Upload, FileText } from 'lucide-react'
import { upsertBlogPost, deleteBlogPost, fetchProductImage } from './actions'
import { createClient } from '@/lib/supabase/client'

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body: string
  cover_image_url: string | null
  category: string | null
  status: string
  published_at: string | null
  created_at: string
}

const emptyForm = { id: '', title: '', slug: '', excerpt: '', body: '', cover_image_url: '', category: '', status: 'draft' }

export default function AdminBlog({ initialPosts, onToast }: {
  initialPosts: BlogPost[]
  onToast: (msg: string, ok?: boolean) => void
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [fetchingImage, setFetchingImage] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  const inputSty: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }

  async function uploadFromDevice(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { onToast('צריך להתחבר', false); return }
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('blog-images').upload(path, file, { upsert: true, contentType: file.type || undefined })
      if (error) { onToast(`העלאה נכשלה: ${error.message}`, false); return }
      const { data } = supabase.storage.from('blog-images').getPublicUrl(path)
      setForm(f => ({ ...f, cover_image_url: data.publicUrl }))
      onToast('התמונה הועלתה')
    } finally {
      setUploadingImage(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function reset() { setForm(emptyForm); setShowForm(false) }

  function editPost(p: BlogPost) {
    setForm({
      id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt ?? '',
      body: p.body, cover_image_url: p.cover_image_url ?? '', category: p.category ?? '', status: p.status,
    })
    setShowForm(true)
  }

  async function grabImage() {
    if (!form.cover_image_url.trim()) return
    setFetchingImage(true)
    const res = await fetchProductImage(form.cover_image_url.trim())
    setFetchingImage(false)
    if (res.ok && res.image_url) { setForm(f => ({ ...f, cover_image_url: res.image_url! })); onToast('תמונה נמצאה') }
    else onToast(res.error ?? 'לא נמצאה תמונה', false)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) { onToast('כותרת ותוכן הן חובה', false); return }
    startTransition(async () => {
      const res = await upsertBlogPost({
        id: form.id || undefined,
        title: form.title, slug: form.slug || undefined, excerpt: form.excerpt || undefined,
        body: form.body, cover_image_url: form.cover_image_url || undefined,
        category: form.category || undefined, status: form.status,
      })
      if (!res.ok) { onToast(res.error ?? 'שגיאה', false); return }
      const saved: BlogPost = {
        id: form.id || res.id || crypto.randomUUID(), slug: res.slug ?? form.slug,
        title: form.title.trim(), excerpt: form.excerpt || null, body: form.body,
        cover_image_url: form.cover_image_url || null, category: form.category || null,
        status: form.status, published_at: form.status === 'published' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
      }
      setPosts(prev => {
        const exists = prev.some(x => x.id === saved.id)
        return exists ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev]
      })
      reset()
      onToast(form.status === 'published' ? 'הכתבה פורסמה' : 'נשמר כטיוטה')
    })
  }

  function remove(p: BlogPost) {
    if (!confirm(`למחוק את הכתבה "${p.title}"?`)) return
    startTransition(async () => {
      const res = await deleteBlogPost(p.id)
      if (res.ok) { setPosts(prev => prev.filter(x => x.id !== p.id)); onToast('נמחק') }
      else onToast(res.error ?? 'שגיאה', false)
    })
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <FileText className="w-5 h-5" style={{ color: '#7F5268' }} />הבלוג
        </h2>
        <button onClick={() => { reset(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#7F5268' }}>
          <Plus className="w-4 h-4" />כתבה חדשה
        </button>
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        כתבות לאימהות טריות. אפשר לשמור כטיוטה ולפרסם כשמוכן. התוכן נתמך ב-Markdown (כותרות עם ##, רשימות עם -, הדגשה עם **טקסט**).
      </p>

      {showForm && (
        <form onSubmit={save} className="p-4 rounded-xl mb-4 border space-y-3"
          style={{ borderColor: 'var(--border)', background: 'rgba(127,82,104,0.05)' }}>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="כותרת הכתבה *" required
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
          <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            placeholder="כתובת (slug) - אופציונלי, נוצר אוטומטית מהכותרת"
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
          <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            placeholder="קטגוריה (למשל: שינה, הנקה, התפתחות)"
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
          <textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
            placeholder="תקציר קצר (מוצג בכרטיס וברשתות)" rows={2}
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none" style={inputSty} />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="תוכן הכתבה (Markdown) *" rows={10} required
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ ...inputSty, lineHeight: 1.7 }} />
          <div className="flex gap-2 flex-wrap">
            <input value={form.cover_image_url} onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
              placeholder="קישור לתמונת שער" dir="ltr"
              className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
            <button type="button" onClick={grabImage} disabled={fetchingImage}
              className="px-3 py-2 rounded-xl text-sm border flex items-center gap-1.5 disabled:opacity-60"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              {fetchingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}שלוף מקישור
            </button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImage}
              className="px-3 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-1.5 disabled:opacity-60"
              style={{ background: '#7F5268' }}>
              {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}העלאה מהמכשיר
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={uploadFromDevice} className="hidden" />
          </div>
          {form.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.cover_image_url} alt="תצוגה מקדימה" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 10 }} />
          )}
          <div className="grid grid-cols-2 gap-3 items-center">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty}>
              <option value="draft">טיוטה</option>
              <option value="published">מפורסם</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
              style={{ background: '#7F5268' }}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}שמירה
            </button>
            <button type="button" onClick={reset}
              className="px-5 py-2 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>ביטול</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {posts.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>אין כתבות עדיין</p>
        ) : posts.map(p => (
          <div key={p.id} className="px-4 py-3 rounded-xl border flex items-start justify-between gap-3" style={{ borderColor: 'var(--border)' }}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{p.title}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={p.status === 'published'
                    ? { background: 'rgba(74,124,89,0.15)', color: '#4A7C59' }
                    : { background: 'rgba(184,134,11,0.15)', color: '#B8860B' }}>
                  {p.status === 'published' ? 'מפורסם' : 'טיוטה'}
                </span>
                {p.category && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.category}</span>}
              </div>
              {p.excerpt && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{p.excerpt}</p>}
              {p.status === 'published' && (
                <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs inline-flex items-center gap-1 mt-1" style={{ color: '#7F5268' }}>
                  <ExternalLink className="w-3 h-3" />צפייה בכתבה
                </a>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => editPost(p)} className="p-1.5 rounded-lg"
                style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268' }}>
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => remove(p)} className="p-1.5 rounded-lg"
                style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
