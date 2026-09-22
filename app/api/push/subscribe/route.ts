import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidPushEndpoint, rateLimit } from '@/lib/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Saves a browser push subscription for the signed-in user. The user is
 * resolved from the session cookie (never trusted from the body), matching
 * the pattern in app/api/notify/route.ts.
 */
export async function POST(req: Request) {
  let endpoint: string | null = null
  let keys: { p256dh?: string; auth?: string } | null = null
  try {
    const body = await req.json()
    endpoint = body?.endpoint ?? null
    keys = body?.keys ?? null
  } catch {
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 })
  }
  if (!isValidPushEndpoint(endpoint) || typeof keys?.p256dh !== 'string' || typeof keys?.auth !== 'string'
      || keys.p256dh.length > 200 || keys.auth.length > 100) {
    return NextResponse.json({ ok: false, error: 'missing subscription fields' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!(await rateLimit(`push-sub:${user.id}`, 20, 3600))) {
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 })
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, p256dh: keys.p256dh, auth_key: keys.auth },
    { onConflict: 'endpoint' },
  )
  if (error) {
    console.error('[push/subscribe]', error)
    return NextResponse.json({ ok: false, error: 'save failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
