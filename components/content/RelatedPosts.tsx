import { createClient } from '@/lib/supabase/server'
import PostCard, { type PostCardData } from '@/components/content/PostCard'

const HOW_MANY = 3

/**
 * "More articles you might like" under a post. Posts sharing the current post's
 * category come first - that's the closest thing to relatedness the data
 * supports - and the rest of the slots fill with the newest posts, so the strip
 * is never half empty just because a category only has one entry.
 *
 * Uses the same PostCard as the feed, so the two never drift apart visually.
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

  const all = (data ?? []) as PostCardData[]
  if (all.length === 0) return null

  const sameCategory = category ? all.filter(p => p.category === category) : []
  const rest = all.filter(p => !sameCategory.includes(p))
  const posts = [...sameCategory, ...rest].slice(0, HOW_MANY)

  return (
    <section style={{ marginTop: 52, paddingTop: 34, borderTop: '1px solid rgba(127,82,104,0.15)' }}>
      <h2 style={{
        fontFamily: 'var(--font-body)', fontSize: 'clamp(1.3rem,2.4vw,1.75rem)', fontWeight: 500,
        color: '#7F5268', margin: '0 0 24px', textAlign: 'center',
      }}>
        מאמרים נוספים שיכולים לעניין אותך
      </h2>

      <div className="related-grid">
        {posts.map(p => (
          <PostCard key={p.slug} post={p} basePath={basePath} />
        ))}
      </div>
    </section>
  )
}
