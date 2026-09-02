'use client'

import { useEffect, useState, useTransition } from 'react'
import { Mail, Loader2, Send, Users, RefreshCw } from 'lucide-react'
import { listSubscribers, sendToMailingList, type Subscriber } from './actions'

/**
 * The mailing list: everyone who ticked "send me updates" at sign-up, and a
 * box to write to all of them at once.
 *
 * Each message goes out as a separate email per recipient (see lib/email.ts),
 * so no subscriber ever sees another's address.
 */
export default function AdminMailingList({ onToast }: { onToast: (msg: string) => void }) {
  const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    listSubscribers().then(res => {
      if (res.ok && res.subscribers) { setSubscribers(res.subscribers); setLoadError(null) }
      else setLoadError(res.error ?? 'לא הצלחנו לטעון את הרשימה')
      setLoading(false)
    })
  }
  useEffect(load, [])

  function send() {
    startTransition(async () => {
      const res = await sendToMailingList(subject, body)
      if (!res.ok) { onToast(res.error ?? 'השליחה נכשלה'); setConfirming(false); return }
      onToast(
        res.failed
          ? `נשלח ל-${res.sent} נמענות, ${res.failed} נכשלו`
          : `נשלח ל-${res.sent} נמענות 🎉`,
      )
      setSubject('')
      setBody('')
      setConfirming(false)
    })
  }

  const count = subscribers?.length ?? 0

  return (
    <div className="space-y-4">
      {/* ── Compose ─────────────────────────────────────────────── */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Mail className="w-4 h-4" style={{ color: '#7F5268' }} />
            מייל לרשימת התפוצה
          </h3>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268' }}>
            {loading ? '...' : `${count} נמענות`}
          </span>
        </div>

        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="נושא המייל"
          className="w-full px-3 py-2.5 rounded-xl text-sm"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="מה חדש? אפשר לכתוב כמה פסקאות - שורה ריקה מפרידה ביניהן."
          rows={7}
          className="w-full px-3 py-2.5 rounded-xl text-sm leading-relaxed resize-y"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            disabled={!subject.trim() || !body.trim() || count === 0}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: '#7F5268' }}>
            <Send className="w-4 h-4" />
            שליחה לכל הרשימה
          </button>
        ) : (
          // Sending to the whole list can't be taken back, so it takes a second
          // deliberate click rather than one.
          <div className="space-y-2 p-3 rounded-xl" style={{ background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.25)' }}>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              לשלוח את המייל הזה ל-<b>{count}</b> נמענות? אי אפשר לבטל אחרי השליחה.
            </p>
            <div className="flex gap-2">
              <button onClick={send} disabled={pending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: '#C0392B' }}>
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {pending ? 'שולח...' : 'כן, לשלוח'}
              </button>
              <button onClick={() => setConfirming(false)} disabled={pending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Who's on it ─────────────────────────────────────────── */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text)' }}>
            <Users className="w-4 h-4" style={{ color: '#5C7A6A' }} />
            מי ברשימה
          </h3>
          <button onClick={load} className="p-1.5 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadError && (
          <p className="text-sm" style={{ color: '#C0392B' }}>{loadError}</p>
        )}

        {!loadError && !loading && count === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            עוד אף אחת לא סימנה שהיא רוצה לקבל עדכונים במייל.
          </p>
        )}

        {!loadError && count > 0 && (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {subscribers!.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 py-1.5 px-2 rounded-lg text-sm"
                style={{ background: 'var(--bg)' }}>
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--text)' }}>{s.name || 'ללא שם'}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.email}</p>
                </div>
                {s.joinedAt && (
                  <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {new Date(s.joinedAt).toLocaleDateString('he-IL')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
