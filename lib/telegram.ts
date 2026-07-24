/**
 * Minimal Telegram notifier for admin alerts.
 *
 * Configure two env vars (server-side only — never NEXT_PUBLIC):
 *   TELEGRAM_BOT_TOKEN      — from @BotFather
 *   TELEGRAM_ADMIN_CHAT_ID  — the admin's chat id (send the bot a message, then
 *                             read it from https://api.telegram.org/bot<token>/getUpdates)
 *
 * If either is missing the call is a no-op, so the app keeps working before the
 * bot is wired up.
 */
export async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!token || !chatId) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN / TELEGRAM_ADMIN_CHAT_ID not set — skipping notification')
    return false
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    if (!res.ok) {
      console.error('[telegram] sendMessage failed:', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[telegram] sendMessage error:', err)
    return false
  }
}

// Escape the few characters Telegram's HTML parse_mode treats specially.
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
