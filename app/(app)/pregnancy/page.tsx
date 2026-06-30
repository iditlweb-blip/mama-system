import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PregnancyClient from './PregnancyClient'

export default async function PregnancyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, baby_name, baby_gender, due_date, tracking_type, has_given_birth, profile_picture_url')
    .eq('id', user.id)
    .single()

  // If user is already tracking a baby, redirect to tracker
  if (profile?.tracking_type === 'baby' || profile?.has_given_birth) {
    redirect('/tracker')
  }

  const { data: tests } = await supabase
    .from('pregnancy_tests')
    .select('*')
    .eq('user_id', user.id)
    .order('scheduled_week', { ascending: true })

  return (
    <PregnancyClient
      profile={profile}
      tests={tests ?? []}
      userId={user.id}
    />
  )
}
