import BlogFeed from '@/components/content/BlogFeed'

// In-app mirror of the public /blog page - same data, rendered inside the
// app's own chrome (sidebar/bottom nav) instead of the website's marketing
// header/footer, so navigating here from inside the app never feels like
// leaving it. Requires login (enforced by the (app) layout).
export const revalidate = 3600

export default function AppBlogPage() {
  return <BlogFeed basePath="/content/blog" />
}
