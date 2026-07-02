'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    // Include the actually-detected session email in the thrown message so a
    // mismatch (wrong account logged in, stale session, etc.) is visible
    // directly in the error toast instead of requiring more back-and-forth.
    throw new Error(`Unauthorized (session email: ${user?.email ?? 'none — not logged in'})`)
  }
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
    // Use the admin (service_role) client — this sends the email automatically
    const admin = await verifyAdmin()
    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mama-system.vercel.app'}/api/auth/callback?next=/auth/reset`,
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

// ─── Professionals CRUD ────────────────────────────────────────────────────────
export async function upsertProfessional(data: {
  id?: string
  name: string
  title?: string
  phone?: string
  region?: string
  sort_order?: number
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const payload: Record<string, unknown> = {
      name: data.name,
      title: data.title ?? null,
      phone: data.phone ?? null,
      region: data.region ?? null,
      sort_order: data.sort_order ?? null,
    }
    if (data.id) payload.id = data.id

    const { error } = await admin.from('professionals').upsert(payload, { onConflict: 'id' })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    revalidatePath('/products')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteProfessional(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const { error } = await admin.from('professionals').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    revalidatePath('/products')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Products CRUD ─────────────────────────────────────────────────────────────
export async function upsertProduct(data: {
  id?: string
  name: string
  description?: string
  coupon_code?: string
  buy_link?: string
  sort_order?: number
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const payload: Record<string, unknown> = {
      name: data.name,
      description: data.description ?? null,
      coupon_code: data.coupon_code ?? null,
      buy_link: data.buy_link ?? null,
      sort_order: data.sort_order ?? null,
    }
    if (data.id) payload.id = data.id

    const { error } = await admin.from('products').upsert(payload, { onConflict: 'id' })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    revalidatePath('/products')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const { error } = await admin.from('products').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    revalidatePath('/products')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}
