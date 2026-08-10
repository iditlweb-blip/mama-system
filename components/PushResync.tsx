'use client'

import { useEffect } from 'react'
import { subscribeToPush } from '@/lib/pushClient'

// Silent, renders nothing. If permission was already granted (e.g. from an
// earlier attempt where the VAPID key wasn't deployed yet, so no browser
// subscription was ever actually created), subscribeToPush() skips the
// permission prompt entirely and just (re)creates + saves the subscription.
export default function PushResync() {
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      subscribeToPush()
    }
  }, [])
  return null
}
