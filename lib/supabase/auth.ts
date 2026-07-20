import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

// Per-request, deduplicated auth + profile helpers.
//
// Why this exists: `supabase.auth.getUser()` makes a NETWORK round-trip to the
// Supabase auth server to re-validate the JWT. On every navigation that call
// used to run 2-3 times (proxy + layout + page), each one blocking the render.
//
// Two optimisations here:
//  1. `getClaims()` verifies the JWT locally (asymmetric signing keys) instead
//     of calling the auth server — no network round-trip. The proxy already
//     validated + refreshed the session over the network for this request, so
//     the cookie is trustworthy.
//  2. `cache()` deduplicates the work across the layout and the page within a
//     single server request, so the token is decoded once, not once per file.
// The verified JWT claims for this request (decoded once, then reused). `sub`
// is the user id; `email` is the signed-in email.
export const getAuthClaims = cache(async (): Promise<Record<string, unknown> | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  return (data?.claims as Record<string, unknown> | undefined) ?? null
})

export async function getAuthUserId(): Promise<string | null> {
  const claims = await getAuthClaims()
  return (claims?.sub as string | undefined) ?? null
}

export async function getAuthEmail(): Promise<string> {
  const claims = await getAuthClaims()
  return (claims?.email as string | undefined) ?? ''
}

// The full profile row, fetched at most once per request and shared between the
// layout and any page that needs it (dashboard, pregnancy, tracker, …).
export const getProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getAuthUserId()
  if (!userId) return null
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return (data as Profile) ?? null
})
