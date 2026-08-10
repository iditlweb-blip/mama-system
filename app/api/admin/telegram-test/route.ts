import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Diagnostic: sends a real test message through the exact same Telegram
// credentials the app uses, and returns Telegram's raw response - so a bad
// token / chat id / revoked bot shows up as a real error instead of a silent
// console.error only visible in server logs. Protected by CRON_SECRET (reused
// rather than adding another env var) since this sends a real message.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  const url = new URL(req.url)
  if (!secret || url.searchParams.get('secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!token || !chatId) {
    return NextResponse.json({ ok: false, error: 'missing env vars', hasToken: !!token, hasChatId: !!chatId })
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: '🔧 בדיקת חיבור טלגרם - אם ההודעה הזו הגיעה, החיבור תקין.' }),
    })
    const body = await res.json()
    return NextResponse.json({ ok: res.ok, httpStatus: res.status, telegram: body })
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message })
  }
}
