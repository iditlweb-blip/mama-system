import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminClient from './AdminClient'
import { isAdminEmail } from '@/lib/admin'
import { switchOptionsFor } from '@/lib/switchProfiles'
import { formatGestational } from '@/lib/pregnancy'

// Short "בת 3 חודשים" / "בן 5 שבועות" style label from a birthdate - mirrors
// the dashboard's age calc, condensed for a one-line admin badge.
function babyAgeLabel(birthdate: string, gender: string | null): string {
  const birth = new Date(birthdate)
  const totalDays = Math.floor((Date.now() - birth.getTime()) / 86400000)
  const weeks = Math.floor(totalDays / 7)
  const months = Math.floor(totalDays / 30.44)
  const prefix = gender === 'boy' ? 'בן' : gender === 'girl' ? 'בת' : 'בגיל'
  if (weeks < 8) return `${prefix} ${weeks} שב'`
  if (months < 24) return `${prefix} ${months} חוד'`
  return `${prefix} ${Math.floor(months / 12)} שנים`
}

export default async function AdminPage() {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) redirect('/dashboard')

  // 2. Fetch all users via admin client
  const admin = createAdminClient()
  const { data: authData, error } = await admin.auth.admin.listUsers({ perPage: 500 })
  if (error) {
    console.error('[ADMIN] listUsers error:', error.message)
    return (
      <div style={{ padding: 40, fontFamily: 'monospace', direction: 'ltr' }}>
        <h2>Admin Error</h2>
        <p>Logged in as: <b>{user.email}</b></p>
        <p>Error: <b style={{ color: 'red' }}>{error.message}</b></p>
        <p>Make sure SUPABASE_SERVICE_ROLE_KEY is set in Vercel and redeployed.</p>
      </div>
    )
  }
  const users = authData.users

  // 3. Fetch app stats + PWA data + analytics
  const [
    { count: taskCount },
    { count: logCount },
    { data: profilesData },
    { data: babyLogsData },
    { data: activeTimersData },
    { data: professionals },
    { data: products },
    { data: analyticsData },
    { data: productsSetting },
    { data: whatsappSetting },
    { data: proFormSetting },
    { data: adminTasks },
    { data: adminContent },
    { data: adminPayments },
    { data: adminNotes },
    { data: blogPosts },
    { data: communityQuestions },
  ] = await Promise.all([
    admin.from('tasks').select('*', { count: 'exact', head: true }),
    admin.from('baby_logs').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('id, pwa_installed_at, tracking_type, baby_name, baby_birthdate, baby_gender, due_date, has_given_birth'),
    // Every sleep log, newest first - small enough table to pull in full and
    // reduce in JS (last sleep + count) rather than round-trip per user.
    admin.from('baby_logs').select('user_id, type, start_time, end_time').eq('type', 'sleep').order('start_time', { ascending: false }).limit(3000),
    admin.from('active_sleep_timers').select('user_id, start_time, is_night'),
    admin.from('professionals').select('*').order('sort_order').limit(100),
    admin.from('products').select('*').order('sort_order').limit(100),
    admin.from('user_analytics').select('user_id, page, duration_seconds, session_date').gte('session_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
    admin.from('app_settings').select('value').eq('key', 'products_enabled').maybeSingle(),
    admin.from('app_settings').select('value').eq('key', 'whatsapp_group').maybeSingle(),
    admin.from('app_settings').select('value').eq('key', 'pro_form').maybeSingle(),
    admin.from('admin_tasks').select('*').order('created_at', { ascending: false }).limit(200),
    admin.from('admin_content').select('*').order('created_at', { ascending: false }).limit(200),
    admin.from('admin_payments').select('*').order('created_at', { ascending: false }).limit(200),
    admin.from('admin_notes').select('*').order('created_at', { ascending: false }).limit(200),
    // Blog + community may not be migrated yet - errors are swallowed by the
    // destructure (data is null) so the admin page still renders.
    admin.from('blog_posts').select('*').order('created_at', { ascending: false }).limit(200),
    admin.from('community_questions').select('*, community_answers(count)').order('created_at', { ascending: false }).limit(200),
  ])
  const productsEnabled = productsSetting?.value === true
  const waVal = (whatsappSetting?.value ?? {}) as { url?: string; visible?: boolean }
  const whatsappGroup = { url: waVal.url ?? '', visible: waVal.visible ?? false }

  // Professionals sign-up form + responses sheet (seeded with the owner's links)
  const proVal = (proFormSetting?.value ?? {}) as { formUrl?: string; sheetUrl?: string }
  const proForm = {
    formUrl: proVal.formUrl ?? 'https://docs.google.com/forms/d/1rtqOJaQsPV4mE3VrPyjHTNxXTQBfLb_XeDlPOgGKPfk/viewform',
    sheetUrl: proVal.sheetUrl ?? 'https://docs.google.com/spreadsheets/d/1uTXpGRxSo8z6biHy_Ffwq-bzJISreI5-4rVMnNsvR2k/edit?gid=1154268236',
  }

  // Quick switch between the owner's accounts. No stored credentials - see
  // app/api/admin/switch-profile.
  const switchOptions = switchOptionsFor(user.email)

  // Build profile + PWA lookup maps
  const profileMap: Record<string, NonNullable<typeof profilesData>[number]> = {}
  const pwaMap: Record<string, string> = {}
  for (const p of (profilesData ?? [])) {
    profileMap[p.id] = p
    if (p.pwa_installed_at) pwaMap[p.id] = p.pwa_installed_at
  }

  // Per-user analytics summary (last 7 days)
  const userAnalytics: Record<string, { totalSeconds: number; pages: Record<string, number> }> = {}
  for (const row of (analyticsData ?? [])) {
    if (!userAnalytics[row.user_id]) userAnalytics[row.user_id] = { totalSeconds: 0, pages: {} }
    userAnalytics[row.user_id].totalSeconds += row.duration_seconds ?? 0
    userAnalytics[row.user_id].pages[row.page] = (userAnalytics[row.user_id].pages[row.page] ?? 0) + (row.duration_seconds ?? 0)
  }

  // Last sleep + total sleep-log count per user (babyLogsData is newest-first,
  // so the first row seen per user_id is her most recent sleep).
  const lastSleepMap: Record<string, string> = {}
  const sleepCountMap: Record<string, number> = {}
  for (const row of (babyLogsData ?? [])) {
    if (!lastSleepMap[row.user_id]) lastSleepMap[row.user_id] = row.start_time
    sleepCountMap[row.user_id] = (sleepCountMap[row.user_id] ?? 0) + 1
  }

  // Currently-running sleep timers ("ישנה כרגע").
  const activeSleepMap: Record<string, { start_time: string; is_night: boolean }> = {}
  for (const t of (activeTimersData ?? [])) {
    activeSleepMap[t.user_id] = { start_time: t.start_time, is_night: t.is_night ?? false }
  }

  // 4. Build user summaries
  const userList = users.map(u => {
    const profile = profileMap[u.id]
    const trackingType = (profile?.tracking_type as 'pregnancy' | 'baby' | null) ?? null
    let profileLabel: string | null = null
    if (trackingType === 'pregnancy' && profile?.due_date) {
      const week = formatGestational(profile.due_date)
      profileLabel = week ? `🤰 שבוע ${week}` : null
    } else if (profile?.baby_birthdate) {
      profileLabel = `👶 ${babyAgeLabel(profile.baby_birthdate, profile.baby_gender ?? null)}`
    }
    const activeSleep = activeSleepMap[u.id] ?? null
    return {
      id: u.id,
      email: u.email ?? '',
      name: (u.user_metadata?.full_name as string) ?? '',
      provider: u.app_metadata?.provider ?? 'email',
      created_at: u.created_at,
      last_sign_in: u.last_sign_in_at ?? null,
      confirmed: !!u.email_confirmed_at,
      pwa_installed_at: pwaMap[u.id] ?? null,
      weeklySeconds: userAnalytics[u.id]?.totalSeconds ?? 0,
      topPage: userAnalytics[u.id]
        ? Object.entries(userAnalytics[u.id].pages).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
        : null,
      trackingType,
      profileLabel,
      babyName: profile?.baby_name ?? null,
      babyGender: profile?.baby_gender ?? null,
      babyBirthdate: profile?.baby_birthdate ?? null,
      dueDate: profile?.due_date ?? null,
      hasGivenBirth: profile?.has_given_birth ?? false,
      lastSleepAt: lastSleepMap[u.id] ?? null,
      sleepLogCount: sleepCountMap[u.id] ?? 0,
      isAsleepNow: !!activeSleep,
      sleepStartedAt: activeSleep?.start_time ?? null,
    }
  })

  const now = Date.now()
  const weekAgo = now - 7 * 24 * 3600 * 1000
  const dayAgo  = now - 24 * 3600 * 1000

  const stats = {
    total:        users.length,
    newThisWeek:  users.filter(u => new Date(u.created_at).getTime() > weekAgo).length,
    activeToday:  users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() > dayAgo).length,
    confirmed:    users.filter(u => u.email_confirmed_at).length,
    taskCount:    taskCount ?? 0,
    logCount:     logCount  ?? 0,
    pwaCount:     Object.keys(pwaMap).length,
  }

  return (
    <AdminClient
      users={userList}
      stats={stats}
      professionals={professionals ?? []}
      products={products ?? []}
      productsEnabled={productsEnabled}
      whatsappGroup={whatsappGroup}
      proForm={proForm}
      adminTasks={adminTasks ?? []}
      adminContent={adminContent ?? []}
      adminPayments={adminPayments ?? []}
      adminNotes={adminNotes ?? []}
      blogPosts={blogPosts ?? []}
      communityQuestions={communityQuestions ?? []}
      switchOptions={switchOptions}
    />
  )
}
