import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push'
import { STANDARD_TESTS, calcPregnancyWeek } from '@/lib/pregnancy'
import { ageInWeeks, napMaxMinutes } from '@/lib/sleepBands'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Time-based push checks, meant to be hit every few minutes by an external
 * scheduler (see PUSH_NOTIFICATIONS_SETUP.md - Vercel Hobby's cron only runs
 * once/day, too coarse for task reminders, so a free external pinger is the
 * recommended setup regardless of plan).
 *
 * Auth: pass the secret as either `?secret=` or `Authorization: Bearer <secret>`
 * (the latter is what Vercel Cron sends automatically if that route is used
 * instead). Configure CRON_SECRET in the environment.
 *
 * All the actual push sends within each section run in parallel (Promise.all)
 * rather than sequential awaits in a for-loop - a free external cron pinger
 * has a request timeout (often ~30s), and sequential sends were measured at
 * ~20s+ even with a couple dozen matches.
 */
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const url = new URL(req.url)
  if (url.searchParams.get('secret') === secret) return true
  const auth = req.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const nowIso = new Date().toISOString()
  const results = { tasks: 0, exams: 0, sleepTimers: 0 }

  // ── 1. Task reminders (remind_at due) ────────────────────────────────────
  const { data: dueTasks } = await admin
    .from('tasks')
    .select('id, user_id, title')
    .not('remind_at', 'is', null)
    .lte('remind_at', nowIso)
    .neq('status', 'done')
    .eq('push_sent', false)
    .limit(500)

  if (dueTasks && dueTasks.length > 0) {
    await Promise.all(dueTasks.map(t =>
      sendPushToUser(t.user_id, { title: 'תזכורת ממשימות', body: t.title, url: '/tasks', tag: `task-${t.id}` })
    ))
    await admin.from('tasks').update({ push_sent: true }).in('id', dueTasks.map(t => t.id))
    results.tasks = dueTasks.length
  }

  // ── 2. Pregnancy test windows closing ────────────────────────────────────
  // Batched reads (one query each for tests + dedupe rows, instead of
  // per-profile round trips), then all sends fired in parallel.
  const { data: pregnantProfiles } = await admin
    .from('profiles')
    .select('id, due_date')
    .eq('tracking_type', 'pregnancy')
    .not('due_date', 'is', null)
    .limit(1000)

  if (pregnantProfiles && pregnantProfiles.length > 0) {
    const profileIds = pregnantProfiles.map(p => p.id)

    const [{ data: allTests }, { data: allNotified }] = await Promise.all([
      admin.from('pregnancy_tests').select('user_id, test_name, completed').in('user_id', profileIds),
      admin.from('exam_push_notified').select('user_id, test_id').in('user_id', profileIds),
    ])

    const completedByUser = new Map<string, Set<string>>()
    for (const t of allTests ?? []) {
      if (!t.completed) continue
      if (!completedByUser.has(t.user_id)) completedByUser.set(t.user_id, new Set())
      completedByUser.get(t.user_id)!.add(t.test_name)
    }
    const notifiedByUser = new Map<string, Set<string>>()
    for (const n of allNotified ?? []) {
      if (!notifiedByUser.has(n.user_id)) notifiedByUser.set(n.user_id, new Set())
      notifiedByUser.get(n.user_id)!.add(n.test_id)
    }

    const matches: { user_id: string; test_id: string; testName: string }[] = []
    for (const profile of pregnantProfiles) {
      const week = calcPregnancyWeek(profile.due_date as string)
      const completedNames = completedByUser.get(profile.id) ?? new Set<string>()
      const notifiedNames = notifiedByUser.get(profile.id) ?? new Set<string>()
      for (const st of STANDARD_TESTS) {
        if (week < st.until || completedNames.has(st.name) || notifiedNames.has(st.name)) continue
        matches.push({ user_id: profile.id, test_id: st.name, testName: st.name })
      }
    }

    if (matches.length > 0) {
      await Promise.all(matches.map(m => sendPushToUser(m.user_id, {
        title: 'בדיקה שעומדת להסתיים',
        body: `החלון המומלץ ל${m.testName} מתקרב לסיום`,
        url: '/pregnancy',
        tag: `exam-${m.test_id}`,
      })))
      await admin.from('exam_push_notified').insert(matches.map(({ user_id, test_id }) => ({ user_id, test_id })))
      results.exams = matches.length
    }
  }

  // ── 3. Sleep timer running long (day naps only - night sleep is meant to be long) ──
  const { data: timers } = await admin
    .from('active_sleep_timers')
    .select('user_id, start_time')
    .eq('is_night', false)
    .eq('push_sent', false)
    .limit(500)

  if (timers && timers.length > 0) {
    const userIds = timers.map(t => t.user_id)
    const { data: profiles } = await admin.from('profiles').select('id, baby_birthdate').in('id', userIds)
    const birthdateByUser = new Map((profiles ?? []).map(p => [p.id, p.baby_birthdate as string | null]))

    const overrun = timers.filter(timer => {
      const weeks = ageInWeeks(birthdateByUser.get(timer.user_id))
      if (weeks == null) return false
      const elapsedMin = (Date.now() - new Date(timer.start_time).getTime()) / 60000
      return elapsedMin > napMaxMinutes(weeks)
    })

    if (overrun.length > 0) {
      await Promise.all(overrun.map(timer => sendPushToUser(timer.user_id, {
        title: 'התנומה נמשכת זמן רב',
        body: 'ייתכן שזה זמן טוב להעיר, אם תרצי',
        url: '/tracker',
        tag: 'sleep-timer',
      })))
      await admin.from('active_sleep_timers').update({ push_sent: true }).in('user_id', overrun.map(t => t.user_id))
      results.sleepTimers = overrun.length
    }
  }

  return NextResponse.json({ ok: true, ...results })
}
