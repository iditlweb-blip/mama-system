import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import AppShell from '@/components/layout/AppShell'
import PublicShell from '@/components/public/PublicShell'

// Same dual-audience pattern as the community: signed-in app users read the
// blog inside the app chrome, everyone else (and search engines) get the
// public marketing shell.
export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const userId = await getAuthUserId()
  if (userId) {
    const profile = await getProfile()
    if (profile?.setup_complete) return <AppShell>{children}</AppShell>
  }
  return <PublicShell active="blog">{children}</PublicShell>
}
