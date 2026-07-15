'use client'

import { useState } from 'react'
import { Tag, Copy, Check } from 'lucide-react'

export default function CopyableCoupon({ code, size = 'sm' }: { code: string; size?: 'sm' | 'lg' }) {
  const [copied, setCopied] = useState(false)

  async function copy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      // Fallback for older browsers / non-secure contexts
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { /* ignore */ }
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const lg = size === 'lg'
  return (
    <button
      type="button"
      onClick={copy}
      title="העתקת קוד קופון"
      style={{
        background: 'rgba(127,82,104,0.07)',
        border: '1.5px dashed #7F5268',
        borderRadius: lg ? 10 : 8,
        padding: lg ? '10px 16px' : '7px 12px',
        fontSize: lg ? '0.9rem' : '0.8rem',
        color: '#7F5268',
        fontWeight: 700,
        letterSpacing: '0.06em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        width: '100%',
        cursor: 'pointer',
        fontFamily: 'inherit',
        direction: 'rtl',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Tag size={lg ? 16 : 14} /> קוד קופון: {code}
      </span>
      {copied
        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4A7C59' }}><Check size={lg ? 16 : 14} /> הועתק</span>
        : <Copy size={lg ? 16 : 14} style={{ opacity: 0.7 }} />}
    </button>
  )
}
