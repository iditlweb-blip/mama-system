import { SupabaseClient } from '@supabase/supabase-js'
import { getGroqReply } from '@/lib/groq'
import { ChatMode } from '@/types/database'

// Server-to-server entry point into the same AI assistant that powers
// app/chat — used by the WhatsApp webhook, which has no user session/cookie
// (it authenticates the sender by their linked phone number instead, see
// lib/whatsapp.ts + app/api/whatsapp/webhook). Takes an already-created
// Supabase client (the webhook passes its admin/service-role client) plus a
// userId directly, rather than reading auth.getUser() like the HTTP route.
export async function replyAsAssistant(
  supabase: SupabaseClient,
  userId: string,
  userMessage: string,
  mode: ChatMode = 'baby'
): Promise<string> {
  // Pull a little recent history so replies over WhatsApp stay coherent
  // across a back-and-forth, same as the in-app chat does.
  const { data: history } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .eq('mode', mode)
    .order('created_at', { ascending: false })
    .limit(10)

  const messages = [...(history ?? [])].reverse().map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content as string,
  }))
  messages.push({ role: 'user', content: userMessage })

  const reply = await getGroqReply(messages, mode)

  // Persist both sides — non-blocking, mirrors app/api/chat/route.ts.
  supabase.from('chat_messages').insert([
    { user_id: userId, role: 'user', content: userMessage, mode },
    { user_id: userId, role: 'assistant', content: reply, mode },
  ]).then(() => {})

  return reply
}
