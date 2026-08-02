import Link from 'next/link'
import type { Metadata } from 'next'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import GradientTitle from '@/components/public/GradientTitle'
import CommunityAvatar from '@/components/public/CommunityAvatar'
import AskQuestionForm from './AskQuestionForm'

export const metadata: Metadata = {
  title: 'קהילת שאלות ותשובות לאימהות',
  description: 'מקום לשאול ולענות: שאלות של אימהות טריות על שינה, הנקה, התפתחות והכל שביניהם. קהילה תומכת ובלי שיפוטיות.',
  alternates: { canonical: '/community' },
  openGraph: {
    title: 'קהילת שאלות ותשובות · אמא בסדר',
    description: 'מקום לשאול ולענות. קהילת אימהות תומכת.',
    type: 'website',
    url: '/community',
  },
}

// Community is active - revalidate on a shorter window than the blog.
export const revalidate = 60

interface QRow {
  id: string
  author_name: string | null
  author_avatar_url: string | null
  title: string
  body: string | null
  category: string | null
  created_at: string
  community_answers?: { count: number }[]
}

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const baseCols = 'id, author_name, title, body, category, created_at, community_answers(count)'
  // Prefer the avatar column; fall back if migration 028 hasn't run yet (a
  // missing column makes PostgREST error and return null, not an empty array).
  let rows = (await supabase
    .from('community_questions')
    .select(`${baseCols}, author_avatar_url`)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(100)).data as QRow[] | null
  if (!rows) {
    rows = (await supabase
      .from('community_questions')
      .select(baseCols)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100)).data as unknown as QRow[] | null
  }

  const questions = rows ?? []

  return (
    <div>
      <header className="public-hero-head" style={{ marginBottom: 30 }}>
        <GradientTitle>קהילה</GradientTitle>
        <p style={{ color: '#5b4a52', fontSize: '1.15rem', fontWeight: 300, margin: '4px auto 0', maxWidth: 760, lineHeight: 1.6 }}>
          מקום לשאול, לענות ולתמוך. אין שאלה טיפשית, וכל אמא כאן עברה משהו דומה.
        </p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 34 }}>
        <AskQuestionForm isLoggedIn={!!user} />
      </div>

      {questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#9a8790' }}>
          <p style={{ fontSize: '1.05rem', margin: 0 }}>עוד אין שאלות - את יכולה להיות הראשונה 💜</p>
        </div>
      ) : (
        <div className="community-grid">
          {questions.map((q) => {
            const answers = q.community_answers?.[0]?.count ?? 0
            return (
              <Link key={q.id} href={`/community/${q.id}`}
                style={{
                  position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  textAlign: 'center', gap: 10, textDecoration: 'none', color: 'inherit', background: '#fff',
                  borderRadius: 22, padding: '26px 22px 24px',
                  boxShadow: '0 6px 22px rgba(127,82,104,0.08)',
                }}>
                {q.category && (
                  <span style={{ position: 'absolute', top: 16, left: 16, fontSize: '0.72rem', fontWeight: 500, color: '#7F5268', background: 'rgba(127,82,104,0.10)', borderRadius: 10, padding: '4px 11px' }}>{q.category}</span>
                )}
                <time style={{ fontSize: '0.82rem', fontWeight: 300, color: '#9a8790', marginTop: 6 }}>
                  {new Date(q.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.88rem', color: '#6b5560' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CommunityAvatar url={q.author_avatar_url} size={30} />
                    {q.author_name ?? 'אמא מהקהילה'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <MessageCircle style={{ width: 15, height: 15 }} />{answers} תגובות
                  </span>
                </div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 500, color: '#3a2530', margin: 0, lineHeight: 1.45 }}>{q.title}</h2>
                {q.body && (
                  <p style={{ fontSize: '0.9rem', fontWeight: 300, color: '#6b5560', margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {q.body}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
