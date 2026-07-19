'use client'

import { useEffect, useState } from 'react'
import { useSleepTimer } from '@/lib/useSleepTimer'
import { BedDouble, Moon, Square, X } from 'lucide-react'

// A slim bar that appears just below the header, on every authenticated
// page, whenever the shared sleep timer is running — so it's always obvious
// a session is being tracked even after navigating away from the tracker.
// The user can always dismiss it; it reappears automatically the next time
// a new timer session starts.
export default function GlobalTimerBar({ userId }: { userId: string }) {
  const timer = useSleepTimer(userId)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(false)
  }, [timer.startMs])

  if (!timer.active || dismissed) return null

  async function handleStop() {
    await timer.stop()
  }

  const accent = timer.isNight ? '#3C3C6E' : '#5C7A6A'

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 md:px-8 py-2 text-sm flex-shrink-0"
      style={{
        background: timer.isNight ? 'rgba(60,60,110,0.12)' : 'rgba(92,122,106,0.12)',
        borderBottom: `1px solid ${timer.isNight ? 'rgba(60,60,110,0.3)' : 'rgba(92,122,106,0.3)'}`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {timer.isNight
          ? <Moon className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
          : <BedDouble className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
        }
        <span className="font-medium truncate" style={{ color: 'var(--text)' }}>
          {timer.isNight ? 'שנת לילה מתועדת' : 'טיימר שינה פועל'}
        </span>
        <span className="font-mono font-bold flex-shrink-0" style={{ color: accent }}>
          {timer.formatTimer(timer.elapsed)}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleStop}
          disabled={timer.stopping}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: accent }}
        >
          <Square className="w-3 h-3" fill="white" /> {timer.stopping ? 'שומרת...' : 'סיום'}
        </button>
        <button onClick={() => setDismissed(true)} title="סגירה" style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
