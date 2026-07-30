import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Markdown from '@/components/public/Markdown'

export const revalidate = 3600

interface Post {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body: string
  cover_image_url: string | null
  category: string | null
  published_at: string | null
  updated_at: string | null
}

async function getPost(slug: string): Promise<Post | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  return (data as Post) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
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
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <article style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#7F5268', fontSize: '0.9rem', textDecoration: 'none', marginBottom: 20 }}>
        <ArrowRight className="w-4 h-4" />
        חזרה לבלוג
      </Link>

      {post.category && (
        <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, color: '#7F5268', background: 'rgba(127,82,104,0.10)', borderRadius: 8, padding: '4px 10px', marginBottom: 12 }}>
          {post.category}
        </span>
      )}

      <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: 'clamp(1.6rem,4vw,2.3rem)', fontWeight: 700, color: '#3a1e2d', margin: '0 0 10px', lineHeight: 1.35 }}>
        {post.title}
      </h1>

      {post.published_at && (
        <time style={{ display: 'block', fontSize: '0.85rem', color: '#9a8790', marginBottom: 22 }}>
          {new Date(post.published_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </time>
      )}

      {post.cover_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover_image_url} alt={post.title} style={{ width: '100%', borderRadius: 16, marginBottom: 26, display: 'block' }} />
      )}

      <Markdown>{post.body}</Markdown>

      <div style={{ marginTop: 40, paddingTop: 22, borderTop: '1px solid rgba(127,82,104,0.15)', textAlign: 'center' }}>
        <p style={{ color: '#6b5560', fontSize: '0.95rem', marginBottom: 12 }}>יש לך שאלה? הצטרפי לקהילה של אמא בסדר.</p>
        <Link href="/community" style={{ background: '#7F5268', color: '#fff', borderRadius: 20, padding: '9px 22px', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none' }}>
          לקהילת השאלות והתשובות
        </Link>
      </div>
    </article>
  )
}
