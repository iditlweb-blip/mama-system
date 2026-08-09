import type { Metadata } from 'next'
import CommunityQuestion, { getCommunityThread } from '@/components/content/CommunityQuestion'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const thread = await getCommunityThread(id)
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
  return <CommunityQuestion id={id} basePath="/community" />
}
