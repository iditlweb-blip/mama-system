import { createClient } from '@/lib/supabase/server'
import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import TrackerClient from './TrackerClient'

export default async function TrackerPage() {
  const supabase = await createClient()
  const userId = await getAuthUserId()

  const today = new Date().toISOString().split('T')[0]

  const [{ data: logs }, profile, healthResult] = await Promise.all([
    supabase
      .from('baby_logs')
      .select('*')
      .eq('user_id', userId!)
      // Include today's logs AND any sleep that ended today (a night sleep
      // started the previous evening) so an overnight sleep keeps showing on
      // the timeline instead of disappearing after navigation.
      .or(`start_time.gte.${today},end_time.gte.${today}`)
      .order('start_time', { ascending: false }),
    getProfile(),
    supabase
      .from('health_events')
      .select('*')
      .eq('user_id', userId!)
      .order('scheduled_date', { ascending: true })
      .limit(20),
  ])

  return (
    <TrackerClient
      logs={logs || []}
      userId={userId!}
      babyBirthdate={profile?.baby_birthdate || null}
      babyName={profile?.baby_name || null}
      babyGender={(profile?.baby_gender as 'boy' | 'girl' | null) || null}
      initialHealthEvents={healthResult.data || []}
    />
  )
}
