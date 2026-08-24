import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import CommunityAvatar from '@/components/public/CommunityAvatar'
import Breadcrumbs from '@/components/public/Breadcrumbs'
import AnswerForm from '@/app/community/AnswerForm'

export interface CommunityQuestionData {
  id: string
  author_name: string | null
  author_avatar_url: string | null
  title: string
  body: string | null
  category: string | null
  created_at: string
  status: string
}

export interface CommunityAnswerData {
  id: string
  author_name: string | null
  author_avatar_url: string | null
  body: string
  created_at: string
}

export async function getCommunityThread(id: string) {
  const supabase = await createClient()
  // Avatar columns are preferred but optional (migration 028); fall back if a
  // missing column errors the query.
  let question = (await supabase
    .from('community_questions')
    .select('id, author_name, author_avatar_url, title, body, category, created_at, status')
    .eq('id', id).eq('status', 'published').maybeSingle()).data as CommunityQuestionData | null
  if (!question) {
    question = (await supabase
      .from('community_questions')
      .select('id, author_name, title, body, category, created_at, status')
      .eq('id', id).eq('status', 'published').maybeSingle()).data as unknown as CommunityQuestionData | null
  }
  if (!question) return null

  let answers = (await supabase
    .from('community_answers')
    .select('id, author_name, author_avatar_url, body, created_at')
    .eq('question_id', id).eq('status', 'published').order('created_at', { ascending: true })).data as CommunityAnswerData[] | null
  if (!answers) {
    answers = (await supabase
      .from('community_answers')
      .select('id, author_name, body, created_at')
      .eq('question_id', id).eq('status', 'published').order('created_at', { ascending: true })).data as unknown as CommunityAnswerData[] | null
  }
  return { question, answers: answers ?? [] }
}

// A single question's content, shared between the public website
// (/community/[id]) and the in-app mirror (/content/community/[id]).
export default async function CommunityQuestion({ id, basePath }: { id: string; basePath: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const thread = await getCommunityThread(id)
  if (!thread) notFound()
  const { question, answers } = thread

  const homeCrumb = basePath.startsWith('/content')
    ? { label: 'דשבורד', href: '/dashboard' }
    : { label: 'עמוד בית', href: '/' }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <Breadcrumbs
        items={[
          homeCrumb,
          { label: 'קהילה', href: basePath },
          { label: question.title },
        ]}
      />

      <Link href={basePath} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#7F5268', fontSize: '0.9rem', textDecoration: 'none', marginBottom: 18 }}>
        <ArrowRight className="w-4 h-4" />
        חזרה לקהילה
      </Link>

      <article style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(127,82,104,0.10)', padding: '22px 24px', marginBottom: 22 }}>
        {question.category && (
          <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, color: '#7F5268', background: 'rgba(127,82,104,0.10)', borderRadius: 8, padding: '3px 9px', marginBottom: 10 }}>{question.category}</span>
        )}
        <h1 style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(1.6rem,3.6vw,2.2rem)', fontWeight: 700, color: '#7F5268', margin: '0 0 10px', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
          {question.title}
        </h1>
        {question.body && (
          <p style={{ color: '#3a1e2d', fontSize: '1rem', lineHeight: 1.75, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{question.body}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#9a8790' }}>
          <CommunityAvatar url={question.author_avatar_url} size={28} />
          <span>{question.author_name ?? 'אמא מהקהילה'}</span>
          <span>· {new Date(question.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </article>

      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 700, color: '#7F5268', margin: '0 0 14px' }}>
        <MessageCircle style={{ width: 18, height: 18 }} />
        {answers.length} תשובות
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 26 }}>
        {answers.length === 0 ? (
          <p style={{ color: '#9a8790', fontSize: '0.95rem' }}>עוד אין תשובות. את יכולה להיות הראשונה שעוזרת 💜</p>
        ) : answers.map((a) => (
          <div key={a.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(127,82,104,0.10)', padding: '14px 16px' }}>
            <p style={{ color: '#3a1e2d', fontSize: '0.97rem', lineHeight: 1.7, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{a.body}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#9a8790' }}>
              <CommunityAvatar url={a.author_avatar_url} size={24} />
              <span>{a.author_name ?? 'אמא מהקהילה'}</span>
              <span>· {new Date(a.created_at).toLocaleDateString('he-IL')}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(127,82,104,0.15)', paddingTop: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3a1e2d', margin: '0 0 12px' }}>התשובה שלך</h3>
        <AnswerForm questionId={question.id} isLoggedIn={!!user} basePath={basePath} />
      </div>
    </div>
  )
}
