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
