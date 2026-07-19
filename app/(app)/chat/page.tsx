import { createClient } from '@/lib/supabase/server'
import ChatClient from './ChatClient'
import { ChatMode, ChatMessage } from '@/types/database'

const ALL_MODES: ChatMode[] = ['baby', 'time', 'emotional', 'pregnancy']

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: allMessages }, { data: profile }] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('profiles')
      .select('tracking_type')
      .eq('id', user!.id)
      .single(),
  ])

  const messages = (allMessages || []) as ChatMessage[]

  // Group last 20 per mode
  const historyByMode: Partial<Record<ChatMode, ChatMessage[]>> = {}
  for (const mode of ALL_MODES) {
    const modeMessages = messages.filter(m => m.mode === mode).slice(0, 20).reverse()
    historyByMode[mode] = modeMessages
  }

  const trackingType = (profile?.tracking_type as 'pregnancy' | 'baby') || 'baby'

  return <ChatClient historyByMode={historyByMode} trackingType={trackingType} />
}
