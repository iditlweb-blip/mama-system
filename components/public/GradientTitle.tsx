// Big clipped-gradient page title, matching the "אמא בסדר" headline on the
// landing page (mauve fading to cream). Used as the opener on the public blog
// and community index pages.
export default function GradientTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: 'clamp(3rem,11vw,8rem)',
        lineHeight: 0.9,
        letterSpacing: '-0.01em',
        margin: '0 0 6px',
        // Same gradient + text clip as landing.html .headline
        background: 'linear-gradient(180deg,#7c4f64 0%,#956c81 36%,#f7ede2 85%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        width: 'fit-content',
      }}
    >
      {children}
    </h1>
  )
}
