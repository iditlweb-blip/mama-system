'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Menu, X } from 'lucide-react'

// Public marketing header: logo (right), centered nav, CTA (left) on desktop;
// collapses to a hamburger dropdown on mobile. Matches the Figma header.
export default function PublicHeader({ active }: { active?: 'blog' | 'community' }) {
  const [open, setOpen] = useState(false)

  const links: { href: string; label: string; key?: 'blog' | 'community' }[] = [
    { href: '/', label: 'עמוד בית' },
    { href: '/blog', label: 'בלוג', key: 'blog' },
    { href: '/community', label: 'קהילה', key: 'community' },
  ]

  const navLink = (l: { href: string; label: string; key?: 'blog' | 'community' }) => (
    <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
      style={{ fontSize: '1rem', fontWeight: 500, color: active === l.key ? '#7F5268' : '#6b5560', textDecoration: 'none', whiteSpace: 'nowrap' }}>
      {l.label}
    </Link>
  )

  const cta = (extra?: React.CSSProperties) => (
    <Link href="/auth" onClick={() => setOpen(false)}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#7F5268', color: '#fff', borderRadius: 999, padding: '10px 22px', fontSize: '0.92rem', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', ...extra }}>
      <ArrowLeft style={{ width: 17, height: 17 }} />
      תתחילי לנסות
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
            style={{ fontSize: '1.05rem', fontWeight: 500, color: active === l.key ? '#7F5268' : '#4a3a42', textDecoration: 'none', padding: '10px 0', textAlign: 'center' }}>
            {l.label}
          </Link>
        ))}
        {cta({ marginTop: 6, alignSelf: 'center' })}
      </div>
    </header>
  )
}
