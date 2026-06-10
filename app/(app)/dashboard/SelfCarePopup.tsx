'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Heart } from 'lucide-react'

const MESSAGES = [
  'צאי לשמש — גם 10 דקות משנות מצב רוח לגמרי ☀️',
  'קשה זה עובר, ואת עושה את הכי טוב שלך 💜',
  'גם קפה ברגע שקט זה טיפוח עצמי. ספורי ✨',
  'אמא מאושרת = תינוק מאושר. לא אנוכי לדאוג לעצמך',
  'יש לך כוח שאת אפילו לא מכירה בו עדיין 🌿',
  'כל יום שעברת זה הישג. כן, גם אלה שהרגישו קשים',
  'שאלי אותך: מתי בפעם האחרונה עשית משהו רק בשבילך?',
]

const STORAGE_KEY = 'selfcare_popup_shown'

export default function SelfCarePopup() {
  const [visible, setVisible] = useState(false)
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)])

  useEffect(() => {
    // Show only once per session
    if (sessionStorage.getItem(STORAGE_KEY)) return
    const timer = setTimeout(() => {
      setVisible(true)
      sessionStorage.setItem(STORAGE_KEY, '1')
    }, 4000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={() => setVisible(false)}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card w-full max-w-sm"
        style={{
          background: '#FFF7F2',
          border: '1px solid rgba(127,82,104,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 left-4"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(127,82,104,0.12)' }}
          >
            <Heart className="w-6 h-6" style={{ color: '#7F5268' }} />
          </div>
        </div>

        {/* Question */}
        <h3 className="text-lg font-bold text-center mb-2" style={{ color: 'var(--text)' }}>
          מה עשית בשביל עצמך השבוע?
        </h3>

        {/* Encouragement */}
        <p className="text-sm text-center mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Link
            href="/personal"
            onClick={() => setVisible(false)}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white text-center block"
            style={{ background: '#7F5268' }}
          >
            לעמוד ״לעצמי״ ←
          </Link>
          <button
            onClick={() => setVisible(false)}
            className="w-full py-2 text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            אחר כך
          </button>
        </div>
      </div>
    </div>
  )
}
