import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import ContractionsClient from './ContractionsClient'

export default async function ContractionsPage() {
  const userId = await getAuthUserId()
  if (!userId) redirect('/auth')

  const profile = await getProfile()

  // Contractions only make sense while pregnant.
  if (profile?.tracking_type === 'baby' || profile?.has_given_birth) {
    redirect('/tracker')
  }

  const supabase = await createClient()
  const { data: contractions } = await supabase
    .from('contractions')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: false })
    .limit(200)

  return (
    <ContractionsClient
      userId={userId}
      hospitalAddress={profile?.hospital_address ?? null}
      initialContractions={contractions ?? []}
    />
  )
}
