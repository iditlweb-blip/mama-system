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
    throw new Error(`Unauthorized (session email: ${user?.email ?? 'none - not logged in'})`)
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
    // Use the admin (service_role) client - this sends the email automatically
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

// ─── App settings: products page on/off toggle ─────────────────────────────────
export async function setProductsEnabled(enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const { error } = await admin.from('app_settings').upsert(
      { key: 'products_enabled', value: enabled, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    revalidatePath('/products')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── App settings: WhatsApp group link + visibility ────────────────────────────
export async function setWhatsappGroup(url: string, visible: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const { error } = await admin.from('app_settings').upsert(
      { key: 'whatsapp_group', value: { url, visible }, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    revalidatePath('/settings')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── App settings: professionals sign-up form + responses sheet links ──────────
export async function setProForm(formUrl: string, sheetUrl: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const { error } = await admin.from('app_settings').upsert(
      { key: 'pro_form', value: { formUrl, sheetUrl }, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Back-office: App tasks CRUD ────────────────────────────────────────────────
export async function upsertAdminTask(data: {
  id?: string
  title: string
  notes?: string
  status?: string
  priority?: string
  sort_order?: number
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const payload: Record<string, unknown> = {
      title: data.title,
      notes: data.notes ?? null,
      status: data.status ?? 'todo',
      priority: data.priority ?? 'medium',
      sort_order: data.sort_order ?? null,
    }
    if (data.id) payload.id = data.id
    const { error } = await admin.from('admin_tasks').upsert(payload, { onConflict: 'id' })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteAdminTask(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const { error } = await admin.from('admin_tasks').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Back-office: Marketing content CRUD ────────────────────────────────────────
export async function upsertAdminContent(data: {
  id?: string
  platform: string
  title?: string
  body: string
  status?: string
  scheduled_date?: string
  link?: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const payload: Record<string, unknown> = {
      platform: data.platform,
      title: data.title ?? null,
      body: data.body,
      status: data.status ?? 'idea',
      scheduled_date: data.scheduled_date || null,
      link: data.link ?? null,
    }
    if (data.id) payload.id = data.id
    const { error } = await admin.from('admin_content').upsert(payload, { onConflict: 'id' })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteAdminContent(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const { error } = await admin.from('admin_content').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Back-office: Payments CRUD ─────────────────────────────────────────────────
export async function upsertAdminPayment(data: {
  id?: string
  name: string
  amount: number
  currency?: string
  recurrence?: string
  due_date?: string
  paid?: boolean
  notes?: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const payload: Record<string, unknown> = {
      name: data.name,
      amount: data.amount,
      currency: data.currency ?? 'ILS',
      recurrence: data.recurrence ?? 'monthly',
      due_date: data.due_date || null,
      paid: data.paid ?? false,
      notes: data.notes ?? null,
    }
    if (data.id) payload.id = data.id
    const { error } = await admin.from('admin_payments').upsert(payload, { onConflict: 'id' })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteAdminPayment(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const { error } = await admin.from('admin_payments').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

// ─── Back-office: WhatsApp / group notes CRUD ───────────────────────────────────
export async function upsertAdminNote(data: {
  id?: string
  body: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const payload: Record<string, unknown> = { body: data.body }
    if (data.id) payload.id = data.id
    const { error } = await admin.from('admin_notes').upsert(payload, { onConflict: 'id' })
    if (error) return { ok: false, error: error.message }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e: unknown) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function deleteAdminNote(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const { error } = await admin.from('admin_notes').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
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
  details?: string
  category?: string
  image_url?: string
  coupon_code?: string
  buy_link?: string
  sort_order?: number
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const admin = await verifyAdmin()
    const payload: Record<string, unknown> = {
      name: data.name,
      description: data.description ?? null,
      details: data.details ?? null,
      category: data.category?.trim() || 'כללי',
      image_url: data.image_url ?? null,
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

// Fetch a product image (og:image / twitter:image) from a product page URL.
export async function fetchProductImage(url: string): Promise<{ ok: boolean; image_url?: string; error?: string }> {
  try {
    await verifyAdmin()
    if (!url || !/^https?:\/\//i.test(url)) {
      return { ok: false, error: 'קישור לא תקין' }
    }
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MamaFlowBot/1.0; +https://mamaflow.app)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    if (!res.ok) return { ok: false, error: `שגיאה בטעינת האתר (${res.status})` }
    const html = await res.text()

    const pick = (re: RegExp): string | null => {
      const m = html.match(re)
      return m ? m[1] : null
    }
    // Try several meta tags (property/name order varies between sites)
    let img =
      pick(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/i) ||
      pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i) ||
      pick(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)

    if (!img) return { ok: false, error: 'לא נמצאה תמונה באתר' }

    // Resolve relative URLs against the page URL
    try { img = new URL(img, url).href } catch { /* keep as-is */ }

    return { ok: true, image_url: img }
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
