import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'
import { ADMIN_EMAIL } from '@/lib/admin'

/**
 * Server-side Web Push sender. Needs three env vars (server-only):
 *   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY  - from `npx web-push generate-vapid-keys`
 *   VAPID_SUBJECT                          - "mailto:someone@example.com"
 * NEXT_PUBLIC_VAPID_PUBLIC_KEY (same value as VAPID_PUBLIC_KEY) is also needed
 * client-side, to subscribe the browser.
 *
 * If the env vars are missing, sends are silently skipped (console.warn) so the
 * app keeps working before push is configured - same pattern as lib/telegram.ts.
 */

let configured = false
function ensureConfigured(): boolean {
  if (configured) return true
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!pub || !priv || !subject) {
    console.warn('[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT not set - skipping push')
    return false
  }
  webpush.setVapidDetails(subject, pub, priv)
  configured = true
  return true
}

export interface PushPayload {
  title: string
  body: string
  url?: string   // opened on notification click, defaults to '/dashboard'
  tag?: string   // replaces a previous notification with the same tag instead of stacking
}

interface SubRow { id: string; endpoint: string; p256dh: string; auth_key: string }

// Sends to every subscription row given, pruning any that the push service
// reports as gone (410/404 - the browser unsubscribed or the endpoint expired).
async function sendToSubscriptions(subs: SubRow[], payload: PushPayload): Promise<void> {
  if (!ensureConfigured() || subs.length === 0) return
  const admin = createAdminClient()
  const body = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? '/dashboard', tag: payload.tag })

  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        body,
      )
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode
      if (statusCode === 404 || statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', sub.id)
      } else {
        console.error('[push] send failed:', err)
      }
    }
  }))
}

export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const admin = createAdminClient()
  const { data } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth_key').eq('user_id', userId)
  await sendToSubscriptions((data ?? []) as SubRow[], payload)
}

// Looks up the owner's account by ADMIN_EMAIL and pushes to all her devices.
export async function sendPushToAdmin(payload: PushPayload): Promise<void> {
  const admin = createAdminClient()
  const { data: users, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) { console.error('[push] listUsers failed:', error.message); return }
  const owner = users.users.find(u => u.email?.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase())
  if (!owner) return
  await sendPushToUser(owner.id, payload)
}

// Broadcasts to every subscribed device across all users - e.g. "a community
// question just got approved". Use sparingly; this reaches everyone at once.
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  const admin = createAdminClient()
  const { data } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth_key')
  await sendToSubscriptions((data ?? []) as SubRow[], payload)
}
