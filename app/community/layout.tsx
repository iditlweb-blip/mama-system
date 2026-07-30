import PublicShell from '@/components/public/PublicShell'

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell active="community">{children}</PublicShell>
}
