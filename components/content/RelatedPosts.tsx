import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const HOW_MANY = 3

interface RelatedCard {
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  category: string | null
  published_at: string | null
}

// Same emoji fallback the feed uses when a post has no cover image yet.
function coverEmoji(category: string | null): string {
  const c = (category ?? '').trim()
  if (c.includes('שינה')) return '🌙'
  if (c.includes('הנקה')) return '🤱'
  if (c.includes('הבית') || c.includes('בית')) return '🏠'
  if (c.includes('עצמי') || c.includes('טיפול')) return '🌸'
  if (c.includes('התפתחות')) return '👶'
  return '💜'
}

/**
 * "More articles you might like" under a post. Posts sharing the current post's
 * category come first - that's the closest thing to relatedness the data
 * supports - and the rest of the slots fill with the newest posts, so the strip
 * is never half empty just because a category only has one entry.
 */
export default async function RelatedPosts({ currentSlug, category, basePath }: {
  currentSlug: string
  category: string | null
  basePath: string
}) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, cover_image_url, category, published_at')
    .eq('status', 'published')
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(12)

  const all = (data ?? []) as RelatedCard[]
  if (all.length === 0) return null

  const sameCategory = category ? all.filter(p => p.category === category) : []
  const rest = all.filter(p => !sameCategory.includes(p))
  const posts = [...sameCategory, ...rest].slice(0, HOW_MANY)

  return (
    <section style={{ marginTop: 48, paddingTop: 30, borderTop: '1px solid rgba(127,82,104,0.15)' }}>
      <h2 style={{
        fontFamily: 'var(--font-body)', fontSize: 'clamp(1.25rem,2.4vw,1.6rem)', fontWeight: 700,
        color: '#7F5268', margin: '0 0 20px',
      }}>
        מאמרים נוספים שיכולים לעניין אותך
      </h2>

      <div className="related-grid">
        {posts.map(p => (
          <Link
            key={p.slug}
            href={`${basePath}/${p.slug}`}
            style={{
              display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit',
              background: '#fff', borderRadius: 18, overflow: 'hidden',
              boxShadow: '0 6px 22px rgba(127,82,104,0.08)',
            }}
          >
            {p.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.cover_image_url} alt={p.title} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ height: 160, background: 'linear-gradient(135deg,#7F5268,#C4A0B4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem' }}>
                <span>{coverEmoji(p.category)}</span>
              </div>
            )}

            <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
              {p.category && (
                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#7F5268' }}>{p.category}</span>
              )}
              <h3 style={{ fontSize: '1.02rem', fontWeight: 500, color: '#3a2530', margin: 0, lineHeight: 1.45 }}>{p.title}</h3>
              {p.excerpt && (
                <p style={{
                  fontSize: '0.88rem', fontWeight: 300, color: '#6b5560', margin: 0, lineHeight: 1.6,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {p.excerpt}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
