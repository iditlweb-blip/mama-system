/**
 * Bulk email to the mailing list, sent through Resend's REST API with plain
 * fetch - no SDK, matching how lib/telegram.ts talks to its provider.
 *
 * Needs two server-only env vars:
 *   RESEND_API_KEY  - from resend.com
 *   EMAIL_FROM      - e.g. 'אמא בסדר <hi@moms-ok.com>', on a domain verified
 *                     with Resend, or delivery will be rejected
 *
 * With either missing, sends are skipped and the caller is told so it can say
 * as much out loud - the same pattern the push and Telegram helpers use, so the
 * app keeps working before email is configured.
 */

const ENDPOINT = 'https://api.resend.com/emails'
// Resend accepts up to 50 recipients per call; we send one request per
// recipient anyway so nobody sees anyone else's address.
const CONCURRENCY = 8

export interface BulkResult {
  configured: boolean
  sent: number
  failed: number
  /** Set when nothing could be sent, phrased for the admin screen. */
  reason?: string
}

function config(): { key: string; from: string } | null {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) {
    console.warn('[email] RESEND_API_KEY / EMAIL_FROM not set - skipping send')
    return null
  }
  return { key, from }
}

async function sendOne(key: string, from: string, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, html }),
    })
    if (!res.ok) {
      console.error('[email] send failed:', to, res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (err) {
    console.error('[email] send threw:', to, err)
    return false
  }
}

/**
 * One message per recipient, a few at a time. Sending individually rather than
 * one message with everyone in `to` matters: a shared To: line would expose
 * every subscriber's address to every other subscriber.
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string,
): Promise<BulkResult> {
  const cfg = config()
  if (!cfg) {
    return { configured: false, sent: 0, failed: 0, reason: 'שליחת מיילים לא מוגדרת עדיין (חסרים RESEND_API_KEY ו-EMAIL_FROM)' }
  }
  const clean = [...new Set(recipients.map(r => r.trim().toLowerCase()).filter(Boolean))]
  if (clean.length === 0) return { configured: true, sent: 0, failed: 0, reason: 'אין נמענים ברשימה' }

  let sent = 0
  let failed = 0
  for (let i = 0; i < clean.length; i += CONCURRENCY) {
    const batch = clean.slice(i, i + CONCURRENCY)
    const results = await Promise.all(batch.map(to => sendOne(cfg.key, cfg.from, to, subject, html)))
    for (const ok of results) ok ? sent++ : failed++
  }
  return { configured: true, sent, failed }
}
