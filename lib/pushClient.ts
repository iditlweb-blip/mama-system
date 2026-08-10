'use client'

// Browser-side push subscription flow. Feature-detects support (iOS Safari
// only supports Web Push from an installed/home-screen PWA, not a regular
// browser tab) so callers can hide the UI entirely when it can't work.

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Safe)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

// Requests notification permission (if not already decided) and subscribes
// the browser to push, saving the subscription server-side. Returns whether
// the device is now subscribed.
export async function subscribeToPush(): Promise<{ ok: boolean; permission: NotificationPermission }> {
  if (!isPushSupported()) return { ok: false, permission: 'denied' }

  let permission = Notification.permission
  if (permission === 'default') permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, permission }

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) { console.warn('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set'); return { ok: false, permission } }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    })
  }

  const json = subscription.toJSON()
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
  })
  return { ok: res.ok, permission }
}
