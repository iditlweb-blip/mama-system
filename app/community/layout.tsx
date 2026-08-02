import PublicShell from '@/components/public/PublicShell'

// Community is always a WEBSITE page (public marketing shell) - reading is open
// to everyone, including search engines. Posting requires logging in, which the
// page's "ask" button routes through /auth; we never swap this page into the
// app chrome.
export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell active="community">{children}</PublicShell>
}
