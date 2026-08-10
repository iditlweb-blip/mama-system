'use client'

import { useEffect } from 'react'
import { resyncPushSubscription } from '@/lib/pushClient'

// Silent, renders nothing. See resyncPushSubscription for why this exists.
export default function PushResync() {
  useEffect(() => { resyncPushSubscription() }, [])
  return null
}
