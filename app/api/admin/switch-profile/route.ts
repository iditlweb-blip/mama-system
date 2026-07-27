import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { switchProfiles, findProfileByEmail } from '@/lib/switchProfiles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One-click switch between the owner's accounts (personal / pregnancy / admin)
 * so the app can be checked in every mode without logging out and back in.
 *
 * No passwords anywhere: the service-role key mints a one-time magic-link token
 * for the target account, redeemed immediately on this request. That matters
 * because these accounts sign in with Google and have no password to store.
 *
 * The caller must already be signed in as one of the configured profiles, so
 * this can never be used to log in from nothing.
 */
export async function POST(req: Request) {
  let key: string | null = null
  try {
    const body = await req.json()
    key = typeof body?.key === 'string' ? body.key : null
  } catch { /* no body - fall through to the 400 below */ }
  if (!key) return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  // Only someone already inside the switch group may hop between accounts.
  if (!findProfileByEmail(user.email)) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const target = switchProfiles().find(p => p.key === key)
  if (!target) return NextResponse.json({ ok: false, error: 'unknown profile' }, { status: 400 })
  if (target.email === user.email.trim().toLowerCase()) {
    return NextResponse.json({ ok: true, email: target.email })  // already there
  }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: target.email })
  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? `לא נמצא משתמש עם המייל ${target.email}` },
      { status: 400 },
    )
  }

  // Redeeming the token swaps the session cookies to the target account.
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: data.properties.hashed_token,
  })
  if (verifyErr) return NextResponse.json({ ok: false, error: verifyErr.message }, { status: 400 })

  return NextResponse.json({ ok: true, email: target.email })
}
