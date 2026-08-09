import CommunityQuestion from '@/components/content/CommunityQuestion'

export const revalidate = 60

export default async function AppCommunityQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CommunityQuestion id={id} basePath="/content/community" />
}
