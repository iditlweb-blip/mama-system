import crypto from 'crypto'

// Thin wrapper around the Meta WhatsApp Cloud API (Graph API). Server-side
// only — never import from a client component. All calls need:
//   WHATSAPP_ACCESS_TOKEN   — permanent (System User) access token
//   WHATSAPP_PHONE_NUMBER_ID — the "Phone number ID" from the app's
//                              WhatsApp > API Setup page (NOT the phone
//                              number itself)
//   WHATSAPP_APP_SECRET      — the Meta app's secret, used to verify the
//                              X-Hub-Signature-256 header on inbound webhooks
const GRAPH_VERSION = 'v21.0'

function apiUrl(path: string) {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${path}`
}

function accessToken() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!token) throw new Error('WHATSAPP_ACCESS_TOKEN is not set')
  return token
}

function phoneNumberId() {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!id) throw new Error('WHATSAPP_PHONE_NUMBER_ID is not set')
  return id
}

// ─── Sending ───────────────────────────────────────────────────

export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  const res = await fetch(apiUrl(`${phoneNumberId()}/messages`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('[whatsapp] sendWhatsAppText failed', res.status, errText)
  }
}

// ─── Receiving media (photos / documents users send to the bot) ──

interface MediaMeta {
  url: string
  mime_type: string
  file_size: number
}

async function fetchMediaMeta(mediaId: string): Promise<MediaMeta> {
  const res = await fetch(apiUrl(mediaId), {
    headers: { Authorization: `Bearer ${accessToken()}` },
  })
  if (!res.ok) throw new Error(`Failed to fetch media metadata for ${mediaId}: ${res.status}`)
  return res.json()
}

// Downloads a media asset a user sent to the bot (image/pdf/etc). Returns
// the raw bytes + mime type so the caller can re-upload to Supabase
// Storage — Meta's media URLs are short-lived and require the same access
// token to fetch, so they can't be linked to directly from the app.
export async function downloadWhatsAppMedia(mediaId: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const meta = await fetchMediaMeta(mediaId)
  const res = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  })
  if (!res.ok) throw new Error(`Failed to download media ${mediaId}: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  return { bytes: Buffer.from(arrayBuffer), mimeType: meta.mime_type }
}

// ─── Webhook signature verification ───────────────────────────
// Meta signs every webhook POST body with the app secret; verifying this
// stops anyone who finds the webhook URL from injecting fake messages
// (e.g. pretending to be a linked user's number).
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret || !signatureHeader) return false
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signatureHeader)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}
