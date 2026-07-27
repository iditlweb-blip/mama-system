'use client'

// Which parent is currently using the app on THIS device. Both parents share
// one login, so the choice lives in localStorage (per device) rather than on
// the account. Entries are stamped with it so the timeline shows who recorded
// what - mom in a light red tint, dad in a light blue one. null = not stated,
// in which case nothing is labelled.

export type Parent = 'mom' | 'dad'
const KEY = 'activeParent'
export const PARENT_EVT = 'active-parent-changed'
export const PARENT_LABEL: Record<Parent, string> = { mom: 'אמא', dad: 'אבא' }

// Light tints so a glance at the timeline says who logged each entry.
export const PARENT_COLOR: Record<Parent, { bg: string; text: string; border: string }> = {
  mom: { bg: 'rgba(214,86,96,0.10)', text: '#C0392B', border: 'rgba(214,86,96,0.30)' },
  dad: { bg: 'rgba(74,124,196,0.12)', text: '#2E6BB8', border: 'rgba(74,124,196,0.32)' },
}

export function getActiveParent(): Parent | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dad' ? 'dad' : v === 'mom' ? 'mom' : null
  } catch { return null }
}

export function setActiveParent(p: Parent | null): void {
  try {
    if (p) localStorage.setItem(KEY, p)
    else localStorage.removeItem(KEY)
  } catch { /* storage disabled - ignore */ }
  window.dispatchEvent(new CustomEvent(PARENT_EVT, { detail: p }))
}
