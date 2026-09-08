import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import GlobalTimerBar from '@/components/layout/GlobalTimerBar'
import ContractionTimerBar from '@/components/layout/ContractionTimerBar'
import PwaTracker from '@/components/PwaTracker'
import PreloaderLottie from '@/components/PreloaderLottie'
import BottomNav from '@/components/layout/BottomNav'
import QuickAddFab from '@/components/layout/QuickAddFab'
import PageTimeTracker from '@/components/PageTimeTracker'
import RemindersPopup from '@/components/RemindersPopup'
import ParentPopup from '@/components/ParentPopup'
import PushPermissionPrompt from '@/components/PushPermissionPrompt'
import PushResync from '@/components/PushResync'
import ScrollToTopOnNavigate from '@/components/layout/ScrollToTopOnNavigate'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin'
import { switchOptionsFor } from '@/lib/switchProfiles'

// The full logged-in app chrome (sidebar, top bar, timers, bottom nav, popups)
// wrapped around `children`. Extracted from (app)/layout so pages that live
// OUTSIDE the (app) route group - like the community, which must also be
// publicly readable - can render inside the app when the visitor is signed in.
//
// Callers must guarantee the user is authenticated and onboarded; this only
// fetches what it needs to render (getAuthUserId/getProfile are per-request
// cached, so calling them again here is free).
export default async function AppShell({ children }: { children: React.ReactNode }) {
  const userId = await getAuthUserId()
  const profile = await getProfile()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = isAdminEmail(user?.email)

  // Chat is pulled out temporarily (no row = disabled) - an admin toggle
  // brings it back into the sidebar; see app/(app)/chat/page.tsx for the
  // matching gate on the route itself.
  const { data: chatSetting } = await supabase
    .from('app_settings').select('value').eq('key', 'chat_enabled').maybeSingle()
  const chatEnabled = chatSetting?.value === true

  const switchOptions = switchOptionsFor(user?.email)
  const adminAccess: 'none' | 'direct' | 'switch' =
    isAdmin ? 'direct'
    : switchOptions.some(o => o.key === 'admin') ? 'switch'
    : 'none'

  const showSleepTimer = profile?.show_sleep_timer !== false
  const showReminders  = profile?.show_reminders !== false
  const showParentPopup = profile?.show_parent_popup !== false

  return (
    // 100dvh, not 100vh: on a phone, 100vh is the height with the browser's
    // chrome collapsed, so on load the layout is taller than what is actually
    // visible and the top bar starts pushed off screen. dvh tracks the real
    // viewport. The vh value stays as a fallback for anything that lacks dvh.
    <div className="flex overflow-hidden" style={{ background: 'var(--bg)', height: '100vh', maxHeight: '100dvh' }}>
      <PreloaderLottie />
      <Sidebar userName={profile?.name} trackingType={profile?.tracking_type as 'pregnancy' | 'baby' | null} adminAccess={adminAccess} chatEnabled={chatEnabled} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          babyName={profile?.baby_name}
          babyGender={profile?.baby_gender}
          profilePicUrl={profile?.profile_picture_url}
          switchOptions={switchOptions}
        />
        {profile?.tracking_type !== 'pregnancy' && showSleepTimer && <GlobalTimerBar userId={userId!} />}
        {profile?.tracking_type === 'pregnancy' && <ContractionTimerBar userId={userId!} />}
        {/* Scrolling happens in here rather than on the document, so the
            router's own scroll restoration doesn't reach it - every navigation
            would otherwise open the new page at the previous page's offset. */}
        <main id="app-scroll" className="flex-1 overflow-y-auto">
          <ScrollToTopOnNavigate />
          <div className="w-full px-4 md:px-8 pt-4 md:pt-6 pb-[calc(64px+env(safe-area-inset-bottom)+5rem)] md:pb-8">
            {children}
          </div>
        </main>
        <PwaTracker />
        <PageTimeTracker />
      </div>
      {showReminders && (
        <RemindersPopup
          userId={userId!}
          dueDate={profile?.due_date ?? null}
          trackingType={profile?.tracking_type as 'pregnancy' | 'baby' | null}
        />
      )}
      <ParentPopup
        userId={userId!}
        defaultParent={(profile?.default_parent as 'mom' | 'dad' | null) ?? null}
        showPopup={showParentPopup}
      />
      <PushPermissionPrompt />
      <PushResync />
      {profile?.tracking_type !== 'pregnancy' && <QuickAddFab userId={userId!} />}
      <BottomNav trackingType={(profile?.tracking_type as 'pregnancy' | 'baby') ?? 'baby'} />
    </div>
  )
}
