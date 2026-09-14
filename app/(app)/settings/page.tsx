import { getAuthUserId, getAuthEmail, getProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const [userId, userEmail, profile] = await Promise.all([
    getAuthUserId(),
    getAuthEmail(),
    getProfile(),
  ])

  // WhatsApp group link - the admin controls the link and its visibility from
  // the admin panel. Only render the join button when it's turned on.
  const supabase = await createClient()
  const { data: waSetting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'whatsapp_group')
    .maybeSingle()
  const wa = (waSetting?.value ?? {}) as { url?: string; visible?: boolean }
  const whatsappGroup = { url: wa.url ?? '', visible: wa.visible ?? false }

  // Past cycles (see "add a new pregnancy" below) - just enough to show she
  // hasn't lost anything, not a full history browser. Prop is named
  // `pastChildren`, not `children` - that name is reserved for JSX children.
  const { data: pastChildren } = await supabase
    .from('children')
    .select('*')
    .eq('user_id', userId!)
    .order('archived_at', { ascending: false })

  return (
    <SettingsClient
      profile={profile}
      userId={userId!}
      userEmail={userEmail}
      whatsappGroup={whatsappGroup}
      pastChildren={pastChildren ?? []}
    />
  )
}
