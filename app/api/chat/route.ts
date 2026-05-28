import { streamChatResponse } from '@/lib/claude'
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

    const stream = await streamChatResponse(messages, mode)
    let fullResponse = ''
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text
              fullResponse += text
              controller.enqueue(encoder.encode(text))
            }
          }
        } catch (e) {
          controller.enqueue(encoder.encode('\n\nאירעה שגיאה בחיבור ל-AI. אנא נסי שוב.'))
        }
        controller.close()
        // Save response (non-blocking)
        if (fullResponse) {
          supabase.from('chat_messages').insert({
            user_id: user.id, role: 'assistant', content: fullResponse, mode
          }).then(() => {})
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      }
    })
  } catch (e: unknown) {
    console.error('Chat API error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
