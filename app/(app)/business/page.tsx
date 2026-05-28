import { createClient } from '@/lib/supabase/server'
import BusinessClient from './BusinessClient'

export default async function BusinessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: tasks }, { data: schedule }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user!.id)
      .eq('category', 'work')
      .neq('status', 'done')
      .order('created_at', { ascending: false }),
    supabase
      .from('weekly_schedule')
      .select('*')
      .eq('user_id', user!.id)
      .order('day_of_week')
      .order('start_time'),
  ])

  return (
    <BusinessClient
      profile={profile}
      tasks={tasks || []}
      schedule={schedule || []}
      userId={user!.id}
    />
  )
}
