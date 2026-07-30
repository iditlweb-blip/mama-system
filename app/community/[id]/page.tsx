import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AnswerForm from '../AnswerForm'

export const revalidate = 60

interface Question {
  id: string
  author_name: string | null
  title: string
  body: string | null
  category: string | null
  created_at: string
  status: string
}

interface Answer {
  id: string
  author_name: string | null
  body: string
  created_at: string
}

async function getThread(id: string) {
  const supabase = await createClient()
  const { data: question } = await supabase
    .from('community_questions')
    .select('id, author_name, title, body, category, created_at, status')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()
  if (!question) return null
  const { data: answers } = await supabase
    .from('community_answers')
    .select('id, author_name, body, created_at')
    .eq('question_id', id)
    .eq('status', 'published')
    .order('created_at', { ascending: true })
  return { question: question as Question, answers: (answers ?? []) as Answer[] }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const thread = await getThread(id)
  if (!thread) return { title: 'שאלה לא נמצאה' }
  const description = thread.question.body?.slice(0, 155) || thread.question.title
  return {
    title: thread.question.title,
    description,
    alternates: { canonical: `/community/${id}` },
    openGraph: { title: thread.question.title, description, type: 'article', url: `/community/${id}` },
  }
}

export default async function QuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const thread = await getThread(id)
  if (!thread) notFound()
  const { question, answers } = thread

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Link href="/community" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#7F5268', fontSize: '0.9rem', textDecoration: 'none', marginBottom: 18 }}>
        <ArrowRight className="w-4 h-4" />
        חזרה לקהילה
      </Link>

      <article style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(127,82,104,0.10)', padding: '22px 24px', marginBottom: 22 }}>
        {question.category && (
          <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, color: '#7F5268', background: 'rgba(127,82,104,0.10)', borderRadius: 8, padding: '3px 9px', marginBottom: 10 }}>{question.category}</span>
        )}
        <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: 'clamp(1.4rem,3.2vw,1.9rem)', fontWeight: 700, color: '#3a1e2d', margin: '0 0 10px', lineHeight: 1.35 }}>
          {question.title}
        </h1>
        {question.body && (
          <p style={{ color: '#3a1e2d', fontSize: '1rem', lineHeight: 1.75, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{question.body}</p>
        )}
        <div style={{ fontSize: '0.8rem', color: '#9a8790' }}>
          {question.author_name ?? 'אמא מהקהילה'} · {new Date(question.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
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
            <div style={{ fontSize: '0.78rem', color: '#9a8790' }}>
              {a.author_name ?? 'אמא מהקהילה'} · {new Date(a.created_at).toLocaleDateString('he-IL')}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid rgba(127,82,104,0.15)', paddingTop: 20 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#3a1e2d', margin: '0 0 12px' }}>התשובה שלך</h3>
        <AnswerForm questionId={question.id} isLoggedIn={!!user} />
      </div>
    </div>
  )
}
