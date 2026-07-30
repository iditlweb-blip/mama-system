import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'בלוג לאימהות טריות',
  description: 'כתבות, טיפים ומדריכים לאימהות טריות - שינה, הנקה, התפתחות התינוק, וטיפול עצמי אחרי לידה.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'בלוג לאימהות טריות · אמא בסדר',
    description: 'כתבות, טיפים ומדריכים לאימהות טריות.',
    type: 'website',
    url: '/blog',
  },
}

// Content changes rarely and is owner-edited - cache the list for an hour.
export const revalidate = 3600

interface PostCard {
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  category: string | null
  published_at: string | null
}

export default async function BlogIndexPage() {
  const supabase = await createClient()
  // RLS returns only published posts for the anon/authenticated key.
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, cover_image_url, category, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const posts = (data ?? []) as PostCard[]

  return (
    <div>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: 'clamp(1.7rem,4vw,2.4rem)', fontWeight: 700, color: '#7F5268', margin: '0 0 8px' }}>
          הבלוג של אמא בסדר
        </h1>
        <p style={{ color: '#6b5560', fontSize: '1.02rem', margin: 0, lineHeight: 1.6 }}>
          כתבות, טיפים ומדריכים שיעזרו לך בחודשים הראשונים - בגובה העיניים ובלי שיפוטיות.
        </p>
      </header>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9a8790' }}>
          <p style={{ fontSize: '1.05rem', margin: 0 }}>עוד רגע מתחילות לצאת כתבות ✍️</p>
          <p style={{ fontSize: '0.9rem', marginTop: 6 }}>חזרי לכאן בקרוב.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              style={{
                display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit',
                background: '#fff', borderRadius: 18, overflow: 'hidden',
                border: '1px solid rgba(127,82,104,0.10)', boxShadow: '0 2px 16px rgba(127,82,104,0.07)',
              }}
            >
              {p.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.cover_image_url} alt={p.title} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ height: 120, background: 'linear-gradient(135deg,#7F5268,#C4A0B4)' }} />
              )}
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {p.category && (
                  <span style={{ alignSelf: 'flex-start', fontSize: '0.7rem', fontWeight: 700, color: '#7F5268', background: 'rgba(127,82,104,0.10)', borderRadius: 8, padding: '3px 9px' }}>
                    {p.category}
                  </span>
                )}
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3a1e2d', margin: 0, lineHeight: 1.4 }}>{p.title}</h2>
                {p.excerpt && (
                  <p style={{ fontSize: '0.9rem', color: '#6b5560', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.excerpt}
                  </p>
                )}
                {p.published_at && (
                  <time style={{ fontSize: '0.78rem', color: '#9a8790' }}>
                    {new Date(p.published_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
