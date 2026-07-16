import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('setup_complete')
    .eq('id', user.id)
    .single()

  // Already onboarded — don't force the wizard again.
  if (profile?.setup_complete) redirect('/dashboard')

  return <OnboardingClient />
}
