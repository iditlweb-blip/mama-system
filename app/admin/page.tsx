import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminClient from './AdminClient'

const ADMIN_EMAIL = 'idit62@gmail.com'

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
        <p>Make sure SUPABASE_SERVICE_ROLE_KEY is set in Vercel and you redeployed.</p>
      </div>
    )
  }
  const users = authData.users

  // 3. Fetch app stats from DB
  const [
    { count: taskCount },
    { count: logCount },
    { count: chatCount },
  ] = await Promise.all([
    admin.from('tasks').select('*', { count: 'exact', head: true }),
    admin.from('baby_logs').select('*', { count: 'exact', head: true }),
    admin.from('chat_messages').select('*', { count: 'exact', head: true }),
  ])

  // 4. Build user summaries
  const userList = users.map(u => ({
    id: u.id,
    email: u.email ?? '',
    name: (u.user_metadata?.full_name as string) ?? '',
    provider: u.app_metadata?.provider ?? 'email',
    created_at: u.created_at,
    last_sign_in: u.last_sign_in_at ?? null,
    confirmed: !!u.email_confirmed_at,
  }))

  const now = Date.now()
  const weekAgo = now - 7 * 24 * 3600 * 1000
  const dayAgo  = now - 24 * 3600 * 1000

  const stats = {
    total: users.length,
    newThisWeek: users.filter(u => new Date(u.created_at).getTime() > weekAgo).length,
    activeToday: users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() > dayAgo).length,
    confirmed: users.filter(u => u.email_confirmed_at).length,
    taskCount:  taskCount  ?? 0,
    logCount:   logCount   ?? 0,
    chatCount:  chatCount  ?? 0,
  }

  return <AdminClient users={userList} stats={stats} />
}
