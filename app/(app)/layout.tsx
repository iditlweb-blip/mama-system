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
    .select('name, baby_name, baby_gender, profile_picture_url, tracking_type')
    .eq('id', user.id)
    .single()

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
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
        <PwaTracker />
        <PageTimeTracker />
      </div>
      <BottomNav trackingType={(profile?.tracking_type as 'pregnancy' | 'baby') ?? 'baby'} />
    </div>
  )
}
