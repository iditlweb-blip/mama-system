import { createClient } from '@/lib/supabase/server'
import ChatClient from './ChatClient'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: history } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return <ChatClient history={(history || []).reverse()} />
}
