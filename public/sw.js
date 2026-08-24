/* Minimal, deliberately conservative service worker.
 *
 * It ONLY cache-serves immutable, content-hashed static assets
 * (/_next/static, /fonts, /icons). Everything else - all HTML, API calls,
 * Supabase, dynamic data - goes straight to the network untouched, so there is
 * no risk of serving stale pages to the live site. Its main job is to make the
 * app installable (a PWA requirement for the Google Play TWA wrapper).
 */
const CACHE = 'momsok-static-v1'
const STATIC = /\/(?:_next\/static|fonts|icons)\//

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop old caches from previous versions.
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // Only handle same-origin immutable static assets; ignore everything else.
  if (url.origin !== self.location.origin || !STATIC.test(url.pathname)) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) cache.put(request, response.clone())
      return response
    })
  )
})

/* ── Web Push ──────────────────────────────────────────────────────────────
 * Payload is JSON: { title, body, url, tag, ongoing, clear }. url is opened
 * (or focused if already open) on click.
 *
 * The notification's own title is always the app-branded line; the specific
 * message (payload.title, e.g. "עדיין לא תיעדת שינה היום") moves into the body
 * along with payload.body, so every push reads as "message from the app" +
 * its content instead of a bare headline.
 *
 * Two flags change that shape:
 *   ongoing - a live status (the running sleep timer), not a message. It keeps
 *     its own title, is re-sent every few minutes under a fixed tag so each
 *     push REPLACES the previous one instead of stacking, and is silent +
 *     requireInteraction so it sits in the tray without buzzing on every
 *     refresh.
 *   clear - not a notification at all: dismisses whatever is showing under
 *     that tag (sent when the timer stops).
 */
const APP_TITLE = 'הודעה מהאפליקציה "אמא בסדר"'

self.addEventListener('push', (event) => {
  let data = { title: '', body: '', url: '/dashboard' }
  try { if (event.data) data = { ...data, ...event.data.json() } } catch { /* keep defaults */ }

  // A dismiss-only push: close the matching notification, show nothing.
  if (data.clear) {
    event.waitUntil(
      (async () => {
        const showing = await self.registration.getNotifications({ tag: data.tag })
        showing.forEach((n) => n.close())
      })()
    )
    return
  }

  const fullBody = [data.title, data.body].filter(Boolean).join('\n')

  event.waitUntil(
    self.registration.showNotification(data.ongoing ? data.title : APP_TITLE, {
      body: data.ongoing ? data.body : fullBody,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag,
      data: { url: data.url },
      dir: 'rtl',
      lang: 'he',
      // A status refresh must not buzz or re-alert - it only updates in place.
      silent: !!data.ongoing,
      renotify: false,
      requireInteraction: !!data.ongoing,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/dashboard'
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const target = new URL(url, self.location.origin).href
      for (const client of clientsList) {
        if (client.url === target && 'focus' in client) return client.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })()
  )
})
