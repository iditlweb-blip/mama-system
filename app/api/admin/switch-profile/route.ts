import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ADMIN_EMAIL, isAdminEmail } from '@/lib/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Email of the pregnancy test profile. Override with TEST_PROFILE_EMAIL in env.
const TEST_EMAIL = process.env.TEST_PROFILE_EMAIL || 'dana@gmail.com'

/**
 * One-click switch between the owner account and the pregnancy test profile,
 * so pregnancy mode can be previewed without logging out and back in.
 *
 * No passwords anywhere: the service-role key mints a one-time magic-link token
 * for the target account, which we immediately redeem into a session on this
 * request. That means it works even though the owner signs in with Google (an
 * OAuth account has no password to store).
 *
 * Only a session that is already the owner or the test profile may call this,
 * so it can never be used to log in from nothing.
 */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const current = user?.email?.trim().toLowerCase()
  if (!current) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const isOwner = isAdminEmail(current)
  const isTest = current === TEST_EMAIL.trim().toLowerCase()
  if (!isOwner && !isTest) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  const target = isOwner ? TEST_EMAIL : ADMIN_EMAIL

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: target })
  if (error || !data?.properties?.hashed_token) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? `לא נמצא משתמש עם המייל ${target}` },
      { status: 400 },
    )
  }

  // Redeeming the token here swaps the session cookies to the target account.
  const { error: verifyErr } = await supabase.auth.verifyOtp({
    type: 'magiclink',
    token_hash: data.properties.hashed_token,
  })
  if (verifyErr) return NextResponse.json({ ok: false, error: verifyErr.message }, { status: 400 })

  return NextResponse.json({ ok: true, email: target })
}
