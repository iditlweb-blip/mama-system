'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Tracks PWA installs and standalone-mode visits.
 * Saves pwa_installed_at to the user's profile once.
 */
export default function PwaTracker() {
  useEffect(() => {
    const supabase = createClient()

    async function markPwaInstalled() {
      try {
        // Wait for auth session (important on first load from home screen)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) return

        // Only update if not already set
        const { data: profile } = await supabase
          .from('profiles')
          .select('pwa_installed_at')
          .eq('id', session.user.id)
          .single()

        if (profile && !profile.pwa_installed_at) {
          await supabase
            .from('profiles')
            .update({ pwa_installed_at: new Date().toISOString() })
            .eq('id', session.user.id)
          // First install → alert the admin (server dedupes via pwa_notified).
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'pwa' }),
          }).catch(() => {})
        }
      } catch {
        // silent fail — column may not exist yet
      }
    }

    // Fires at the moment user taps "Add to Home Screen"
    window.addEventListener('appinstalled', markPwaInstalled)

    // Fires every time app is opened from home screen (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone === true)

    if (isStandalone) {
      markPwaInstalled()
    }

    return () => {
      window.removeEventListener('appinstalled', markPwaInstalled)
    }
  }, [])

  return null
}
