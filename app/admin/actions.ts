'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = 'iditlweb@gmail.com'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('Unauthorized')
  return createAdminClient()
}

// ─── Delete user ───────────────────────────────────────────────────────────────
export async function deleteUser(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Send password reset email ─────────────────────────────────────────────────
export async function sendPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await verifyAdmin()
    // Use regular auth (not admin) — this sends the email automatically
    const admin = await verifyAdmin()
    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mama-system.vercel.app'}/auth/reset`,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Create user manually ──────────────────────────────────────────────────────
export async function createUserByAdmin(
  email: string,
  password: string,
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name: name },
      email_confirm: true, // skip email verification
    })
    if (error) return { ok: false, error: error.message }

    // Create profile row
    if (data.user) {
      await admin.from('profiles').upsert({
        id: data.user.id,
        name,
      }, { onConflict: 'id' })
    }

    revalidatePath('/admin')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}
