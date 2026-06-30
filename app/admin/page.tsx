import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminClient from './AdminClient'

const ADMIN_EMAIL = 'iditlweb@gmail.com'

export default async function AdminPage() {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard')

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
    { data: pwaProfiles },
    { data: professionals },
    { data: products },
    { data: analyticsData },
  ] = await Promise.all([
    admin.from('tasks').select('*', { count: 'exact', head: true }),
    admin.from('baby_logs').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('id, pwa_installed_at').not('pwa_installed_at', 'is', null),
    admin.from('professionals').select('*').order('sort_order').limit(100),
    admin.from('products').select('*').order('sort_order').limit(100),
    admin.from('user_analytics').select('user_id, page, duration_seconds, session_date').gte('session_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
  ])

  // Build PWA lookup map
  const pwaMap: Record<string, string> = {}
  for (const p of (pwaProfiles ?? [])) {
    if (p.pwa_installed_at) pwaMap[p.id] = p.pwa_installed_at
  }

  // Per-user analytics summary (last 7 days)
  const userAnalytics: Record<string, { totalSeconds: number; pages: Record<string, number> }> = {}
  for (const row of (analyticsData ?? [])) {
    if (!userAnalytics[row.user_id]) userAnalytics[row.user_id] = { totalSeconds: 0, pages: {} }
    userAnalytics[row.user_id].totalSeconds += row.duration_seconds ?? 0
    userAnalytics[row.user_id].pages[row.page] = (userAnalytics[row.user_id].pages[row.page] ?? 0) + (row.duration_seconds ?? 0)
  }

  // 4. Build user summaries
  const userList = users.map(u => ({
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
  }))

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
    />
  )
}
