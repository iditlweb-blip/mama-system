'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Baby, CheckSquare, Activity,
  MessageCircle, LogOut, Menu, X, Briefcase, Settings, Heart,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function ShoppingBagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  )
}

type NavItem = {
  href: string
  label: string
} & (
  | { icon: React.ComponentType<{ className?: string }>; customIcon?: never }
  | { customIcon: React.ReactNode; icon?: never }
)

function PregnancyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/><path d="M12 12c-4 0-7 3-7 6h14c0-3-3-6-7-6z"/>
      <path d="M12 16c1.5 0 3 1 3 2" opacity=".4"/>
    </svg>
  )
}

export default function Sidebar({ userName, trackingType }: {
  userName?: string | null
  trackingType?: 'pregnancy' | 'baby' | null
}) {
  const isPregnancy = trackingType === 'pregnancy'

  const navItems: NavItem[] = [
    { href: '/dashboard',             icon: LayoutDashboard,   label: 'דשבורד' },
    isPregnancy
      ? { href: '/pregnancy', customIcon: <PregnancyIcon />,   label: 'מעקב הריון' }
      : { href: '/tracker',           icon: Activity,          label: 'מעקב תינוק' },
    { href: '/tasks',                 icon: CheckSquare,       label: 'משימות' },
    { href: '/business',              icon: Briefcase,         label: 'ניהול עבודה' },
    { href: '/development',           icon: Baby,              label: 'התפתחות' },
    { href: '/products', customIcon: <ShoppingBagIcon />,      label: 'מוצרים ובעלי מקצוע' },
    { href: '/personal',              icon: Heart,             label: 'לעצמי' },
    { href: '/chat',                  icon: MessageCircle,     label: "צ׳אט AI" },
    { href: '/settings',              icon: Settings,          label: 'הגדרות' },
  ]
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const Content = () => (
    <div className="flex flex-col h-full pt-6 px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:pb-6">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <Image src="/logo.svg" alt="אמא בסדר" width={22} height={36} />
        <div>
          <p className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
            אמא בסדר
          </p>
          <p className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>
            {userName || 'ברוכה הבאה'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={active
                ? { background: 'var(--purple)', color: '#fff', fontWeight: 600 }
                : { color: 'var(--text-muted)', fontWeight: 400 }
              }
            >
              {item.icon
                ? <item.icon className="w-4 h-4 flex-shrink-0" />
                : <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">{item.customIcon}</span>
              }
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="my-3 mx-2 h-px" style={{ background: 'var(--border)' }} />

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full transition-all hover:opacity-70"
        style={{ color: 'var(--text-muted)', fontWeight: 400 }}
      >
        <LogOut className="w-4 h-4" />
        יציאה
      </button>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex flex-col w-56 border-l flex-shrink-0 h-screen sticky top-0"
        style={{ background: '#fff', borderColor: 'var(--border)' }}>
        <Content />
      </aside>

      <button
        className="md:hidden fixed top-4 right-4 z-[120] w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" style={{ color: 'var(--text)' }} />
               : <Menu className="w-5 h-5" style={{ color: 'var(--text)' }} />}
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-56 flex flex-col overflow-y-auto" style={{ background: '#fff' }}>
            <Content />
          </aside>
        </div>
      )}
    </>
  )
}
