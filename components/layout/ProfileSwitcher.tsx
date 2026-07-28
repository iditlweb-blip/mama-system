'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { switchToProfile, landingFor } from '@/lib/switchProfileClient'

export interface SwitchOption { key: string; label: string; current: boolean }

// Owner-only segmented switch between the tracking profiles (baby / pregnancy).
// The admin account is deliberately NOT offered here - it lives in the sidebar
// menu instead, so the mobile header stays uncluttered.
// The swap happens server-side (session cookies are rewritten), then we refresh
// the current route - no logout screen, no full app reload.
export default function ProfileSwitcher({ options }: { options: SwitchOption[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  const trackingOptions = options.filter(o => o.key !== 'admin')
  if (trackingOptions.length < 2) return null

  async function swap(key: string) {
    if (busy) return
    setBusy(key)
    const ok = await switchToProfile(key)
    if (ok) {
      router.push(landingFor(key))
      router.refresh()
    }
    setBusy(null)
  }

  return (
    <div className="flex items-center gap-0.5 p-0.5 rounded-lg"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      {trackingOptions.map(o => (
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
