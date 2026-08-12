// Client-side helper for the owner-only profile switch. The heavy lifting
// happens server-side in /api/admin/switch-profile (a service-role magic link
// rewrites the session cookies) - this just calls it and reports failures.
// Shared by the header switcher and the sidebar's admin shortcut so the two
// can't drift apart.

export async function switchToProfile(key: string): Promise<boolean> {
  try {
    const res = await fetch('/api/admin/switch-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    })
    // A stale/expired session cookie on this one request is the common case
    // for 401 here (the account is still logged in - a normal page navigation
    // would have silently refreshed it). A reload re-runs that refresh instead
    // of dead-ending on a raw "unauthorized" alert.
    if (res.status === 401) {
      alert('החיבור פג, טוענת מחדש...')
      window.location.reload()
      return false
    }
    const json = await res.json()
    if (!json.ok) { alert(json.error || 'החלפת הפרופיל נכשלה'); return false }
    return true
  } catch {
    alert('החלפת הפרופיל נכשלה')
    return false
  }
}

// Where each profile should land after a successful switch.
export function landingFor(key: string): string {
  if (key === 'admin') return '/admin'
  if (key === 'pregnancy') return '/pregnancy'
  return '/tracker'
}
