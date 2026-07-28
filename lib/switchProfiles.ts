import { ADMIN_EMAIL } from './admin'

// The accounts the owner hops between while working on the app:
//   admin     - the management back-office (/admin)
//   personal  - her own real baby tracking
//   pregnancy - the fictitious profile used to preview pregnancy mode
// Each email can be overridden by an env var without touching code.
// SERVER ONLY - emails must never be shipped to the browser.

export interface SwitchProfile { key: string; label: string; email: string }

export function switchProfiles(): SwitchProfile[] {
  // 'personal' and 'admin' are the SAME account by default: the owner's real
  // baby tracking lives on the admin account. They stay two separate entries
  // because they land on different pages (/tracker vs /admin) - do not dedupe
  // them by email, or the sidebar's back-office shortcut loses its target.
  return [
    { key: 'personal',  label: 'תינוק', email: process.env.PERSONAL_PROFILE_EMAIL || ADMIN_EMAIL },
    { key: 'pregnancy', label: 'הריון', email: process.env.TEST_PROFILE_EMAIL     || 'dana@gmail.com' },
    { key: 'admin',     label: 'ניהול', email: process.env.ADMIN_PROFILE_EMAIL    || ADMIN_EMAIL },
  ].map(p => ({ ...p, email: p.email.trim().toLowerCase() }))
}

export function findProfileByEmail(email: string | null | undefined): SwitchProfile | null {
  if (!email) return null
  const e = email.trim().toLowerCase()
  return switchProfiles().find(p => p.email === e) ?? null
}

// What the client needs: labels + which one is active. No emails.
export function switchOptionsFor(email: string | null | undefined) {
  const current = findProfileByEmail(email)
  if (!current) return []
  return switchProfiles().map(p => ({ key: p.key, label: p.label, current: p.key === current.key }))
}
