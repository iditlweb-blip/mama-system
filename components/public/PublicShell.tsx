import Link from 'next/link'
import PublicHeader from './PublicHeader'

// Shared chrome for the PUBLIC content sections (blog + community). These pages
// live outside the (app) route group, so they don't get the logged-in sidebar/
// topbar - this gives them a light marketing-style header + footer instead.
export default function PublicShell({
  children,
  active,
}: {
  children: React.ReactNode
  active?: 'blog' | 'community'
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', direction: 'rtl', background: '#F7EDE2' }}>
      <PublicHeader active={active} />

      <main style={{ flex: 1, width: '100%', maxWidth: 1920, margin: '0 auto', padding: 'clamp(20px,4vw,44px) clamp(18px,4vw,75px)' }}>
        {children}
      </main>

      <footer style={{ borderTop: '1px solid rgba(127,82,104,0.15)', padding: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          <Link href="/blog" style={{ fontSize: '0.82rem', color: '#7F5268', textDecoration: 'none' }}>בלוג</Link>
          <Link href="/community" style={{ fontSize: '0.82rem', color: '#7F5268', textDecoration: 'none' }}>קהילה</Link>
          <Link href="/legal/privacy" style={{ fontSize: '0.82rem', color: '#7F5268', textDecoration: 'none' }}>פרטיות</Link>
          <Link href="/legal/terms" style={{ fontSize: '0.82rem', color: '#7F5268', textDecoration: 'none' }}>תנאי שימוש</Link>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#9a8790', margin: 0 }}>
          כל הזכויות שמורות לעידית לאוב · אמא בסדר
        </p>
      </footer>
    </div>
  )
}
