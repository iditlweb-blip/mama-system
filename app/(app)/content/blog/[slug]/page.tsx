import BlogPost from '@/components/content/BlogPost'

export const revalidate = 3600

export default async function AppBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <BlogPost slug={slug} basePath="/content/blog" communityBasePath="/content/community" />
}
