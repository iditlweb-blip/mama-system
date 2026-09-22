import { streamGroqResponse } from '@/lib/groq'
import { createClient } from '@/lib/supabase/server'
import { ChatMode } from '@/types/database'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security'

export const dynamic = 'force-dynamic'

const MODES: ChatMode[] = ['baby', 'time', 'business', 'emotional', 'pregnancy']
const MAX_MESSAGES = 40
const MAX_CONTENT = 4000

// Only 'user' / 'assistant' turns pass through - a client-supplied 'system'
// message would otherwise override the assistant's instructions.
function parseChatBody(body: unknown): { messages: Array<{ role: 'user' | 'assistant'; content: string }>; mode: ChatMode } | null {
  if (!body || typeof body !== 'object') return null
  const { messages, mode } = body as { messages?: unknown; mode?: unknown }
  if (!MODES.includes(mode as ChatMode) || !Array.isArray(messages) || messages.length === 0) return null
  const clean = messages.slice(-MAX_MESSAGES).map(m => {
    const { role, content } = (m ?? {}) as { role?: unknown; content?: unknown }
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') return null
    return { role, content: content.slice(0, MAX_CONTENT) } as { role: 'user' | 'assistant'; content: string }
  })
  if (clean.some(m => m === null)) return null
  return { messages: clean as Array<{ role: 'user' | 'assistant'; content: string }>, mode: mode as ChatMode }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Chat is switched off from /admin by default - the page redirects, and the
    // API must refuse too, or a direct POST would still reach the AI provider.
    const { data: chatSetting } = await supabase
      .from('app_settings').select('value').eq('key', 'chat_enabled').maybeSingle()
    if (chatSetting?.value !== true) {
      return NextResponse.json({ error: 'Chat disabled' }, { status: 403 })
    }

    // Each call costs AI-provider money - cap it per user.
    if (!(await rateLimit(`chat:${user.id}`, 30, 600))) {
      return NextResponse.json({ error: 'יותר מדי הודעות, נסי שוב בעוד כמה דקות' }, { status: 429 })
    }

    const parsed = parseChatBody(await req.json().catch(() => null))
    if (!parsed) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    const { messages, mode } = parsed

    // Save user message (non-blocking)
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'user') {
      supabase.from('chat_messages').insert({
        user_id: user.id, role: 'user', content: lastMsg.content, mode
      }).then(() => {})
    }

    const readable = await streamGroqResponse(messages, mode)

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      }
    })
  } catch (e: unknown) {
    console.error('Chat API error:', e)
    // Return error as a stream so the chat UI shows it inline
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('⚠️ שגיאה זמנית, נסי שוב בעוד רגע'))
        controller.close()
      }
    })
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }
}
