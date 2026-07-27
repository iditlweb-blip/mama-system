import { redirect } from 'next/navigation'
import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import GlobalTimerBar from '@/components/layout/GlobalTimerBar'
import ContractionTimerBar from '@/components/layout/ContractionTimerBar'
import PwaTracker from '@/components/PwaTracker'
import PreloaderLottie from '@/components/PreloaderLottie'
import BottomNav from '@/components/layout/BottomNav'
import PageTimeTracker from '@/components/PageTimeTracker'
import RemindersPopup from '@/components/RemindersPopup'
import ParentPopup from '@/components/ParentPopup'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await getAuthUserId()
  if (!userId) redirect('/auth')

  const profile = await getProfile()

  // New users must finish the onboarding questionnaire before reaching any
  // in-app page. The wizard lives outside this layout, so redirecting there
  // cannot loop.
  if (!profile?.setup_complete) redirect('/onboarding')

  // The admin account previews BOTH trackers without switching profiles.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = isAdminEmail(user?.email)

  // Quick profile switch (owner <-> pregnancy test profile). No credentials
  // needed - the API mints a one-time token with the service-role key.
  const email = user?.email?.trim().toLowerCase()
  const testEmail = (process.env.TEST_PROFILE_EMAIL || 'dana@gmail.com').trim().toLowerCase()
  const switchLabel = isAdmin ? 'פרופיל הריון' : email === testEmail ? 'פרופיל ראשי' : null

  const showSleepTimer = profile?.show_sleep_timer !== false
  const showReminders  = profile?.show_reminders !== false
  const showParentPopup = profile?.show_parent_popup !== false

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <PreloaderLottie />
      <Sidebar userName={profile?.name} trackingType={profile?.tracking_type as 'pregnancy' | 'baby' | null} showBoth={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          babyName={profile?.baby_name}
          babyGender={profile?.baby_gender}
          profilePicUrl={profile?.profile_picture_url}
          switchLabel={switchLabel}
          isAdmin={isAdmin}
        />
        {(profile?.tracking_type === 'baby' || isAdmin) && showSleepTimer && <GlobalTimerBar userId={userId} />}
        {profile?.tracking_type === 'pregnancy' && <ContractionTimerBar userId={userId} />}
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
      {showReminders && (
        <RemindersPopup
          userId={userId}
          dueDate={profile?.due_date ?? null}
          trackingType={profile?.tracking_type as 'pregnancy' | 'baby' | null}
        />
      )}
      <ParentPopup
        userId={userId}
        defaultParent={(profile?.default_parent as 'mom' | 'dad' | null) ?? null}
        showPopup={showParentPopup}
      />
      <BottomNav trackingType={(profile?.tracking_type as 'pregnancy' | 'baby') ?? 'baby'} showBoth={isAdmin} />
    </div>
  )
}
