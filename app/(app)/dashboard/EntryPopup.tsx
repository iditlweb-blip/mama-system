'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, BedDouble, Milk, Droplets, Play, Square, Check, Moon } from 'lucide-react'
import type { BabyLog } from '@/types/database'
import { useSleepTimer } from '@/lib/useSleepTimer'

const STORAGE_KEY = 'entry_popup_shown'

export default function EntryPopup({
  userId,
  onLog,
}: {
  userId: string
  onLog: (log: BabyLog) => void
}) {
  const supabase = createClient()
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState<'feed' | 'diaper' | null>(null)
  const [done, setDone] = useState<'feed' | 'diaper' | 'sleep' | null>(null)
  const { active, isNight, elapsed, stopping, start, stop, formatTimer } = useSleepTimer(userId)

  useEffect(() => {
    // Show once per session, right as the app opens.
    if (sessionStorage.getItem(STORAGE_KEY)) return
    const t = setTimeout(() => {
      setVisible(true)
      sessionStorage.setItem(STORAGE_KEY, '1')
    }, 700)
    return () => clearTimeout(t)
  }, [])

  if (!visible) return null

  async function quickMark(type: 'feed' | 'diaper') {
    setBusy(type)
    const payload: Record<string, unknown> = {
      user_id: userId,
      type,
      start_time: new Date().toISOString(),
    }
    if (type === 'feed') payload.feed_type = 'breast'
    if (type === 'diaper') payload.diaper_type = 'wet'
    const { data } = await supabase.from('baby_logs').insert(payload).select().single()
    setBusy(null)
    if (data) {
      onLog(data as BabyLog)
      setDone(type)
    }
    setTimeout(() => setVisible(false), 850)
  }

  async function handleStop() {
    const log = await stop()
    if (log) onLog(log)
    setDone('sleep')
    setTimeout(() => setVisible(false), 850)
  }

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
        {/* Close (keeps the timer running if it is) */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 left-4"
          style={{ color: 'var(--text-muted)' }}
          title="סגירה"
        >
          <X className="w-4 h-4" />
        </button>

        {active ? (
          /* ── Timer running ─────────────────────────── */
          <>
            <div className="flex justify-center mb-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: isNight ? 'rgba(60,60,110,0.15)' : 'rgba(92,122,106,0.15)' }}
              >
                {isNight
                  ? <Moon className="w-6 h-6" style={{ color: '#3C3C6E' }} />
                  : <BedDouble className="w-6 h-6" style={{ color: '#5C7A6A' }} />
                }
              </div>
            </div>
            <h3 className="text-lg font-bold text-center mb-1" style={{ color: 'var(--text)' }}>
              {isNight ? 'שנת לילה מתועדת 🌙' : 'התינוק ישן עכשיו 😴'}
            </h3>
            <p className="text-3xl font-mono font-bold text-center mb-1" style={{ color: isNight ? '#3C3C6E' : '#5C7A6A' }}>
              {formatTimer(elapsed)}
            </p>
            <p className="text-xs text-center mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              אפשר לסגור והטיימר ימשיך לרוץ. בסיום נרשום את זמני השינה אוטומטית.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleStop}
                disabled={stopping}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white text-center flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ background: isNight ? '#3C3C6E' : '#5C7A6A' }}
              >
                <Square className="w-4 h-4" fill="white" />
                {stopping ? 'שומרת...' : 'סיום שינה ורישום'}
              </button>
              <button
                onClick={() => setVisible(false)}
                className="w-full py-2 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                השאירי פועל
              </button>
            </div>
          </>
        ) : (
          /* ── Timer not running ─────────────────────── */
          <>
            <div className="flex justify-center mb-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(127,82,104,0.12)' }}
              >
                <BedDouble className="w-6 h-6" style={{ color: '#7F5268' }} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-center mb-1" style={{ color: 'var(--text)' }}>
              מה קורה עכשיו?
            </h3>
            <p className="text-sm text-center mb-5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              אפשר להתחיל טיימר שינה עכשיו, או לסמן האכלה / חיתול במהירות.
            </p>

            <button
              onClick={() => {
                start()
              }}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-white text-center flex items-center justify-center gap-1.5 mb-2"
              style={{ background: '#5C7A6A' }}
            >
              <Play className="w-4 h-4" fill="white" />
              התחלת טיימר שינה
            </button>
            <button
              onClick={() => {
                start({ night: true })
              }}
              className="w-full py-2 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 mb-2"
              style={{ background: 'rgba(60,60,110,0.1)', color: '#3C3C6E', border: '1px solid rgba(60,60,110,0.25)' }}
            >
              <Moon className="w-3.5 h-3.5" />
              טיימר לילה (לניובורן)
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickMark('feed')}
                disabled={busy !== null}
                className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268', border: '1px solid rgba(127,82,104,0.25)' }}
              >
                {done === 'feed' ? <Check className="w-4 h-4" /> : <Milk className="w-4 h-4" />}
                {busy === 'feed' ? '...' : done === 'feed' ? 'נרשם' : 'האכלה'}
              </button>
              <button
                onClick={() => quickMark('diaper')}
                disabled={busy !== null}
                className="py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
                style={{ background: 'rgba(122,106,60,0.1)', color: '#7A6A3C', border: '1px solid rgba(122,106,60,0.25)' }}
              >
                {done === 'diaper' ? <Check className="w-4 h-4" /> : <Droplets className="w-4 h-4" />}
                {busy === 'diaper' ? '...' : done === 'diaper' ? 'נרשם' : 'חיתול'}
              </button>
            </div>

            <button
              onClick={() => setVisible(false)}
              className="w-full py-2 mt-2 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              אחר כך
            </button>
          </>
        )}
      </div>
    </div>
  )
}
