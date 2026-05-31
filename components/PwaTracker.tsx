'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Tracks PWA install events and standalone mode visits.
 * Saves pwa_installed_at to the user's profile.
 * Mount this once in the app layout (client boundary).
 */
export default function PwaTracker() {
  useEffect(() => {
    const supabase = createClient()

    async function markPwaInstalled() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase
        .from('profiles')
        .update({ pwa_installed_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    // Fired when user adds to home screen
    window.addEventListener('appinstalled', markPwaInstalled)

    // If already running in standalone mode and not yet recorded
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

    if (isStandalone) {
      markPwaInstalled()
    }

    return () => {
      window.removeEventListener('appinstalled', markPwaInstalled)
    }
  }, [])

  return null
}
