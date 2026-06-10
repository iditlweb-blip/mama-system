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
  const [notification, setNotification] = useState<string | null>(null)
  const [showNotifDrop, setShowNotifDrop] = useState(false)

  useEffect(() => {
    const d = new Date()
    setDate(d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }))
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') { setDark(true); document.documentElement.classList.add('dark') }

    // Load pending notification
    loadNotification()
    window.addEventListener('notification_update', loadNotification)
    return () => window.removeEventListener('notification_update', loadNotification)
  }, [])

  function loadNotification() {
    const raw = localStorage.getItem('pending_notification')
    if (raw) {
      try { setNotification(JSON.parse(raw).text) } catch { setNotification(null) }
    } else {
      setNotification(null)
    }
  }

  function dismissNotification() {
    localStorage.removeItem('pending_notification')
    setNotification(null)
    setShowNotifDrop(false)
  }

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
      {/* Greeting */}
      <div>
        <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>
          {babyName ? `מה שלום ${babyName} היום?` : 'שלום 👋'}
        </p>
        <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>{date}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Profile picture */}
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

        {/* Bell with badge */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifDrop(v => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            title="התראות"
          >
            <Bell className="w-3.5 h-3.5" style={{ color: notification ? '#7F5268' : 'var(--text-muted)' }} />
            {notification && (
              <span style={{
                position: 'absolute', top: '-3px', right: '-3px',
                width: 10, height: 10, borderRadius: '50%',
                background: '#C0392B', border: '1.5px solid white',
              }} />
            )}
          </button>

          {/* Dropdown */}
          {showNotifDrop && (
            <div
              style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 6,
                minWidth: 220, background: 'var(--bg)',
                border: '1px solid var(--border)', borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                padding: 12, zIndex: 200,
              }}
            >
              {notification ? (
                <>
                  <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>🎉 {notification}</p>
                  <button
                    onClick={dismissNotification}
                    className="text-xs w-full text-center py-1.5 rounded-lg"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                  >
                    סמן כנקרא
                  </button>
                </>
              ) : (
                <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>אין התראות חדשות</p>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
