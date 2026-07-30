import PublicShell from '@/components/public/PublicShell'

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell active="blog">{children}</PublicShell>
}
