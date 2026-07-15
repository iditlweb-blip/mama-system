import { createClient } from '@/lib/supabase/server'
import { getDailyMotivation } from '@/lib/motivations'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const todayDow = new Date().getDay()
  const [{ data: profile }, { data: tasks }, { data: logs }, { data: todaySchedule }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('tasks').select('*').eq('user_id', user!.id).in('status', ['todo', 'inprogress']).order('created_at', { ascending: false }).limit(5),
    supabase.from('baby_logs').select('*').eq('user_id', user!.id).gte('start_time', new Date().toISOString().split('T')[0]).order('start_time', { ascending: false }).limit(10),
    supabase.from('weekly_schedule').select('*').eq('user_id', user!.id).eq('day_of_week', todayDow).order('start_time'),
  ])

  const motivation = getDailyMotivation()

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
      userId={user!.id}
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
