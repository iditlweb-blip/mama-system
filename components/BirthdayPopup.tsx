'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, PartyPopper, Cake, Pencil, ChevronLeft, type LucideIcon } from 'lucide-react'

interface Props {
  babyName: string
  babyGender?: string | null
  babyWeeks: number
}

interface AppNotification {
  id: string
  text: string
  read: boolean
  ts: number
}

function getMilestone(weeks: number): { key: string; label: string; Icon: LucideIcon } | null {
  if (weeks >= 24 && weeks <= 28) return { key: 'half', label: 'חצי שנה', Icon: PartyPopper }
  if (weeks >= 50 && weeks <= 54) return { key: 'year', label: 'שנה שלמה', Icon: Cake }
  return null
}

function ensureNotification(id: string, text: string, read: boolean) {
  try {
    const raw = localStorage.getItem('mama_notifications')
    const list: AppNotification[] = raw ? JSON.parse(raw) : []
    if (list.find(n => n.id === id)) return   // already exists — don't touch it
    list.unshift({ id, text, read, ts: Date.now() })
    localStorage.setItem('mama_notifications', JSON.stringify(list))
    window.dispatchEvent(new Event('notification_update'))
  } catch {}
}

export default function BirthdayPopup({ babyName, babyGender, babyWeeks }: Props) {
  const [visible, setVisible] = useState(false)
  const milestone = getMilestone(babyWeeks)

  useEffect(() => {
    if (!milestone) return

    const shownKey  = `milestone_${milestone.key}_shown`
    const alreadyShown = !!localStorage.getItem(shownKey)
    const genderWord   = babyGender === 'girl' ? 'בת' : 'בן'
    const notifId      = `milestone_${milestone.key}`
    const notifText    = `${babyName} ${genderWord} ${milestone.label}!`

    // Always make sure the notification exists in the list.
    // If popup was already shown → create as read (no red dot).
    // If not yet shown → create as unread (red dot).
    ensureNotification(notifId, notifText, alreadyShown)

    // Show popup only the first time
    if (alreadyShown) return
    const timer = setTimeout(() => {
      setVisible(true)
      localStorage.setItem(shownKey, '1')
    }, 2000)
    return () => clearTimeout(timer)
  }, [milestone, babyName, babyGender])

  if (!visible || !milestone) return null

  const genderWord = babyGender === 'girl' ? 'בת' : 'בן'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      }}
      onClick={() => setVisible(false)}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card w-full max-w-sm text-center"
        style={{ background: '#FFF7F2', border: '1px solid rgba(127,82,104,0.2)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', position: 'relative' }}
      >
        <button onClick={() => setVisible(false)} className="absolute top-4 left-4" style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4" />
        </button>

        <milestone.Icon className="mx-auto mb-3" style={{ width: 44, height: 44, color: '#7F5268' }} />
        <h3 className="text-xl font-bold mb-1 flex items-center justify-center gap-1.5" style={{ color: 'var(--text)' }}>
          {babyName} {genderWord} {milestone.label}! <PartyPopper className="w-4 h-4" />
        </h3>
        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          איך את רוצה לציין או לחגוג ל{babyName}?
        </p>
        <p className="text-xs mb-5 flex items-center justify-center gap-1" style={{ color: 'var(--text-muted)' }}>
          אם יש לך רעיון — כתבי בפתק <Pencil className="w-3 h-3" />
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href="/personal"
            onClick={() => setVisible(false)}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white text-center flex items-center justify-center gap-1"
            style={{ background: '#7F5268' }}
          >
            לפתק אישי <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => setVisible(false)} className="w-full py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            סגור
          </button>
        </div>
      </div>
    </div>
  )
}
