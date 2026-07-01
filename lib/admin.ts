// Single source of truth for the admin account email.
// Both app/admin/page.tsx (access gate) and app/admin/actions.ts (server actions)
// must import this constant instead of hardcoding their own copy — a mismatch
// between the two previously caused every admin save action to fail with
// "Unauthorized" even though the page itself loaded fine.
export const ADMIN_EMAIL = 'momsok100@gmail.com'
