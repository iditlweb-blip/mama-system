'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Repeat, Loader2 } from 'lucide-react'

// Owner-only quick toggle between the main account and the pregnancy test
// profile. The swap happens server-side (cookies are rewritten), then we just
// refresh the current route - no logout screen, no full app reload.
export default function ProfileSwitcher({ label }: { label: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function swap() {
    if (busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/switch-profile', { method: 'POST' })
      const json = await res.json()
      if (!json.ok) { alert(json.error || 'החלפת הפרופיל נכשלה'); return }
      router.refresh()
    } catch {
      alert('החלפת הפרופיל נכשלה')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={swap}
      disabled={busy}
      title={`מעבר ל${label}`}
      className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 transition-all hover:opacity-70 disabled:opacity-50"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      {busy
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#7F5268' }} />
        : <Repeat className="w-3.5 h-3.5" style={{ color: '#7F5268' }} />}
      <span className="text-xs font-semibold" style={{ color: '#7F5268' }}>{label}</span>
    </button>
  )
}
