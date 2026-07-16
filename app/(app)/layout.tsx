import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import PwaTracker from '@/components/PwaTracker'
import PreloaderLottie from '@/components/PreloaderLottie'
import BottomNav from '@/components/layout/BottomNav'
import PageTimeTracker from '@/components/PageTimeTracker'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, baby_name, baby_gender, profile_picture_url, tracking_type, setup_complete')
    .eq('id', user.id)
    .single()

  // New users must finish the onboarding questionnaire before reaching any
  // in-app page. The wizard lives outside this layout, so redirecting there
  // cannot loop.
  if (!profile?.setup_complete) redirect('/onboarding')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <PreloaderLottie />
      <Sidebar userName={profile?.name} trackingType={profile?.tracking_type as 'pregnancy' | 'baby' | null} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          babyName={profile?.baby_name}
          babyGender={profile?.baby_gender}
          profilePicUrl={profile?.profile_picture_url}
        />
        <main className="flex-1 overflow-y-auto">
          {/* Full-width content with symmetric side gutters (equal left/right)
              across every page, mobile + desktop. Extra bottom padding on
              mobile keeps content clear of the fixed bottom nav bar. */}
          <div className="w-full px-4 md:px-8 pt-4 md:pt-6 pb-[calc(64px+env(safe-area-inset-bottom)+5rem)] md:pb-8">
            {children}
          </div>
        </main>
        <PwaTracker />
        <PageTimeTracker />
      </div>
      <BottomNav trackingType={(profile?.tracking_type as 'pregnancy' | 'baby') ?? 'baby'} />
    </div>
  )
}
