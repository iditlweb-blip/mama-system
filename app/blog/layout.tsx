import PublicShell from '@/components/public/PublicShell'

// The blog is always a WEBSITE page (public marketing shell), never swapped into
// the app chrome.
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell active="blog">{children}</PublicShell>
}
