import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * One-click switch between the owner account and a test profile, so the admin
 * can preview pregnancy mode without logging out and back in.
 *
 * Credentials live ONLY in server env vars - they are never sent to the
 * browser. Set these in Vercel (Production):
 *   SWITCH_A_EMAIL / SWITCH_A_PASSWORD   - the owner/admin account
 *   SWITCH_B_EMAIL / SWITCH_B_PASSWORD   - the pregnancy test profile
 *
 * The caller must already be signed in as one of the two accounts, so this
 * cannot be used to log in from nowhere.
 */
export async function POST() {
  const a = { email: process.env.SWITCH_A_EMAIL, password: process.env.SWITCH_A_PASSWORD }
  const b = { email: process.env.SWITCH_B_EMAIL, password: process.env.SWITCH_B_PASSWORD }
  if (!a.email || !a.password || !b.email || !b.password) {
    return NextResponse.json({ ok: false, error: 'החלפת פרופיל לא הוגדרה (חסרים משתני סביבה)' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const current = user?.email?.trim().toLowerCase()
  if (!current) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const isA = current === a.email.trim().toLowerCase()
  const isB = current === b.email.trim().toLowerCase()
  if (!isA && !isB) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  // Toggle to the other account.
  const target = isA ? b : a
  const { error } = await supabase.auth.signInWithPassword({
    email: target.email!, password: target.password!,
  })
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, email: target.email })
}
