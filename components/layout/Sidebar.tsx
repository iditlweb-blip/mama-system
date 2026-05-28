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

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'דשבורד' },
  { href: '/tasks',       icon: CheckSquare,     label: 'משימות' },
  { href: '/business',    icon: Briefcase,       label: 'ניהול עבודה' },
  { href: '/development', icon: Baby,            label: 'התפתחות' },
  { href: '/tracker',     icon: Activity,        label: 'מעקב תינוק' },
  { href: '/personal',    icon: Heart,           label: 'לעצמי' },
  { href: '/chat',        icon: MessageCircle,   label: "צ׳אט AI" },
  { href: '/settings',    icon: Settings,        label: 'הגדרות' },
]

export default function Sidebar({ userName }: { userName?: string | null }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const Content = () => (
    <div className="flex flex-col h-full py-6 px-4">
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
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={active
                ? { background: 'var(--purple)', color: '#fff', fontWeight: 600 }
                : { color: 'var(--text-muted)', fontWeight: 400 }
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
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
        className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: '#fff', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="w-5 h-5" style={{ color: 'var(--text)' }} />
               : <Menu className="w-5 h-5" style={{ color: 'var(--text)' }} />}
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-56 flex flex-col" style={{ background: '#fff' }}>
            <Content />
          </aside>
        </div>
      )}
    </>
  )
}
