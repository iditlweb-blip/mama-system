import { createClient } from '@/lib/supabase/server'
import { getAuthUserId } from '@/lib/supabase/auth'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()
  const userId = await getAuthUserId()
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId!)
    .order('created_at', { ascending: false })

  return <TasksClient tasks={tasks || []} userId={userId!} />
}
