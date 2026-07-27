'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export interface SwitchOption { key: string; label: string; current: boolean }

// Owner-only segmented switch between the personal / pregnancy / admin
// accounts. The swap happens server-side (session cookies are rewritten), then
// we refresh the current route - no logout screen, no full app reload.
export default function ProfileSwitcher({ options }: { options: SwitchOption[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  if (options.length < 2) return null

  async function swap(key: string) {
    if (busy) return
    setBusy(key)
    try {
      const res = await fetch('/api/admin/switch-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      const json = await res.json()
      if (!json.ok) { alert(json.error || 'החלפת הפרופיל נכשלה'); return }
      // Admin account lands on the back-office, the others on their tracker.
      if (key === 'admin') router.push('/admin')
      else router.push(key === 'pregnancy' ? '/pregnancy' : '/tracker')
      router.refresh()
    } catch {
      alert('החלפת הפרופיל נכשלה')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      {options.map(o => (
        <button
          key={o.key}
          onClick={() => !o.current && swap(o.key)}
          disabled={!!busy || o.current}
          title={o.current ? `הפרופיל הנוכחי: ${o.label}` : `מעבר לפרופיל ${o.label}`}
          className="h-7 px-2 rounded-md text-xs font-semibold flex items-center gap-1 transition-all disabled:cursor-default"
          style={o.current
            ? { background: '#7F5268', color: '#fff' }
            : { background: 'transparent', color: 'var(--text-muted)' }}
        >
          {busy === o.key && <Loader2 className="w-3 h-3 animate-spin" />}
          {o.label}
        </button>
      ))}
    </div>
  )
}
