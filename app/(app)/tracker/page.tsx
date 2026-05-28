import { createClient } from '@/lib/supabase/server'
import TrackerClient from './TrackerClient'

export default async function TrackerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]

  const [{ data: logs }, { data: profile }, healthResult] = await Promise.all([
    supabase
      .from('baby_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('start_time', today)
      .order('start_time', { ascending: false }),
    supabase
      .from('profiles')
      .select('baby_birthdate, baby_name, baby_gender')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('health_events')
      .select('*')
      .eq('user_id', user!.id)
      .order('scheduled_date', { ascending: true })
      .limit(20),
  ])

  return (
    <TrackerClient
      logs={logs || []}
      userId={user!.id}
      babyBirthdate={profile?.baby_birthdate || null}
      babyName={profile?.baby_name || null}
      babyGender={(profile?.baby_gender as 'boy' | 'girl' | null) || null}
      initialHealthEvents={healthResult.data || []}
    />
  )
}
