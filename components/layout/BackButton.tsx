'use client'
import { useRouter } from 'next/navigation'

export default function BackButton({ href, label = 'חזרה' }: { href?: string; label?: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => href ? router.push(href) : router.back()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#7F5268',
        fontSize: '0.9rem',
        fontWeight: 500,
        padding: '6px 0',
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.03em',
      }}
    >
      {/* RTL: arrow pointing right = going back */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
      {label}
    </button>
  )
}
