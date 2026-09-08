import { createClient } from '@/lib/supabase/server'
import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import BusinessClient from './BusinessClient'

export default async function BusinessPage() {
  const supabase = await createClient()
  const userId = await getAuthUserId()

  const [profile, { data: tasks }, { data: schedule }] = await Promise.all([
    getProfile(),
    // All tasks regardless of category (work/home/baby) or status now that
    // /tasks has been folded into this page's own "משימות" tab.
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false }),
    supabase
      .from('weekly_schedule')
      .select('*')
      .eq('user_id', userId!)
      .order('day_of_week')
      .order('start_time'),
  ])

  return (
    <BusinessClient
      profile={profile}
      tasks={tasks || []}
      schedule={schedule || []}
      userId={userId!}
    />
  )
}
