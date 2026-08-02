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
      <header className="public-hero-head" style={{ marginBottom: 24 }}>
        <GradientTitle>קהילה</GradientTitle>
        <p style={{ color: '#6b5560', fontSize: '1.02rem', margin: 0, lineHeight: 1.6 }}>
          מקום לשאול, לענות ולתמוך. אין שאלה טיפשית, וכל אמא כאן עברה משהו דומה.
        </p>
      </header>

      <AskQuestionForm isLoggedIn={!!user} />

      {questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: '#9a8790' }}>
          <p style={{ fontSize: '1.05rem', margin: 0 }}>עוד אין שאלות - את יכולה להיות הראשונה 💜</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {questions.map((q) => {
            const answers = q.community_answers?.[0]?.count ?? 0
            return (
              <Link key={q.id} href={`/community/${q.id}`}
                style={{
                  position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  textAlign: 'center', gap: 10, textDecoration: 'none', color: 'inherit', background: '#fff',
                  borderRadius: 18, border: '1px solid rgba(127,82,104,0.10)', padding: '22px 18px 20px',
                  boxShadow: '0 2px 14px rgba(127,82,104,0.06)',
                }}>
                {q.category && (
                  <span style={{ position: 'absolute', top: 12, insetInlineEnd: 14, fontSize: '0.7rem', fontWeight: 700, color: '#7F5268', background: 'rgba(127,82,104,0.10)', borderRadius: 8, padding: '3px 9px' }}>{q.category}</span>
                )}
                <time style={{ fontSize: '0.78rem', color: '#9a8790', marginTop: q.category ? 14 : 0 }}>
                  {new Date(q.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem', color: '#6b5560' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <CommunityAvatar url={q.author_avatar_url} size={30} />
                    {q.author_name ?? 'אמא מהקהילה'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <MessageCircle style={{ width: 15, height: 15 }} />{answers} תגובות
                  </span>
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3a1e2d', margin: 0, lineHeight: 1.45 }}>{q.title}</h2>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
