import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import PregnancyClient from './PregnancyClient'

export default async function PregnancyPage() {
  const userId = await getAuthUserId()
  if (!userId) redirect('/auth')

  const profile = await getProfile()

  // If user is already tracking a baby, redirect to tracker
  if (profile?.tracking_type === 'baby' || profile?.has_given_birth) {
    redirect('/tracker')
  }

  const supabase = await createClient()
  const { data: tests } = await supabase
    .from('pregnancy_tests')
    .select('*')
    .eq('user_id', userId)
    .order('scheduled_week', { ascending: true })

  return (
    <PregnancyClient
      profile={profile}
      tests={tests ?? []}
      userId={userId}
    />
  )
}
