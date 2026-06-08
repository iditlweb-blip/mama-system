import { streamGroqResponse } from '@/lib/groq'
import { createClient } from '@/lib/supabase/server'
import { ChatMode } from '@/types/database'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messages, mode } = await req.json() as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      mode: ChatMode
    }

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
    const errMsg = e instanceof Error ? e.message : String(e)
    // Return error as a stream so the chat UI shows it inline
    const encoder = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(`⚠️ שגיאה: ${errMsg}`))
        controller.close()
      }
    })
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }
}
