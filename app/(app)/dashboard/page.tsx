import { createClient } from '@/lib/supabase/server'
import { getAuthUserId, getProfile } from '@/lib/supabase/auth'
import { getDailyMotivation } from '@/lib/motivations'
import DashboardClient, { type PregnancyTest } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const userId = await getAuthUserId()

  const todayDow = new Date().getDay()
  // `profile` reuses the request-cached row already fetched by the layout, so
  // it costs nothing extra here. The rest run in parallel.
  const [profile, { data: tasks }, { data: logs }, { data: todaySchedule }] = await Promise.all([
    getProfile(),
    supabase.from('tasks').select('*').eq('user_id', userId!).in('status', ['todo', 'inprogress']).order('created_at', { ascending: false }).limit(5),
    supabase.from('baby_logs').select('*').eq('user_id', userId!).or(`start_time.gte.${new Date().toISOString().split('T')[0]},end_time.gte.${new Date().toISOString().split('T')[0]}`).order('start_time', { ascending: false }).limit(10),
    supabase.from('weekly_schedule').select('*').eq('user_id', userId!).eq('day_of_week', todayDow).order('start_time'),
  ])

  const motivation = getDailyMotivation()

  // Pregnancy mode: fetch the woman's tests so the dashboard can show upcoming
  // tests + quick-add instead of the baby feed/sleep widgets.
  const isPregnancy = profile?.tracking_type === 'pregnancy'
  let pregnancyTests: PregnancyTest[] = []
  if (isPregnancy) {
    const { data } = await supabase
      .from('pregnancy_tests')
      .select('*')
      .eq('user_id', userId!)
      .order('scheduled_week', { ascending: true })
    pregnancyTests = (data as PregnancyTest[]) || []
  }

  // Compute baby age
  let babyWeeks = 0
  let babyAgeLabel = ''
  let nextMilestone = ''

  if (profile?.baby_birthdate) {
    const birth = new Date(profile.baby_birthdate)
    const today = new Date()
    const diffMs = today.getTime() - birth.getTime()
    babyWeeks = Math.floor(diffMs / (7 * 86400000))
    const totalDays = Math.floor(diffMs / 86400000)
    const months = Math.floor(totalDays / 30.44)

    const genderPrefix = profile?.baby_gender === 'boy' ? 'בן' : profile?.baby_gender === 'girl' ? 'בת' : 'בגיל'

    if (babyWeeks < 8) {
      babyAgeLabel = `${genderPrefix} ${babyWeeks} שבועות`
    } else if (months < 24) {
      const remainingWeeks = Math.floor((totalDays - months * 30.44) / 7)
      babyAgeLabel = remainingWeeks > 0
        ? `${genderPrefix} ${months} חודשים ו-${remainingWeeks} שבועות`
        : `${genderPrefix} ${months} חודשים`
    } else {
      const years = Math.floor(months / 12)
      const remMonths = months % 12
      babyAgeLabel = remMonths > 0
        ? `${genderPrefix} ${years} שנים ו-${remMonths} חודשים`
        : `${genderPrefix} ${years} שנים`
    }

    const milestones = [
      { week: 4, text: 'חיוך חברתי ראשון' },
      { week: 8, text: 'מעקב עיניים אחרי חפצים' },
      { week: 12, text: 'הרמת ראש בשכיבה על הבטן' },
      { week: 16, text: 'אחיזת חפצים ביד' },
      { week: 20, text: 'הפיכה מגב לבטן' },
      { week: 24, text: 'ישיבה עם תמיכה' },
      { week: 28, text: 'זחילה ראשונה' },
      { week: 32, text: 'עמידה עם תמיכה' },
      { week: 36, text: 'מילים ראשונות' },
      { week: 40, text: 'צעדים ראשונים' },
      { week: 44, text: 'הבנת הוראות פשוטות' },
      { week: 52, text: 'יום הולדת ראשון!' },
    ]
    const next = milestones.find(m => m.week > babyWeeks)
    if (next) nextMilestone = `עוד ${next.week - babyWeeks} שבועות — ${next.text}`
  }

  // Last feed/sleep
  const lastFeed = logs?.find(l => l.type === 'feed')
  const lastSleep = logs?.find(l => l.type === 'sleep')
  const lastFeedAgo = lastFeed ? getTimeAgo(lastFeed.start_time) : null
  const lastSleepAgo = lastSleep ? getTimeAgo(lastSleep.start_time) : null

  return (
    <DashboardClient
      userId={userId!}
      profile={profile}
      tasks={tasks || []}
      motivation={motivation}
      babyWeeks={babyWeeks}
      babyAgeLabel={babyAgeLabel}
      nextMilestone={nextMilestone}
      lastFeedAgo={lastFeedAgo}
      lastSleepAgo={lastSleepAgo}
      todayLogs={logs || []}
      todaySchedule={todaySchedule || []}
      isPregnancy={isPregnancy}
      dueDate={profile?.due_date ?? null}
      pregnancyTests={pregnancyTests}
    />
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `לפני ${mins} דקות`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `לפני ${hrs} שעות`
  return `לפני ${Math.floor(hrs / 24)} ימים`
}
