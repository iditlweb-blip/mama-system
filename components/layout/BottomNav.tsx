'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Mobile-only fixed bottom navigation, 4 items
// Props: trackingType - determines whether "מעקב" goes to /tracker or /pregnancy

export default function BottomNav({ trackingType }: { trackingType: 'pregnancy' | 'baby' }) {
  const pathname = usePathname()

  const trackHref = trackingType === 'pregnancy' ? '/pregnancy' : '/tracker'
  const trackLabel = trackingType === 'pregnancy' ? 'הריון' : 'מעקב'

  const items = [
    {
      href: '/products',
      label: 'מוצרים',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
      ),
    },
    {
      href: trackHref,
      label: trackLabel,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
      ),
    },
    {
      href: '/dashboard',
      label: 'בית',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      href: '/chat',
      label: 'צ׳אט AI',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* spacer so content isn't hidden behind the nav on mobile */}
      <div className="bottom-nav-spacer" />
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: '#fff',
          borderTop: '1px solid rgba(127,82,104,0.15)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'stretch',
          height: 64,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        className="bottom-nav"
      >
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                flex: 1,
                color: isActive ? '#7F5268' : '#999',
                textDecoration: 'none',
                fontSize: '0.65rem',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.03em',
                transition: 'color 0.15s',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <style>{`
        @media (min-width: 768px) {
          .bottom-nav { display: none !important; }
          .bottom-nav-spacer { display: none !important; }
        }
        .bottom-nav-spacer { height: 64px; }
      `}</style>
    </>
  )
}
