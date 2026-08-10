import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/push'
import { STANDARD_TESTS, calcPregnancyWeek } from '@/lib/pregnancy'

// A day nap running longer than this is worth a "want to wake her?" nudge.
const NAP_OVERRUN_MINUTES = 180

// The hour (Israel time) the "you haven't started a nap timer today" nudge
// checks for. The cron hits this route every few minutes, so this whole hour
// is the window - the per-profile dedupe date is what keeps it to one send.
const MIDDAY_HOUR = 13

function israelHourNow(): number {
  return Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hour12: false }).format(new Date()))
}
function israelDateToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(new Date())
}

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
  const results = { tasks: 0, exams: 0, sleepTimers: 0, middayNudges: 0 }

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
    const { data: taskProfiles } = await admin.from('profiles').select('id, notify_tasks').in('id', [...new Set(dueTasks.map(t => t.user_id))])
    const optedOut = new Set((taskProfiles ?? []).filter(p => p.notify_tasks === false).map(p => p.id))
    const toSend = dueTasks.filter(t => !optedOut.has(t.user_id))

    await Promise.all(toSend.map(t =>
      sendPushToUser(t.user_id, { title: 'תזכורת ממשימות', body: t.title, url: '/tasks', tag: `task-${t.id}` })
    ))
    // Mark ALL matched tasks handled (including opted-out ones) so they don't
    // get re-evaluated on every cron run forever.
    await admin.from('tasks').update({ push_sent: true }).in('id', dueTasks.map(t => t.id))
    results.tasks = toSend.length
  }

  // ── 2. Pregnancy test windows closing ────────────────────────────────────
  // Batched reads (one query each for tests + dedupe rows, instead of
  // per-profile round trips), then all sends fired in parallel.
  const { data: pregnantProfilesRaw } = await admin
    .from('profiles')
    .select('id, due_date, notify_exams')
    .eq('tracking_type', 'pregnancy')
    .not('due_date', 'is', null)
    .limit(1000)
  const pregnantProfiles = (pregnantProfilesRaw ?? []).filter(p => p.notify_exams !== false)

  if (pregnantProfiles.length > 0) {
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

  // ── 3. Sleep timer running past 3 hours (day naps only - night sleep is meant to be long) ──
  const { data: timers } = await admin
    .from('active_sleep_timers')
    .select('user_id, start_time')
    .eq('is_night', false)
    .eq('push_sent', false)
    .limit(500)

  if (timers && timers.length > 0) {
    const { data: timerProfiles } = await admin.from('profiles').select('id, notify_sleep').in('id', [...new Set(timers.map(t => t.user_id))])
    const sleepOptedOut = new Set((timerProfiles ?? []).filter(p => p.notify_sleep === false).map(p => p.id))

    const overrun = timers.filter(timer => {
      if (sleepOptedOut.has(timer.user_id)) return false
      const elapsedMin = (Date.now() - new Date(timer.start_time).getTime()) / 60000
      return elapsedMin > NAP_OVERRUN_MINUTES
    })

    if (overrun.length > 0) {
      await Promise.all(overrun.map(timer => sendPushToUser(timer.user_id, {
        title: 'הטיימר פועל כבר יותר מ-3 שעות',
        body: 'אולי הגיע הזמן לכבות אותו',
        url: '/tracker',
        tag: 'sleep-timer',
      })))
      await admin.from('active_sleep_timers').update({ push_sent: true }).in('user_id', overrun.map(t => t.user_id))
      results.sleepTimers = overrun.length
    }
  }

  // ── 4. Midday nudge: baby-tracking mothers who haven't started a sleep timer
  // today, once a day, only during the target hour (dedupe column keeps it to
  // a single send even though the cron hits this route every few minutes).
  if (israelHourNow() === MIDDAY_HOUR) {
    const today = israelDateToday()
    const { data: babyProfilesRaw } = await admin
      .from('profiles')
      .select('id, notify_sleep')
      .eq('tracking_type', 'baby')
      .or(`midday_nap_reminder_date.is.null,midday_nap_reminder_date.neq.${today}`)
      .limit(1000)
    const babyProfiles = (babyProfilesRaw ?? []).filter(p => p.notify_sleep !== false)

    if (babyProfiles.length > 0) {
      const { data: activeTimers } = await admin.from('active_sleep_timers').select('user_id')
      const activeUserIds = new Set((activeTimers ?? []).map(t => t.user_id))
      const idle = babyProfiles.filter(p => !activeUserIds.has(p.id))

      if (idle.length > 0) {
        await Promise.all(idle.map(p => sendPushToUser(p.id, {
          title: 'עדיין לא תיעדת שינה היום',
          body: 'האפליקציה כאן כדי לעזור לך לעקוב - אפשר להתחיל טיימר שינה בכל רגע',
          url: '/tracker',
          tag: 'midday-nap-nudge',
        })))
        await admin.from('profiles').update({ midday_nap_reminder_date: today }).in('id', idle.map(p => p.id))
        results.middayNudges = idle.length
      }
    }
  }

  return NextResponse.json({ ok: true, ...results })
}
