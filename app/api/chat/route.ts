import { streamGeminiResponse } from '@/lib/gemini'
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

    const readable = await streamGeminiResponse(messages, mode)

    // Save assistant response after stream finishes (via tee)
    const [stream1, stream2] = readable.tee()

    // Background: collect full response and save
    ;(async () => {
      try {
        const reader = stream2.getReader()
        const decoder = new TextDecoder()
        let full = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          full += decoder.decode(value)
        }
        if (full) {
          await supabase.from('chat_messages').insert({
            user_id: user.id, role: 'assistant', content: full, mode
          })
        }
      } catch { /* silent */ }
    })()

    return new Response(stream1, {
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
