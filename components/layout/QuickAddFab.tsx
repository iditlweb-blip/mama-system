'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { LogType } from '@/types/database'
import { TRACKER_ICONS } from '@/app/(app)/tracker/trackerIcons'

// Lazy - the add/edit form (and its Supabase client) has no reason to load
// on every page when the fan is closed, which is the vast majority of the
// time it's mounted.
const AddLogModal = dynamic(() => import('@/app/(app)/tracker/AddLogModal'), { ssr: false })

const MAIN_BG = '#F7EDE2'
const MAIN_RING = 'rgba(127,82,104,0.5)'
const PLUS_COLOR = '#7F5268'

const MINI_SIZE = 48

// Each mini button's offset from the main button's own centre once open, its
// own icon size, and its colours - lifted from the Figma fan-out layout
// (four circles at slightly different radii/heights around the trigger, not
// a plain arc).
const MINIS: { type: LogType; dx: number; dy: number; iconSize: number }[] = [
  { type: 'feed',     dx: -37, dy: -47, iconSize: 24 },
  { type: 'diaper',   dx: 33,  dy: -47, iconSize: 28 },
  { type: 'sleep',    dx: -65, dy: 9,   iconSize: 30 },
  { type: 'activity', dx: 63,  dy: 10,  iconSize: 27 },
]

// Global floating "+" button on every page - replaces the old per-page
// "quick add" grid that used to live inside the tracker screen (that grid
// showed on desktop too, so this has to as well or desktop loses quick-add
// entirely). On mobile it sits above the bottom nav's tracker slot (see
// BottomNav.tsx for why 70% is that tab's centre); on desktop, where the
// bottom nav doesn't exist, it becomes an ordinary bottom-left corner FAB
// (left, not right, so it never sits under the sidebar - see AppShell.tsx).
// Tap to fan out 4 colour-coded add buttons; tap one to jump straight into
// AddLogModal for that log type; tap the trigger again (or the backdrop) to
// collapse.
export default function QuickAddFab({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [activeType, setActiveType] = useState<LogType | null>(null)

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 104 }}
        />
      )}

      {/* Above BottomNav (z-index 100) but below the hamburger menu drawer
          (Sidebar.tsx: button z-[120], open drawer z-[110]) - otherwise the
          FAB floats over the mobile nav menu while it's open. */}
      <div className="quick-add-fab" style={{ position: 'fixed', zIndex: 105 }}>
        {MINIS.map(({ type, dx, dy, iconSize }, i) => {
          const { Icon, color, tint, label } = TRACKER_ICONS[type]
          const half = MINI_SIZE / 2
          return (
            <button
              key={type}
              aria-label={`הוספת ${label}`}
              onClick={() => { setActiveType(type); setOpen(false) }}
              className="quick-add-mini"
              style={{
                position: 'absolute',
                left: 21, top: 21,
                width: MINI_SIZE, height: MINI_SIZE,
                borderRadius: '50%',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                background: `linear-gradient(0deg, ${tint}, ${tint}), #fff`,
                border: 'none',
                transform: open
                  ? `translate(${dx - half}px, ${dy - half}px) scale(1)`
                  : `translate(${-half}px, ${-half}px) scale(0)`,
                opacity: open ? 1 : 0,
                transitionProperty: 'transform, opacity',
                transitionDuration: '0.32s',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                transitionDelay: open ? `${i * 0.035}s` : '0s',
                pointerEvents: open ? 'auto' : 'none',
              }}
            >
              <Icon size={iconSize} />
              <span style={{ fontSize: 7.5, fontWeight: 300, color, whiteSpace: 'nowrap' }}>+ {label}</span>
            </button>
          )
        })}

        <button
          aria-label={open ? 'סגירת הוספה מהירה' : 'הוספה מהירה'}
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          style={{
            position: 'relative',
            width: open ? 47 : 42, height: open ? 47 : 42,
            borderRadius: '50%',
            background: MAIN_BG,
            border: `1px solid ${MAIN_RING}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            transition: 'width 0.28s ease, height 0.28s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
            style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.28s ease' }}>
            <path d="M9 2.5V15.5M2.5 9H15.5" stroke={PLUS_COLOR} strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {activeType && (
        <AddLogModal
          userId={userId}
          initialType={activeType}
          onClose={() => setActiveType(null)}
        />
      )}

      <style>{`
        .quick-add-fab {
          left: calc(70% - 21px);
          bottom: calc(65px + env(safe-area-inset-bottom));
        }
        @media (min-width: 768px) {
          .quick-add-fab { left: 32px; bottom: 32px; }
        }
      `}</style>
    </>
  )
}
