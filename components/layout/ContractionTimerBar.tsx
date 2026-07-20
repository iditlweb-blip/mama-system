'use client'

import { useEffect, useState } from 'react'
import { useContractionTimer } from '@/lib/useContractionTimer'
import { Activity, Square, X } from 'lucide-react'

// A slim bar that appears just below the header on every authenticated page
// while a contraction is being timed (pregnancy mode). Mirrors GlobalTimerBar
// so stopping a contraction is always one tap away, even after navigating off
// the contraction page.
export default function ContractionTimerBar({ userId }: { userId: string }) {
  const timer = useContractionTimer(userId)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => { setDismissed(false) }, [timer.startMs])

  if (!timer.active || dismissed) return null

  const accent = '#B24592'

  async function handleStop() {
    const c = await timer.stop()
    if (!c) alert('לא הצלחנו לשמור את הציר. נסי שוב בעוד רגע — הטיימר עדיין פועל.')
  }

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 md:px-8 py-2 text-sm flex-shrink-0"
      style={{ background: 'rgba(178,69,146,0.12)', borderBottom: '1px solid rgba(178,69,146,0.3)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Activity className="w-4 h-4 flex-shrink-0" style={{ color: accent }} />
        <span className="font-medium truncate" style={{ color: 'var(--text)' }}>ציר פעיל</span>
        <span className="font-mono font-bold flex-shrink-0" style={{ color: accent }}>
          {timer.formatClock(timer.elapsed)}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleStop}
          disabled={timer.stopping}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: accent }}
        >
          <Square className="w-3 h-3" fill="white" /> {timer.stopping ? 'שומרת...' : 'סיום ציר'}
        </button>
        <button onClick={() => setDismissed(true)} title="סגירה" style={{ color: 'var(--text-muted)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
