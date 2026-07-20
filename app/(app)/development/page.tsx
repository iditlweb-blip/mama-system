import { getProfile } from '@/lib/supabase/auth'
import DevelopmentClient from './DevelopmentClient'
import PregnancyWeekClient from './PregnancyWeekClient'

export default async function DevelopmentPage() {
  const profile = await getProfile()

  // Pregnancy mode swaps the baby-milestone view for the weekly fetal-
  // development view ("מה קורה השבוע").
  if (profile?.tracking_type === 'pregnancy') {
    return <PregnancyWeekClient dueDate={profile?.due_date ?? null} />
  }

  return <DevelopmentClient />
}
