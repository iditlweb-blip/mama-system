import Link from 'next/link'
import BrandArrow from '@/components/public/BrandArrow'

export interface PostCardData {
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  category: string | null
  published_at: string | null
}

// A topical emoji per category, used on the branded placeholder when a post has
// no cover image yet.
export function coverEmoji(category: string | null): string {
  const c = (category ?? '').trim()
  if (c.includes('שינה')) return '🌙'
  if (c.includes('הנקה')) return '🤱'
  if (c.includes('הבית') || c.includes('בית')) return '🏠'
  if (c.includes('עצמי') || c.includes('טיפול')) return '🌸'
  if (c.includes('התפתחות')) return '👶'
  return '💜'
}

// The blog's post card. Shared by the feed (/blog) and the "more articles"
// strip under a post, so the two always look identical - a card that only
// exists in one of the two places drifts out of sync the moment either changes.
export default function PostCard({ post, basePath }: { post: PostCardData; basePath: string }) {
  return (
    <Link
      href={`${basePath}/${post.slug}`}
      style={{
        display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit',
        background: '#fff', borderRadius: 22, padding: 14, textAlign: 'center',
        boxShadow: '0 6px 22px rgba(127,82,104,0.08)',
      }}
    >
      <div style={{ position: 'relative' }}>
        {post.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.cover_image_url} alt={post.title} style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block', borderRadius: 14 }} />
        ) : (
          <div style={{ height: 190, borderRadius: 14, background: 'linear-gradient(135deg,#7F5268,#C4A0B4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.6rem' }}>
            <span>{coverEmoji(post.category)}</span>
          </div>
        )}
        {post.category && (
          <span style={{ position: 'absolute', top: 12, left: 12, fontSize: '0.72rem', fontWeight: 300, color: '#7F5268', background: 'rgba(247,237,226,0.94)', borderRadius: 50, padding: '5px 14px' }}>
            {post.category}
          </span>
        )}
      </div>

      <div style={{ padding: '16px 8px 0', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {post.published_at && (
          <time style={{ fontSize: '0.82rem', fontWeight: 300, color: '#9a8790' }}>
            {new Date(post.published_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
          </time>
        )}
        <h2 style={{ fontSize: '1.12rem', fontWeight: 500, color: '#3a2530', margin: 0, lineHeight: 1.4 }}>{post.title}</h2>
        {post.excerpt && (
          <p style={{ fontSize: '0.92rem', fontWeight: 300, color: '#6b5560', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.excerpt}
          </p>
        )}
        <span style={{
          marginTop: 'auto', direction: 'ltr', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          background: '#7F5268', color: '#F7EDE2', borderRadius: 999, padding: '11px 18px',
          fontSize: '0.92rem', fontWeight: 400,
        }}>
          <BrandArrow size={22} />
          <span>למאמר המלא</span>
        </span>
      </div>
    </Link>
  )
}
