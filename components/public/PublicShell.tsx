import Link from 'next/link'

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
  const navLink = (href: string, label: string, key: 'blog' | 'community') => (
    <Link
      href={href}
      style={{
        fontSize: '0.95rem',
        fontWeight: active === key ? 700 : 500,
        color: active === key ? '#7F5268' : '#6b5560',
        textDecoration: 'none',
        padding: '6px 4px',
        borderBottom: active === key ? '2px solid #7F5268' : '2px solid transparent',
      }}
    >
      {label}
    </Link>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)', direction: 'rtl', background: '#F7EDE2' }}>
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(247,237,226,0.92)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(127,82,104,0.15)',
        }}
      >
        <div style={{ maxWidth: 920, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="אמא בסדר" width={30} height={30} style={{ borderRadius: 8 }} />
            <span style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.15rem', fontWeight: 700, color: '#7F5268', letterSpacing: '0.01em' }}>
              אמא בסדר
            </span>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {navLink('/blog', 'בלוג', 'blog')}
            {navLink('/community', 'קהילה', 'community')}
            <Link
              href="/auth"
              style={{
                background: '#7F5268', color: '#fff', borderRadius: 20,
                padding: '7px 16px', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none',
              }}
            >
              כניסה לאפליקציה
            </Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, width: '100%', maxWidth: 920, margin: '0 auto', padding: 'clamp(20px,4vw,44px) 20px' }}>
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
