import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import AppShell from '@/components/layout/AppShell'
import PublicShell from '@/components/public/PublicShell'

// Community is a single /community route that serves two audiences:
// - Signed-in app users get it wrapped in the full app chrome (AppShell), so
//   tapping "קהילה" inside the app never kicks them out to the website.
// - Everyone else (logged out, search engines) gets the public marketing shell.
// Both render the exact same page/content - the website and the app show one
// mirrored community.
export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const userId = await getAuthUserId()
  if (userId) {
    const profile = await getProfile()
    if (profile?.setup_complete) return <AppShell>{children}</AppShell>
  }
  return <PublicShell active="community">{children}</PublicShell>
}
