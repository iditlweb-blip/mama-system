import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Shared server-side security helpers: rate limiting, constant-time secret
// comparison, and small input validators. Server-only (uses the service-role
// client) - never import from a client component.

// ─── Rate limiting ──────────────────────────────────────────────────────────
// Backed by the `security_rate_limit` Postgres function (migration 040) so the
// count is shared across every Vercel instance. If that function is missing
// (migration not run yet) or the DB call fails, it falls back to a per-instance
// in-memory counter - weaker, but it never blocks a real user because of an
// infrastructure hiccup.

const memoryBuckets = new Map<string, { count: number; resetAt: number }>()

function memoryLimit(key: string, max: number, windowSec: number): boolean {
  const now = Date.now()
  const bucket = memoryBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSec * 1000 })
    if (memoryBuckets.size > 5000) {
      for (const [k, b] of memoryBuckets) if (b.resetAt <= now) memoryBuckets.delete(k)
    }
    return true
  }
  bucket.count++
  return bucket.count <= max
}

/** Returns true when the action is allowed, false when `key` exceeded `max` hits per `windowSec`. */
export async function rateLimit(key: string, max: number, windowSec: number): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc('security_rate_limit', {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSec,
    })
    if (error) return memoryLimit(key, max, windowSec)
    return data === true
  } catch {
    return memoryLimit(key, max, windowSec)
  }
}

// ─── Secrets ────────────────────────────────────────────────────────────────

/** Constant-time string comparison, so a secret can't be guessed byte-by-byte from response timing. */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const ha = crypto.createHash('sha256').update(a).digest()
  const hb = crypto.createHash('sha256').update(b).digest()
  return crypto.timingSafeEqual(ha, hb)
}

/** Checks a cron-style secret passed as `Authorization: Bearer <secret>` or `?secret=`. */
export function hasCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ') && safeEqual(auth.slice(7), secret)) return true
  return safeEqual(new URL(req.url).searchParams.get('secret'), secret)
}

// ─── Validation ─────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v)
}

/** Only same-site relative paths - blocks `//evil.com`, `/\evil.com` and scheme tricks. */
export function safeRedirectPath(v: string | null | undefined, fallback: string): string {
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.startsWith('/\\')) return fallback
  if (/[\r\n\t]/.test(v) || v.length > 512) return fallback
  return v
}

// Push services the browsers actually use. A subscription endpoint is a URL the
// server later POSTs to, so accepting any URL would let a user aim the server
// at internal addresses (SSRF).
const PUSH_HOSTS = [
  'fcm.googleapis.com',
  'android.googleapis.com',
  'updates.push.services.mozilla.com',
  'push.services.mozilla.com',
  'web.push.apple.com',
  'notify.windows.com',
]
export function isValidPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== 'string' || endpoint.length > 1024) return false
  try {
    const u = new URL(endpoint)
    if (u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    return PUSH_HOSTS.some(h => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}
