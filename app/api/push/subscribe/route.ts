import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ ok: false, error: 'missing subscription fields' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, p256dh: keys.p256dh, auth_key: keys.auth },
    { onConflict: 'endpoint' },
  )
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
