import { createClient } from '@/lib/supabase/server'
import { getAuthUserId } from '@/lib/supabase/auth'
import PersonalClient from './PersonalClient'

export default async function PersonalPage() {
  const supabase = await createClient()
  const userId = await getAuthUserId()

  // Try to load personal logs; gracefully handle missing table
  let logs: unknown[] = []
  try {
    const { data } = await supabase
      .from('personal_logs')
      .select('*')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })
      .limit(50)
    logs = data || []
  } catch {
    logs = []
  }

  return <PersonalClient userId={userId!} initialLogs={logs as Parameters<typeof PersonalClient>[0]['initialLogs']} />
}
