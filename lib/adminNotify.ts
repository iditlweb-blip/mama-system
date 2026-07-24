import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegram, escapeHtml } from '@/lib/telegram'

/**
 * One-time admin alerts. Each helper flips a boolean flag on the profile with a
 * conditional UPDATE (…eq(flag, false)…select()) so it fires exactly once even
 * if called from several places (client + OAuth callback) or concurrently.
 */

export async function notifyRegistrationOnce(
  userId: string,
  name: string | null,
  email: string | null,
): Promise<void> {
  const admin = createAdminClient()
  // Atomically claim the notification: only the first caller gets a row back.
  const { data } = await admin
    .from('profiles')
    .update({ registered_notified: true })
    .eq('id', userId)
    .eq('registered_notified', false)
    .select('id')
  if (!data || data.length === 0) return

  const displayName = escapeHtml(name?.trim() || 'ללא שם')
  const displayEmail = escapeHtml(email || 'ללא מייל')
  await sendTelegram(
    `🎉 <b>נרשמה משתמשת חדשה</b>\n\nשם: <b>${displayName}</b>\nמייל: ${displayEmail}`,
  )
}

export async function notifyPwaInstallOnce(
  userId: string,
  name: string | null,
): Promise<void> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .update({ pwa_notified: true })
    .eq('id', userId)
    .eq('pwa_notified', false)
    .select('id')
  if (!data || data.length === 0) return

  const displayName = escapeHtml(name?.trim() || 'משתמשת')
  await sendTelegram(`📲 <b>${displayName}</b> התקינה את האפליקציה בטלפון שלה`)
}
