import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWhatsAppText, downloadWhatsAppMedia, verifyWebhookSignature } from '@/lib/whatsapp'
import { runWhatsAppAgent } from '@/lib/whatsappAgent'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Webhook verification (Meta calls this once when you save the URL) ──
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// ─── Inbound messages ──────────────────────────────────────────────
export async function POST(req: Request) {
  const raw = await req.text()

  // Reject anything not genuinely signed by Meta with our app secret.
  if (!verifyWebhookSignature(raw, req.headers.get('x-hub-signature-256'))) {
    return new Response('Invalid signature', { status: 401 })
  }

  let payload: WhatsAppWebhookPayload
  try {
    payload = JSON.parse(raw)
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  try {
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const messages = change.value?.messages
        if (!messages) continue // e.g. delivery/read status callbacks — ignore
        for (const message of messages) {
          await handleMessage(message)
        }
      }
    }
  } catch (e) {
    console.error('[whatsapp webhook] processing error', e)
    // Still return 200 so Meta doesn't retry-storm us over a single bad message.
  }

  return NextResponse.json({ received: true })
}

async function handleMessage(message: InboundMessage) {
  const from = message.from // E.164 without '+', e.g. 972501234567
  if (!from) return
  const supabase = createAdminClient()

  // Which app user owns this WhatsApp number?
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('whatsapp_number', from)
    .maybeSingle()

  // ── Not linked yet: expect a one-time link code from Settings ──
  if (!profile) {
    if (message.type === 'text') {
      const code = (message.text?.body ?? '').trim()
      const linked = await tryLinkNumber(supabase, from, code)
      await sendWhatsAppText(from, linked
        ? 'מעולה! 🎉 המספר שלך חובר ל-MamaFlow. מעכשיו אפשר לכתוב לי כאן — למשל "התינוק נרדם", "האכלתי בקבוק 120", או "כמה חיתולים היום?"'
        : 'שלום! 👋 כדי לחבר את הוואטסאפ שלך ל-MamaFlow, היכנסי לאפליקציה → הגדרות → "חיבור וואטסאפ", וקבלי קוד חיבור. שלחי לי אותו כאן.')
    } else {
      await sendWhatsAppText(from, 'שלום! כדי להתחיל, חברי את המספר דרך הגדרות האפליקציה ושלחי לי את קוד החיבור.')
    }
    return
  }

  const userId = profile.id as string

  // ── Media (photos / documents, e.g. lab results) ──
  if (message.type === 'image' || message.type === 'document') {
    await handleMedia(supabase, userId, from, message)
    return
  }

  // ── Voice: not handled in the text-only phase ──
  if (message.type === 'audio') {
    await sendWhatsAppText(from, 'הודעות קוליות עדיין בפיתוח 🎙️ בינתיים כתבי לי בטקסט ואשמח לעזור.')
    return
  }

  // ── Text: hand to the AI assistant (tool-calling) ──
  if (message.type === 'text') {
    const body = message.text?.body ?? ''
    if (!body.trim()) return
    const reply = await runWhatsAppAgent({ supabase, userId }, body)
    await sendWhatsAppText(from, reply)
    return
  }
}

// Matches an unused, unexpired link code to a user and stamps their number.
async function tryLinkNumber(
  supabase: ReturnType<typeof createAdminClient>,
  from: string,
  code: string,
): Promise<boolean> {
  if (!/^\d{4,8}$/.test(code)) return false
  const { data: row } = await supabase
    .from('whatsapp_link_codes')
    .select('id, user_id, expires_at, used_at')
    .eq('code', code)
    .is('used_at', null)
    .order('created_at', { ascending: false })
    .maybeSingle()
  if (!row) return false
  if (new Date(row.expires_at).getTime() < Date.now()) return false

  const { error: upErr } = await supabase
    .from('profiles')
    .update({ whatsapp_number: from })
    .eq('id', row.user_id)
  if (upErr) {
    console.error('[whatsapp link] failed to set number', upErr)
    return false
  }
  await supabase.from('whatsapp_link_codes').update({ used_at: new Date().toISOString() }).eq('id', row.id)
  return true
}

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'application/pdf': 'pdf',
}

async function handleMedia(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  from: string,
  message: InboundMessage,
) {
  const media = message.image ?? message.document
  if (!media?.id) return
  try {
    const { bytes, mimeType } = await downloadWhatsAppMedia(media.id)
    const ext = MIME_EXT[mimeType] ?? 'bin'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage
      .from('whatsapp-docs')
      .upload(path, bytes, { contentType: mimeType, upsert: false })
    if (upErr) throw upErr
    await supabase.from('whatsapp_documents').insert({
      user_id: userId,
      file_path: path,
      file_name: message.document?.filename ?? null,
      mime_type: mimeType,
      caption: message.image?.caption ?? message.document?.caption ?? null,
    })
    await sendWhatsAppText(from, 'קיבלתי את המסמך ושמרתי אותו באפליקציה 📎 תוכלי למצוא אותו במסך הבריאות.')
  } catch (e) {
    console.error('[whatsapp media] failed', e)
    await sendWhatsAppText(from, 'לא הצלחתי לשמור את הקובץ 😕 נסי לשלוח שוב.')
  }
}

// ─── Minimal typings for the slice of the webhook payload we use ──
interface MediaObject { id?: string; mime_type?: string; filename?: string; caption?: string }
interface InboundMessage {
  from?: string
  type?: 'text' | 'image' | 'document' | 'audio' | string
  text?: { body?: string }
  image?: MediaObject
  document?: MediaObject
}
interface WebhookChange { value?: { messages?: InboundMessage[] } }
interface WebhookEntry { changes?: WebhookChange[] }
interface WhatsAppWebhookPayload { entry?: WebhookEntry[] }
