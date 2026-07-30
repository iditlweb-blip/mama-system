import Link from 'next/link'
import type { Metadata } from 'next'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
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
  title: string
  body: string | null
  category: string | null
  created_at: string
  community_answers?: { count: number }[]
}

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('community_questions')
    .select('id, author_name, title, body, category, created_at, community_answers(count)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(100)

  const questions = (data ?? []) as QRow[]

  return (
    <div>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: 'clamp(1.7rem,4vw,2.4rem)', fontWeight: 700, color: '#7F5268', margin: '0 0 8px' }}>
          קהילת אמא בסדר
        </h1>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map((q) => {
            const answers = q.community_answers?.[0]?.count ?? 0
            return (
              <Link key={q.id} href={`/community/${q.id}`}
                style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#fff', borderRadius: 16, border: '1px solid rgba(127,82,104,0.10)', padding: '16px 18px', boxShadow: '0 1px 10px rgba(127,82,104,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  {q.category && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7F5268', background: 'rgba(127,82,104,0.10)', borderRadius: 8, padding: '3px 9px' }}>{q.category}</span>
                  )}
                </div>
                <h2 style={{ fontSize: '1.08rem', fontWeight: 700, color: '#3a1e2d', margin: '0 0 6px', lineHeight: 1.4 }}>{q.title}</h2>
                {q.body && (
                  <p style={{ fontSize: '0.9rem', color: '#6b5560', margin: '0 0 10px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.body}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: '0.8rem', color: '#9a8790' }}>
                  <span>{q.author_name ?? 'אמא מהקהילה'}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <MessageCircle style={{ width: 14, height: 14 }} />{answers} תשובות
                  </span>
                  <span>{new Date(q.created_at).toLocaleDateString('he-IL')}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
