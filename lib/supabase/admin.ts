import { createClient } from '@supabase/supabase-js'

/**
 * Admin client — uses service_role key.
 * NEVER import this in client components.
 * Server-side only.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
