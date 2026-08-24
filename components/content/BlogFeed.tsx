import { createClient } from '@/lib/supabase/server'
import GradientTitle from '@/components/public/GradientTitle'
import PostCard, { type PostCardData } from '@/components/content/PostCard'

// The blog's content, shared between the public website (/blog) and the
// in-app mirror (/content/blog) - same data, same rendering, just wrapped by a
// different shell (PublicShell vs AppShell). `basePath` keeps post links
// pointing at whichever surface the reader is currently on.
export default async function BlogFeed({ basePath }: { basePath: string }) {
  const supabase = await createClient()
  // RLS returns only published posts for the anon/authenticated key.
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, cover_image_url, category, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const posts = (data ?? []) as PostCardData[]

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
            <PostCard key={p.slug} post={p} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  )
}
