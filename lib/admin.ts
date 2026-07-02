// Single source of truth for the admin account email.
// Both app/admin/page.tsx (access gate) and app/admin/actions.ts (server actions)
// must import this constant instead of hardcoding their own copy — a mismatch
// between the two previously caused every admin save action to fail with
// "Unauthorized" even though the page itself loaded fine.
export const ADMIN_EMAIL = 'momsok100@gmail.com'

// Case/whitespace-insensitive comparison — Supabase stores emails exactly as
// entered at signup/login, so a stray trailing space or different casing would
// otherwise cause a silent mismatch against the constant above.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase()
}
