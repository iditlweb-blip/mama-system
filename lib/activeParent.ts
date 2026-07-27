'use client'

// Which parent is currently using the app on THIS device. Both parents share
// one login, so we keep the choice in localStorage (per device) rather than in
// the account - mom's phone stays "mom", dad's phone stays "dad". Every logged
// entry is stamped with this so the timeline can show who recorded it.

export type Parent = 'mom' | 'dad'
const KEY = 'activeParent'
export const PARENT_EVT = 'active-parent-changed'
export const PARENT_LABEL: Record<Parent, string> = { mom: 'אמא', dad: 'אבא' }

export function getActiveParent(): Parent {
  if (typeof window === 'undefined') return 'mom'
  try { return localStorage.getItem(KEY) === 'dad' ? 'dad' : 'mom' } catch { return 'mom' }
}

export function setActiveParent(p: Parent): void {
  try { localStorage.setItem(KEY, p) } catch { /* storage disabled - ignore */ }
  window.dispatchEvent(new CustomEvent(PARENT_EVT, { detail: p }))
}
