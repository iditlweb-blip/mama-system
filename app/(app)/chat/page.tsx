import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import ChatClient from './ChatClient'
import { ChatMode, ChatMessage } from '@/types/database'

const ALL_MODES: ChatMode[] = ['baby', 'time', 'emotional', 'pregnancy']

export default async function ChatPage() {
  const supabase = await createClient()
  const userId = await getAuthUserId()

  // Pulled out temporarily (no row = disabled) - an admin toggle in
  // /admin brings it back. Redirecting here, not just hiding the nav
  // links, means a bookmark or a stale link can't reach it either.
  const { data: chatSetting } = await supabase
    .from('app_settings').select('value').eq('key', 'chat_enabled').maybeSingle()
  if (chatSetting?.value !== true) redirect('/dashboard')

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
