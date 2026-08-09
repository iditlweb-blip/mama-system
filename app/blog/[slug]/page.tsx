import type { Metadata } from 'next'
import BlogPost, { getBlogPost } from '@/components/content/BlogPost'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) return { title: 'כתבה לא נמצאה' }
  const description = post.excerpt ?? post.title
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      url: `/blog/${post.slug}`,
      ...(post.published_at ? { publishedTime: post.published_at } : {}),
      ...(post.cover_image_url ? { images: [{ url: post.cover_image_url }] } : {}),
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <BlogPost slug={slug} basePath="/blog" communityBasePath="/community" />
}
