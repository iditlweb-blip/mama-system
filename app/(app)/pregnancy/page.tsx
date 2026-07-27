import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import { isAdminEmail } from '@/lib/admin'
import PregnancyClient from './PregnancyClient'

export default async function PregnancyPage() {
  const userId = await getAuthUserId()
  if (!userId) redirect('/auth')

  const profile = await getProfile()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is already tracking a baby, redirect to tracker. The admin account
  // is exempt so it can preview pregnancy mode without switching profiles.
  if ((profile?.tracking_type === 'baby' || profile?.has_given_birth) && !isAdminEmail(user?.email)) {
    redirect('/tracker')
  }

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
