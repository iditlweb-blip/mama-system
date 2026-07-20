import { getAuthUserId, getAuthEmail, getProfile } from '@/lib/supabase/auth'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const [userId, userEmail, profile] = await Promise.all([
    getAuthUserId(),
    getAuthEmail(),
    getProfile(),
  ])
  return <SettingsClient profile={profile} userId={userId!} userEmail={userEmail} />
}
