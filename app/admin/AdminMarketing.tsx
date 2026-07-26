'use client'

import { useState, useTransition } from 'react'
import { Plus, Loader2, Trash2, MessageCircle, Camera, Check, Clock, Lightbulb, ExternalLink } from 'lucide-react'
import { upsertAdminContent, deleteAdminContent } from './actions'

export interface AdminContent {
  id: string
  platform: string
  title: string | null
  body: string
  status: string
  scheduled_date: string | null
  link: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = { idea: 'רעיון', scheduled: 'מתוזמן', published: 'פורסם' }
const STATUS_COLOR: Record<string, string> = { idea: '#B8860B', scheduled: '#5C6BA0', published: '#4A7C59' }

export default function AdminMarketing({ initialContent, onToast }: {
  initialContent: AdminContent[]
  onToast: (msg: string, ok?: boolean) => void
}) {
  const [items, setItems] = useState(initialContent)
  const [platform, setPlatform] = useState<'whatsapp' | 'instagram'>('whatsapp')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', status: 'idea', scheduled_date: '', link: '' })
  const [isPending, startTransition] = useTransition()

  const inputSty: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }
  const accent = platform === 'whatsapp' ? '#25D366' : '#C13584'

  function resetForm() { setForm({ title: '', body: '', status: 'idea', scheduled_date: '', link: '' }); setShowForm(false) }

  function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.body.trim()) return
    startTransition(async () => {
      const res = await upsertAdminContent({
        platform, title: form.title || undefined, body: form.body.trim(),
        status: form.status, scheduled_date: form.scheduled_date || undefined, link: form.link || undefined,
      })
      if (res.ok) { onToast('נשמר'); resetForm(); window.location.reload() }
      else onToast(res.error ?? 'שגיאה', false)
    })
  }

  function setStatus(c: AdminContent, status: string) {
    setItems(prev => prev.map(x => x.id === c.id ? { ...x, status } : x))
    startTransition(async () => {
      const res = await upsertAdminContent({
        id: c.id, platform: c.platform, title: c.title ?? undefined, body: c.body,
        status, scheduled_date: c.scheduled_date ?? undefined, link: c.link ?? undefined,
      })
      if (!res.ok) onToast(res.error ?? 'שגיאה', false)
    })
  }

  function remove(c: AdminContent) {
    if (!confirm('למחוק פריט זה?')) return
    startTransition(async () => {
      const res = await deleteAdminContent(c.id)
      if (res.ok) { setItems(prev => prev.filter(x => x.id !== c.id)); onToast('נמחק') }
      else onToast(res.error ?? 'שגיאה', false)
    })
  }

  const list = items.filter(i => i.platform === platform)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-bold text-lg" style={{ color: 'var(--text)' }}>ניהול תוכן שיווקי</h2>
        {/* platform sub-tabs */}
        <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {([
            { key: 'whatsapp', label: 'וואטסאפ', Icon: MessageCircle, color: '#25D366' },
            { key: 'instagram', label: 'אינסטגרם', Icon: Camera, color: '#C13584' },
          ] as const).map(({ key, label, Icon, color }) => (
            <button key={key} onClick={() => { setPlatform(key); setShowForm(false) }}
              className="px-4 py-2 text-sm font-medium flex items-center gap-2"
              style={platform === key ? { background: color, color: '#fff' } : { background: 'transparent', color: 'var(--text-muted)' }}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        {platform === 'whatsapp'
          ? 'תיעוד וסידור ההודעות שאת שולחת לקבוצת הוואטסאפ — רעיונות, מתוזמנים ומה שכבר פורסם.'
          : 'תכנון וסידור הפוסטים לעמוד האינסטגרם של אמא בסדר.'}
      </p>

      <div className="flex justify-end mb-4">
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: accent }}>
          <Plus className="w-4 h-4" />הוספת {platform === 'whatsapp' ? 'הודעה' : 'פוסט'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="p-4 rounded-xl mb-4 border space-y-3"
          style={{ borderColor: 'var(--border)', background: `${accent}0d` }}>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="כותרת / נושא (אופציונלי)"
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="תוכן ההודעה / הפוסט *" rows={4} required
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none" style={inputSty} />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty}>
              <option value="idea">רעיון</option>
              <option value="scheduled">מתוזמן</option>
              <option value="published">פורסם</option>
            </select>
            <input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))}
              className="px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
          </div>
          <input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
            placeholder="קישור (לפוסט שפורסם / למקור)" dir="ltr"
            className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={inputSty} />
          <div className="flex gap-2">
            <button type="submit" disabled={isPending}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-60"
              style={{ background: accent }}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}שמירה
            </button>
            <button type="button" onClick={resetForm}
              className="px-5 py-2 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>ביטול</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {list.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>אין פריטים עדיין</p>
        ) : list.map(c => (
          <div key={c.id} className="px-4 py-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {c.title && <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text)' }}>{c.title}</p>}
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>{c.body}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${STATUS_COLOR[c.status]}18`, color: STATUS_COLOR[c.status] }}>
                    {STATUS_LABEL[c.status]}
                  </span>
                  {c.scheduled_date && (
                    <span className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="w-3 h-3" />{new Date(c.scheduled_date).toLocaleDateString('he-IL')}
                    </span>
                  )}
                  {c.link && (
                    <a href={c.link} target="_blank" rel="noopener noreferrer"
                      className="text-xs inline-flex items-center gap-1" style={{ color: accent }}>
                      <ExternalLink className="w-3 h-3" />קישור
                    </a>
                  )}
                </div>
              </div>
              <button onClick={() => remove(c)} className="p-1.5 rounded-lg shrink-0"
                style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* quick status buttons */}
            <div className="flex gap-1.5 mt-2">
              {([['idea', Lightbulb], ['scheduled', Clock], ['published', Check]] as const).map(([st, Icon]) => (
                <button key={st} onClick={() => setStatus(c, st)}
                  className="text-xs px-2 py-1 rounded-lg inline-flex items-center gap-1 transition-opacity"
                  style={c.status === st
                    ? { background: STATUS_COLOR[st], color: '#fff' }
                    : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  <Icon className="w-3 h-3" />{STATUS_LABEL[st]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
