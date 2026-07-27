import { createClient } from '@/lib/supabase/server'
import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()
  const userId = await getAuthUserId()
  const [{ data: tasks }, profile] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId!).order('created_at', { ascending: false }),
    getProfile(),
  ])

  return <TasksClient tasks={tasks || []} userId={userId!} trackingType={(profile?.tracking_type as 'pregnancy' | 'baby' | null) ?? null} />
}
