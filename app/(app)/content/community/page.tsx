import CommunityFeed from '@/components/content/CommunityFeed'

// In-app mirror of the public /community page - same data, rendered inside
// the app's own chrome instead of the website's marketing header/footer.
// Requires login (enforced by the (app) layout) - posting works the same as
// on the website, just without ever leaving the app.
export const revalidate = 60

export default function AppCommunityPage() {
  return <CommunityFeed basePath="/content/community" />
}
