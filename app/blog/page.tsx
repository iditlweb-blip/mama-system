import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import GradientTitle from '@/components/public/GradientTitle'

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

// A topical emoji per category, used on the branded placeholder when a post has
// no cover image yet.
function coverEmoji(category: string | null): string {
  const c = (category ?? '').trim()
  if (c.includes('שינה')) return '🌙'
  if (c.includes('הנקה')) return '🤱'
  if (c.includes('הבית') || c.includes('בית')) return '🏠'
  if (c.includes('עצמי') || c.includes('טיפול')) return '🌸'
  if (c.includes('התפתחות')) return '👶'
  return '💜'
}

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
      <header className="public-hero-head" style={{ marginBottom: 36 }}>
        <GradientTitle>בלוג</GradientTitle>
        <p style={{ color: '#5b4a52', fontSize: '1.15rem', fontWeight: 300, margin: '4px auto 0', maxWidth: 760, lineHeight: 1.6 }}>
          הכתבות, טיפים ומדריכים שיעזרו לך בחודשים הראשונים - בגובה העיניים ובלי שיפוטיות.
        </p>
      </header>

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9a8790' }}>
          <p style={{ fontSize: '1.05rem', margin: 0 }}>עוד רגע מתחילות לצאת כתבות ✍️</p>
          <p style={{ fontSize: '0.9rem', marginTop: 6 }}>חזרי לכאן בקרוב.</p>
        </div>
      ) : (
        <div className="blog-grid">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              style={{
                display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit',
                background: '#fff', borderRadius: 22, padding: 14, textAlign: 'center',
                boxShadow: '0 6px 22px rgba(127,82,104,0.08)',
              }}
            >
              <div style={{ position: 'relative' }}>
                {p.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_image_url} alt={p.title} style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block', borderRadius: 14 }} />
                ) : (
                  <div style={{ height: 190, borderRadius: 14, background: 'linear-gradient(135deg,#7F5268,#C4A0B4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.6rem' }}>
                    <span>{coverEmoji(p.category)}</span>
                  </div>
                )}
                {p.category && (
                  <span style={{ position: 'absolute', top: 12, left: 12, fontSize: '0.72rem', fontWeight: 500, color: '#7F5268', background: 'rgba(247,237,226,0.94)', borderRadius: 10, padding: '4px 11px' }}>
                    {p.category}
                  </span>
                )}
              </div>

              <div style={{ padding: '16px 8px 0', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {p.published_at && (
                  <time style={{ fontSize: '0.82rem', fontWeight: 300, color: '#9a8790' }}>
                    {new Date(p.published_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                )}
                <h2 style={{ fontSize: '1.12rem', fontWeight: 500, color: '#3a2530', margin: 0, lineHeight: 1.4 }}>{p.title}</h2>
                {p.excerpt && (
                  <p style={{ fontSize: '0.92rem', fontWeight: 300, color: '#6b5560', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.excerpt}
                  </p>
                )}
                <span style={{
                  marginTop: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: '#7F5268', color: '#fff', borderRadius: 999, padding: '11px 18px',
                  fontSize: '0.92rem', fontWeight: 500,
                }}>
                  <ArrowLeft style={{ width: 16, height: 16 }} />
                  למאמר המלא
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
