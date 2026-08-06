'use client'

import { useEffect } from 'react'

// Registers the service worker (public/sw.js) so the app is installable - a
// requirement for the Google Play TWA wrapper. Safe no-op on browsers without
// service worker support.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    const onLoad = () => { navigator.serviceWorker.register('/sw.js').catch(() => {}) }
    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })
  }, [])
  return null
}
