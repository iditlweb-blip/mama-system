'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import BrandArrow from './BrandArrow'

// Public marketing header: logo (right), centered nav, CTA (left) on desktop;
// collapses to a hamburger dropdown on mobile. Matches the Figma header.
export default function PublicHeader({ active }: { active?: 'blog' | 'community' }) {
  const [open, setOpen] = useState(false)

  const links: { href: string; label: string; key?: 'blog' | 'community' }[] = [
    { href: '/', label: 'עמוד בית' },
    { href: '/blog', label: 'בלוג', key: 'blog' },
    { href: '/community', label: 'קהילה', key: 'community' },
  ]

  // Thin (300) mauve nav links, identical to the landing header (.navlink).
  const navLink = (l: { href: string; label: string; key?: 'blog' | 'community' }) => (
    <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
      style={{ fontSize: '1.02rem', fontWeight: 300, color: '#7F5268', opacity: active === l.key ? 1 : 0.85, textDecoration: 'none', whiteSpace: 'nowrap' }}>
      {l.label}
    </Link>
  )

  // Same button as the landing header (.btn--solid): mauve pill, cream text,
  // thin weight, the hand-drawn arrow on the LEFT (direction:ltr = icon first).
  const cta = (extra?: React.CSSProperties) => (
    <Link href="/auth" onClick={() => setOpen(false)}
      style={{ direction: 'ltr', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#7F5268', color: '#F7EDE2', border: '1px solid #7F5268', borderRadius: 999, padding: '10px 24px', fontSize: '0.98rem', fontWeight: 300, textDecoration: 'none', whiteSpace: 'nowrap', ...extra }}>
      <BrandArrow size={26} />
      <span>תתחילי לנסות</span>
    </Link>
  )

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(247,237,226,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(127,82,104,0.12)' }}>
      <div className="public-header-inner">
        {/* Logo - right edge (RTL) */}
        <Link href="/" aria-label="אמא בסדר" style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="אמא בסדר" height={52} style={{ height: 52, width: 'auto' }} />
        </Link>

        <nav className="public-nav-desktop">
          {links.map(navLink)}
        </nav>

        <div className="public-cta-desktop">{cta()}</div>

        <button className="public-hamburger" aria-label="תפריט" onClick={() => setOpen(v => !v)}
          style={{ background: 'transparent', border: 'none', color: '#7F5268', cursor: 'pointer', padding: 6 }}>
          {open ? <X style={{ width: 26, height: 26 }} /> : <Menu style={{ width: 26, height: 26 }} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <div className={`public-mobile-menu${open ? ' open' : ''}`}>
        {links.map(l => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
            style={{ fontSize: '1.08rem', fontWeight: 300, color: '#7F5268', opacity: active === l.key ? 1 : 0.85, textDecoration: 'none', padding: '10px 0', textAlign: 'center' }}>
            {l.label}
          </Link>
        ))}
        {cta({ marginTop: 6, alignSelf: 'center' })}
      </div>
    </header>
  )
}
