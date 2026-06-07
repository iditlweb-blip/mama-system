'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Bell } from 'lucide-react'

interface Props {
  babyName?: string | null
  babyGender?: string | null
  profilePicUrl?: string | null
}

export default function TopBar({ babyName, profilePicUrl }: Props) {
  const [dark, setDark] = useState(false)
  const [date, setDate] = useState('')

  useEffect(() => {
    const d = new Date()
    setDate(d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }))
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') { setDark(true); document.documentElement.classList.add('dark') }
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('darkMode', String(next))
  }

  return (
    <header
      className="flex items-center justify-between py-3.5 border-b pr-16 pl-6 md:px-6"
      style={{ background: '#fff', borderColor: 'var(--border)' }}
    >
      {/* Greeting — pushed right enough to not overlap with fixed hamburger (right-4, w-10) */}
      <div>
        <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>
          {babyName ? `מה שלום ${babyName} היום?` : 'שלום 👋'}
        </p>
        <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>{date}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Profile picture / initials */}
        <div
          className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
          style={{ background: profilePicUrl ? 'transparent' : 'var(--purple)' }}
        >
          {profilePicUrl
            ? <img src={profilePicUrl} alt="פרופיל" className="w-full h-full object-cover" />
            : '👩'
          }
        </div>

        <button
          onClick={toggleDark}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          title={dark ? 'מצב יום' : 'מצב לילה'}
        >
          {dark
            ? <Sun  className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
            : <Moon className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          }
        </button>

        <button
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          title="התראות"
        >
          <Bell className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    </header>
  )
}
