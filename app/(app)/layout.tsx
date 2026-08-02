import { redirect } from 'next/navigation'
import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import AppShell from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getAuthUserId()
  if (!userId) redirect('/auth')

  const profile = await getProfile()

  // New users must finish the onboarding questionnaire before reaching any
  // in-app page. The wizard lives outside this layout, so redirecting there
  // cannot loop.
  if (!profile?.setup_complete) redirect('/onboarding')

  return <AppShell>{children}</AppShell>
}
