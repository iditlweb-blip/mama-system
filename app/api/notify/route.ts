import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyRegistrationOnce, notifyPwaInstallOnce } from '@/lib/adminNotify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Admin notification hook. The browser calls this after a new signup or after
 * the PWA is installed. The user is resolved from the session cookie (never from
 * the request body), so name/email can't be spoofed, and each event is deduped
 * by a one-time flag on the profile.
 */
export async function POST(req: Request) {
  let event: string | null = null
  try {
    const body = await req.json()
    event = body?.event ?? null
  } catch {
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  // Prefer the display name from auth metadata, fall back to the profile row.
  let name = (user.user_metadata?.full_name as string | undefined) ?? null
  if (!name) {
    const admin = createAdminClient()
    const { data: profile } = await admin.from('profiles').select('name').eq('id', user.id).maybeSingle()
    name = profile?.name ?? null
  }

  try {
    if (event === 'register') {
      await notifyRegistrationOnce(user.id, name, user.email ?? null)
    } else if (event === 'pwa') {
      await notifyPwaInstallOnce(user.id, name)
    } else {
      return NextResponse.json({ ok: false, error: 'unknown event' }, { status: 400 })
    }
  } catch (err) {
    console.error('[notify] error:', err)
    // Never surface notification failures to the user's flow.
    return NextResponse.json({ ok: true, notified: false })
  }

  return NextResponse.json({ ok: true })
}
