import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Markdown from '@/components/public/Markdown'
import Breadcrumbs from '@/components/public/Breadcrumbs'
import RelatedPosts from '@/components/content/RelatedPosts'

export interface BlogPostData {
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

export async function getBlogPost(slug: string): Promise<BlogPostData | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()
  return (data as BlogPostData) ?? null
}

// A single post's content, shared between the public website (/blog/[slug])
// and the in-app mirror (/content/blog/[slug]). `basePath`/`communityBasePath`
// keep every link pointing at whichever surface the reader is currently on.
//
// Layout: everything runs the full width of the shell's content grid - the
// same width the blog feed's cards span - rather than sitting in a narrow
// centred column.
export default async function BlogPost({ slug, basePath, communityBasePath }: {
  slug: string
  basePath: string
  communityBasePath: string
}) {
  const post = await getBlogPost(slug)
  if (!post) notFound()

  // The same component renders on the public site and inside the app; "home"
  // means a different place on each, so follow whichever surface basePath is on.
  const homeCrumb = basePath.startsWith('/content')
    ? { label: 'דשבורד', href: '/dashboard' }
    : { label: 'עמוד בית', href: '/' }

  return (
    <article>
      <Breadcrumbs
        items={[
          homeCrumb,
          { label: 'בלוג', href: basePath },
          { label: post.title },
        ]}
      />

      {/* Back link at the start of the line, category tag at the end of it. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <Link href={basePath} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#7F5268', fontSize: '0.9rem', textDecoration: 'none' }}>
          <ArrowRight className="w-4 h-4" />
          חזרה לבלוג
        </Link>

        {post.category && (
          <span style={{ fontSize: '0.78rem', fontWeight: 300, color: '#7F5268', background: 'rgba(127,82,104,0.10)', borderRadius: 50, padding: '6px 20px', whiteSpace: 'nowrap' }}>
            {post.category}
          </span>
        )}
      </div>

      <h1 style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(1.9rem,4.5vw,2.8rem)', fontWeight: 700, color: '#7F5268', margin: '0 0 10px', lineHeight: 1.25, letterSpacing: '-0.01em', textAlign: 'center' }}>
        {post.title}
      </h1>

      {post.published_at && (
        <time style={{ display: 'block', fontSize: '0.85rem', fontWeight: 300, color: '#9a8790', marginBottom: 26, textAlign: 'center' }}>
          {new Date(post.published_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
        </time>
      )}

      {post.cover_image_url && (
        // Fixed height + object-fit: cover, so a wide banner and a tall portrait
        // both fill the frame at the same size instead of one of them stretching.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_image_url}
          alt={post.title}
          style={{ width: '100%', height: 'clamp(230px,34vw,460px)', objectFit: 'cover', borderRadius: 18, marginBottom: 30, display: 'block' }}
        />
      )}

      <div>
        <Markdown>{post.body}</Markdown>

        <div style={{ marginTop: 40, paddingTop: 22, borderTop: '1px solid rgba(127,82,104,0.15)', textAlign: 'center' }}>
          <p style={{ color: '#6b5560', fontSize: '0.95rem', marginBottom: 12 }}>יש לך שאלה? הצטרפי לקהילה של אמא בסדר.</p>
          <Link href={communityBasePath} style={{ background: '#7F5268', color: '#fff', borderRadius: 20, padding: '9px 22px', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none' }}>
            לקהילת השאלות והתשובות
          </Link>
        </div>
      </div>

      <RelatedPosts currentSlug={post.slug} category={post.category} basePath={basePath} />
    </article>
  )
}
