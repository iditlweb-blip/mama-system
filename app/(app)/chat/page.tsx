import { createClient } from '@/lib/supabase/server'
import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import ChatClient from './ChatClient'
import { ChatMode, ChatMessage } from '@/types/database'

const ALL_MODES: ChatMode[] = ['baby', 'time', 'emotional', 'pregnancy']

export default async function ChatPage() {
  const supabase = await createClient()
  const userId = await getAuthUserId()

  const [{ data: allMessages }, profile] = await Promise.all([
    supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })
      .limit(100),
    getProfile(),
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
