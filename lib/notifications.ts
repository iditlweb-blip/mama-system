'use client'

// Shared in-app notification store, read by the TopBar bell. Entries live in
// localStorage and stay unread until the mother marks them read there, so a
// reminder she dismissed on the popup is still waiting behind the red dot.

export interface AppNotification {
  id: string
  text: string
  read: boolean
  ts: number
}

const KEY = 'mama_notifications'

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

// Adds a notification unless one with the same id already exists (so the same
// reminder isn't stacked every time the app opens).
export function pushNotification(id: string, text: string): void {
  try {
    const list = loadNotifications()
    if (list.some(n => n.id === id)) return
    const next = [{ id, text, read: false, ts: Date.now() }, ...list].slice(0, 50)
    localStorage.setItem(KEY, JSON.stringify(next))
    window.dispatchEvent(new Event('notification_update'))
  } catch { /* storage disabled - ignore */ }
}
