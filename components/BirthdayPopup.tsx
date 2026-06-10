'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

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

function getMilestone(weeks: number): { key: string; label: string; emoji: string } | null {
  if (weeks >= 24 && weeks <= 28) return { key: 'half', label: 'חצי שנה', emoji: '🎉' }
  if (weeks >= 50 && weeks <= 54) return { key: 'year', label: 'שנה שלמה', emoji: '🎂' }
  return null
}

function pushNotification(notif: Omit<AppNotification, 'ts' | 'read'>) {
  try {
    const raw = localStorage.getItem('mama_notifications')
    const list: AppNotification[] = raw ? JSON.parse(raw) : []
    // Avoid duplicates
    if (list.find(n => n.id === notif.id)) return
    list.unshift({ ...notif, read: false, ts: Date.now() })
    localStorage.setItem('mama_notifications', JSON.stringify(list))
    window.dispatchEvent(new Event('notification_update'))
  } catch {}
}

export default function BirthdayPopup({ babyName, babyGender, babyWeeks }: Props) {
  const [visible, setVisible] = useState(false)
  const milestone = getMilestone(babyWeeks)

  useEffect(() => {
    if (!milestone) return
    const key = `milestone_${milestone.key}_shown`
    if (localStorage.getItem(key)) return
    const timer = setTimeout(() => {
      setVisible(true)
      localStorage.setItem(key, '1')
      const genderWord = babyGender === 'girl' ? 'בת' : 'בן'
      pushNotification({
        id: `milestone_${milestone.key}`,
        text: `${babyName} ${genderWord} ${milestone.label}! ${milestone.emoji}`,
      })
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

        <div className="text-5xl mb-3">{milestone.emoji}</div>
        <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          {babyName} {genderWord} {milestone.label}! 🎊
        </h3>
        <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
          איך את רוצה לציין או לחגוג ל{babyName}?
        </p>
        <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
          אם יש לך רעיון — כתבי בפתק 📝
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href="/personal"
            onClick={() => setVisible(false)}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white text-center block"
            style={{ background: '#7F5268' }}
          >
            לפתק אישי ←
          </Link>
          <button onClick={() => setVisible(false)} className="w-full py-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            סגור
          </button>
        </div>
      </div>
    </div>
  )
}
