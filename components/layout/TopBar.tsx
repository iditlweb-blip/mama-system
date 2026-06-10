'use client'

import { useState, useEffect, useRef } from 'react'
import { Moon, Sun, Bell, X, Check } from 'lucide-react'

interface AppNotification {
  id: string
  text: string
  read: boolean
  ts: number
}

interface Props {
  babyName?: string | null
  babyGender?: string | null
  profilePicUrl?: string | null
}

function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem('mama_notifications')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveNotifications(list: AppNotification[]) {
  localStorage.setItem('mama_notifications', JSON.stringify(list))
}

export default function TopBar({ babyName, profilePicUrl }: Props) {
  const [dark, setDark] = useState(false)
  const [date, setDate] = useState('')
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [showDrop, setShowDrop] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  const hasUnread = notifications.some(n => !n.read)

  useEffect(() => {
    const d = new Date()
    setDate(d.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' }))
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') { setDark(true); document.documentElement.classList.add('dark') }

    setNotifications(loadNotifications())

    function onUpdate() { setNotifications(loadNotifications()) }
    window.addEventListener('notification_update', onUpdate)
    return () => window.removeEventListener('notification_update', onUpdate)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setShowDrop(false)
      }
    }
    if (showDrop) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showDrop])

  function markRead(id: string) {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifications(updated)
    saveNotifications(updated)
  }

  function deleteNotification(id: string) {
    const updated = notifications.filter(n => n.id !== id)
    setNotifications(updated)
    saveNotifications(updated)
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
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDrop(v => !v)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', position: 'relative' }}
            title="התראות"
          >
            <Bell className="w-3.5 h-3.5" style={{ color: hasUnread ? '#7F5268' : 'var(--text-muted)' }} />
            {hasUnread && (
              <span style={{
                position: 'absolute', top: '-3px', right: '-3px',
                width: 10, height: 10, borderRadius: '50%',
                background: '#C0392B', border: '1.5px solid white',
                pointerEvents: 'none',
              }} />
            )}
          </button>

          {/* Dropdown */}
          {showDrop && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                minWidth: 260, background: 'var(--bg)',
                border: '1px solid var(--border)', borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 200, overflow: 'hidden',
              }}
            >
              <div
                className="px-3 py-2 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>התראות</span>
                {notifications.length > 0 && (
                  <button
                    onClick={() => { setNotifications([]); saveNotifications([]) }}
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    נקה הכל
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>אין התראות</p>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className="px-3 py-2.5 flex items-start gap-2"
                      style={{
                        borderBottom: '1px solid var(--border)',
                        background: n.read ? 'transparent' : 'rgba(127,82,104,0.04)',
                      }}
                    >
                      {/* Unread dot */}
                      <span
                        style={{
                          width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                          background: n.read ? 'transparent' : '#C0392B',
                          border: n.read ? '1.5px solid var(--border)' : 'none',
                        }}
                      />

                      {/* Text */}
                      <p
                        className="flex-1 text-sm leading-snug"
                        style={{ color: 'var(--text)', fontWeight: n.read ? 400 : 600 }}
                      >
                        {n.text}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            title="סמן כנקרא"
                            className="w-5 h-5 rounded flex items-center justify-center hover:opacity-70"
                            style={{ background: 'rgba(74,124,89,0.12)' }}
                          >
                            <Check className="w-3 h-3" style={{ color: '#4A7C59' }} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n.id)}
                          title="מחק"
                          className="w-5 h-5 rounded flex items-center justify-center hover:opacity-70"
                          style={{ background: 'rgba(192,57,43,0.1)' }}
                        >
                          <X className="w-3 h-3" style={{ color: '#C0392B' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
