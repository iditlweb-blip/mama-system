import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { notifyRegistrationOnce } from '@/lib/adminNotify'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Optional redirect target after a successful code exchange (e.g. password
  // recovery links should land on /auth/reset instead of /dashboard).
  // Restricted to a same-app relative path to avoid open-redirect issues.
  const nextParam = searchParams.get('next')
  const next = nextParam && nextParam.startsWith('/') ? nextParam : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // First arrival via OAuth or an email-confirmation link - alert the admin
      // once (the helper dedupes, so re-logins never re-notify). Must be
      // awaited: a fire-and-forget call here races the serverless function
      // freezing right after the redirect response is sent, which can kill
      // the in-flight Telegram request before it completes - the DB flag
      // still gets set (so it silently never retries), but the message never
      // arrives. Wrapped in try/catch so a Telegram hiccup still can't block
      // the redirect itself.
      const user = data?.user
      if (user) {
        try {
          await notifyRegistrationOnce(
            user.id,
            (user.user_metadata?.full_name as string | undefined) ?? null,
            user.email ?? null,
            (user.app_metadata?.provider as string | undefined) ?? null,
          )
        } catch (err) {
          console.error('[notify] registration (callback):', err)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}
