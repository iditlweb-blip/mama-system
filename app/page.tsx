import Link from 'next/link'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import LandingEditor from '@/components/LandingEditor'
import PwaInstallTabs from '@/components/PwaInstallTabs'
import CounterUp from '@/components/CounterUp'

// ─── Arrow SVG component (for CTA buttons) ─────────────────────────────────
function BtnArrow() {
  return (
    <svg width="20" height="12" viewBox="0 0 36 21" fill="none" style={{ transform: 'scaleX(-1)', flexShrink: 0 }}>
      <path d="M12 0C12 1.113 10.9005 2.775 9.7875 4.17C8.3565 5.97 6.6465 7.5405 4.686 8.739C3.216 9.6375 1.434 10.5 0 10.5M0 10.5C1.434 10.5 3.2175 11.3625 4.686 12.261C6.6465 13.461 8.3565 15.0315 9.7875 16.8285C10.9005 18.225 12 19.89 12 21M0 10.5H36" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

// ─── Testimonial card style constants ─────────────────────────────────────
const cardWrap: CSSProperties = {
  flexShrink: 0,
  width: 290,
  marginRight: 20,
  background: '#fff',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 4px 24px rgba(127,82,104,0.10)',
  display: 'flex',
  flexDirection: 'column',
  direction: 'rtl',
}
const cardBody: CSSProperties = {
  padding: '22px 22px 16px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
}
const cardStars: CSSProperties = {
  color: '#F5A623',
  fontSize: '0.85rem',
  letterSpacing: 2,
  marginBottom: 10,
}
const cardQuote: CSSProperties = {
  fontSize: '0.875rem',
  lineHeight: 1.75,
  color: '#555',
  fontStyle: 'italic',
  fontWeight: 300,
  flex: 1,
  margin: 0,
}
const cardFooter: CSSProperties = {
  background: '#7F5268',
  padding: '12px 22px',
}
const cardName: CSSProperties  = { color: '#fff', fontWeight: 700, fontSize: '0.875rem', margin: 0 }
const cardRole: CSSProperties  = { color: 'rgba(255,255,255,0.65)', fontSize: '0.775rem', margin: '2px 0 0', fontWeight: 300 }

// ─── Feature card (section 2, 2×2 grid) ────────────────────────────────────
const featCard: CSSProperties = {
  background: '#fff',
  borderRadius: 18,
  padding: '24px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  boxShadow: '0 2px 16px rgba(127,82,104,0.07)',
  border: '1px solid rgba(127,82,104,0.10)',
  transition: 'transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease',
  cursor: 'default',
}

export default function LandingPage() {
  return (
    <main style={{ background: '#F7EDE2', fontFamily: 'var(--font-body)', overflowX: 'hidden', direction: 'rtl' }}>

      {/* ── Global styles for this page ── */}
      <style>{`
        /* ── Marquee animation (testimonials) ── */
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .testimonials-track {
          display: flex;
          width: max-content;
          direction: ltr;
          animation: marquee 44s linear infinite;
          will-change: transform;
        }
        .testimonials-track:hover { animation-play-state: paused; }

        /* ── Rotating circle ── */
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .spin-slow { animation: spin-slow 12s linear infinite; }

        /* ── Scroll-reveal (overrides globals) ── */
        .reveal-up {
          opacity: 0;
          transform: translateY(36px);
          animation: revealUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-timeline: view();
          animation-range: entry 0% entry 45%;
        }
        @keyframes revealUp {
          to { opacity:1; transform: translateY(0); }
        }
        .delay-1 { animation-delay: 0.07s; }
        .delay-2 { animation-delay: 0.14s; }
        .delay-3 { animation-delay: 0.21s; }

        /* ── Card hover lift ── */
        .feat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 40px rgba(127,82,104,0.14) !important;
        }
        .feat-card:hover .feat-icon-box {
          background: rgba(127,82,104,0.16) !important;
        }

        /* ── Scenario card hover ── */
        .scenario-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 16px 36px rgba(127,82,104,0.13) !important;
        }

        /* ── Photo mosaic hover ── */
        .photo-mosaic-img { transition: transform 0.3s ease; }
        .photo-mosaic-img:hover { transform: scale(1.03); }

        /* ── Mobile adjustments ── */
        @media (max-width: 768px) {
          .hero-row   { flex-direction: column-reverse !important; }
          .hero-photo { width: 100% !important; max-height: 380px !important; }
          .features-row { flex-direction: column !important; }
          .about-row  { flex-direction: column !important; }
          .about-photo-col { width: 100% !important; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#F7EDE2', minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Nav ── */}
        <nav style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 32px',
        }}>
          {/* Logo icon (RTL: first child = right side) */}
          <Image src="/icons/landing/logo-new.svg" alt="אמא בסדר" width={36} height={62} priority />

          {/* Nav buttons (RTL: second child = left side) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="#pwa-install" className="btn-brand btn-brand-outline" style={{ fontSize: '0.875rem', padding: '9px 22px' }}>
              הורדה לטלפון
            </a>
            <Link href="/auth" className="btn-brand" style={{ fontSize: '0.875rem', padding: '9px 22px' }}>
              התחילי עכשיו
              <BtnArrow />
            </Link>
          </div>
        </nav>

        {/* ── Hero body ── */}
        <div
          className="hero-row"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'clamp(20px,4vw,60px)',
            padding: 'clamp(20px,5vh,60px) clamp(20px,5vw,64px) clamp(30px,6vh,70px)',
          }}
        >
          {/* ── Left: text content (RTL → physically right side of screen) ── */}
          <div style={{ flex: '0 0 auto', maxWidth: 540, width: '100%' }}>

            {/* Brand tag line */}
            <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#7F5268', letterSpacing: '0.08em', marginBottom: 10, opacity: 0.75 }}>
              המערכת שמסדרת לך את החיים
            </p>

            {/* Hero heading */}
            <h1
              id="le-hero-h1"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: 'clamp(3.8rem, 10vw, 7.5rem)',
                color: '#7F5268',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                margin: '0 0 clamp(14px,2.5vh,24px)',
              }}
            >
              אמא בסדר
            </h1>

            {/* Sub text */}
            <p
              id="le-hero-sub"
              style={{
                fontSize: 'clamp(0.9rem, 1.6vw, 1.1rem)',
                color: '#5a3549',
                fontWeight: 300,
                lineHeight: 1.7,
                marginBottom: 'clamp(20px,3.5vh,36px)',
                maxWidth: 460,
              }}
            >
              בתוך כל הטירוף, העייפות וים העצות מסביב — אנחנו כאן כדי לעשות לך סדר.
              <br />מהבדיקה הראשונה ועד גיל שנה, כל מה שאת באמת צריכה לדעת במקום אחד.
            </p>

            {/* CTA */}
            <Link
              href="/auth"
              className="btn-brand"
              style={{ fontSize: '1rem', padding: '13px 32px', marginBottom: 'clamp(24px,4vh,40px)', display: 'inline-flex' }}
            >
              התחילי עכשיו — בחינם
              <BtnArrow />
            </Link>

            {/* 300+ Counter + avatars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatars */}
              <div style={{ display: 'flex', direction: 'ltr' }}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={n}
                    src={`/images/avatar-${n}.png`}
                    alt=""
                    width={34}
                    height={34}
                    style={{
                      width: 34, height: 34,
                      borderRadius: '50%',
                      border: '2px solid #F7EDE2',
                      objectFit: 'cover',
                      marginLeft: n === 1 ? 0 : -10,
                    }}
                  />
                ))}
              </div>
              {/* Counter text */}
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.2rem', color: '#111', margin: 0, lineHeight: 1.1 }}>
                  <CounterUp target={300} suffix="+" />
                </p>
                <p style={{ fontSize: '0.78rem', color: '#7F5268', margin: 0, fontWeight: 300 }}>
                  אמהות מרוצות
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: photo (RTL → physically left side of screen) ── */}
          <div
            className="hero-photo"
            style={{
              flex: '1 1 0',
              maxWidth: 480,
              minWidth: 200,
              alignSelf: 'flex-end',
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-mom-baby.png"
              alt="אמא ותינוק"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'contain',
                objectPosition: 'center bottom',
                filter: 'drop-shadow(0 16px 40px rgba(127,82,104,0.18))',
              }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — FEATURES GRID  (2×2 cards + photo mosaic)
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,64px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div
            className="features-row"
            style={{ display: 'flex', gap: 'clamp(28px,5vw,64px)', alignItems: 'center' }}
          >

            {/* ── Feature cards 2×2 (RTL: right side) ── */}
            <div style={{ flex: '0 0 auto', width: 'clamp(280px,46%,520px)' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#7F5268', letterSpacing: '0.08em', marginBottom: 10, opacity: 0.7 }}>
                מה יש לנו
              </p>
              <h2 className="reveal" style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 700, color: '#111', marginBottom: 28, lineHeight: 1.25 }}>
                כל מה שצריכה
                <br />במקום אחד
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {([
                  { icon: '/icons/landing/pregnancy.svg', iw: 38, ih: 38, label: 'מעקב הריון',   sub: 'שבועות, גדלים, בדיקות', labelId: 'le-feat-0-label', subId: 'le-feat-0-sub' },
                  { icon: '/icons/landing/baby.svg',       iw: 36, ih: 34, label: 'מעקב תינוק',   sub: 'האכלות, שינה, חיתולים', labelId: 'le-feat-1-label', subId: 'le-feat-1-sub' },
                  { icon: '/icons/landing/chat.svg',        iw: 34, ih: 34, label: 'AI בעברית',    sub: 'שאלות, ייעוץ, תמיכה',   labelId: 'le-feat-2-label', subId: 'le-feat-2-sub' },
                  { icon: '/icons/landing/task.svg',        iw: 28, ih: 28, label: 'ניהול יומי',   sub: 'משימות, תזכורות, סדר',  labelId: 'le-feat-3-label', subId: 'le-feat-3-sub' },
                ] as { icon: string; iw: number; ih: number; label: string; sub: string; labelId: string; subId: string }[]).map(({ icon, iw, ih, label, sub, labelId, subId }, i) => (
                  <div
                    key={label}
                    className={`feat-card reveal-up delay-${i}`}
                    style={featCard}
                  >
                    <div
                      className="feat-icon-box"
                      style={{
                        width: 52, height: 52,
                        borderRadius: 14,
                        background: 'rgba(127,82,104,0.09)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.18s ease',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={icon} alt="" width={iw} height={ih} style={{ width: iw, height: ih }} />
                    </div>
                    <div>
                      <p id={labelId} style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111', margin: '0 0 4px' }}>{label}</p>
                      <p id={subId} style={{ fontWeight: 300, fontSize: '0.82rem', color: '#7F5268', margin: 0 }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Photo mosaic with rotating circle (RTL: left side) ── */}
            <div style={{ flex: 1, position: 'relative', minHeight: 420 }}>
              {/* Background (woman with phone) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/woman-phone.png"
                alt=""
                className="photo-mosaic-img"
                style={{
                  width: '100%',
                  height: 'clamp(280px,36vw,440px)',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  borderRadius: 24,
                  display: 'block',
                }}
              />

              {/* Phone mockup (bottom-right of mosaic, RTL=bottom-left) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/phone-mockup.png"
                alt=""
                className="photo-mosaic-img"
                style={{
                  position: 'absolute',
                  bottom: -28,
                  left: 'clamp(-10px,-4%,-24px)',
                  width: 'clamp(110px,18%,155px)',
                  height: 'auto',
                  borderRadius: 18,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                }}
              />

              {/* Baby photo (top-right, overlapping) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/baby-playing.png"
                alt=""
                className="photo-mosaic-img"
                style={{
                  position: 'absolute',
                  top: -20,
                  right: 'clamp(-8px,-3%,-20px)',
                  width: 'clamp(100px,16%,140px)',
                  height: 'clamp(130px,20%,175px)',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  borderRadius: 18,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
                }}
              />

              {/* Rotating circle — decorative badge */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/landing/rotating-circle.svg"
                alt=""
                className="spin-slow"
                style={{
                  position: 'absolute',
                  bottom: 'clamp(30px,10%,70px)',
                  right: 'clamp(-10px,-3%,-24px)',
                  width: 88,
                  height: 88,
                  pointerEvents: 'none',
                }}
              />
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — WHY ("למה דווקא אמא בסדר?")
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#F7EDE2', padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,64px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2
            className="reveal"
            style={{ fontSize: 'clamp(1.7rem,3.8vw,2.5rem)', fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 'clamp(40px,6vw,64px)' }}
          >
            למה דווקא אמא בסדר?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
            {([
              {
                icon: '/icons/landing/chat.svg',         iw: 48, ih: 48,
                title: 'AI שמבין אמא בעברית',
                body:  'שאלות על הריון, עצות לתינוק, עזרה ביומן, תמיכה רגשית — 24/7, בלי שיפוטיות, בשפה שלנו.',
                titleId: 'le-why-2-title', bodyId: 'le-why-2-body',
              },
              {
                icon: '/icons/landing/all-in-one.svg',  iw: 52, ih: 52,
                title: 'הכל במקום אחד',
                body:  'הריון, תינוק, יומן ומשימות — בלי לקפוץ בין 5 אפליקציות. רואות הכל בבת אחת.',
                titleId: 'le-why-1-title', bodyId: 'le-why-1-body',
              },
              {
                icon: '/icons/landing/built-for-moms.svg', iw: 44, ih: 60,
                title: 'נבנה בשביל אמהות בלבד',
                body:  'לא אפליקציה כללית עם עוד פיצ\'ר לתינוק. כל מה שיש כאן — תוכנן עבור אמא שנמצאת בתחילת הדרך.',
                titleId: 'le-why-0-title', bodyId: 'le-why-0-body',
              },
            ] as { icon: string; iw: number; ih: number; title: string; body: string; titleId: string; bodyId: string }[]).map(({ icon, iw, ih, title, body, titleId, bodyId }, i) => (
              <div
                key={title}
                className={`reveal-up delay-${i} feat-card`}
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: '32px 26px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: '0 2px 20px rgba(127,82,104,0.07)',
                  border: '1px solid rgba(127,82,104,0.09)',
                  transition: 'transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease',
                  cursor: 'default',
                }}
              >
                <div
                  className="feat-icon-box"
                  style={{
                    width: 64, height: 64,
                    borderRadius: 18,
                    background: 'rgba(127,82,104,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.18s ease',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt="" width={iw} height={ih} style={{ width: iw, height: ih }} />
                </div>
                <h3 id={titleId} style={{ fontWeight: 700, fontSize: '1rem', color: '#111', margin: 0 }}>{title}</h3>
                <p id={bodyId} style={{ fontWeight: 300, fontSize: '0.88rem', lineHeight: 1.7, color: '#555', margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — DAILY SCENARIOS ("איך זה עוזר ביום יום?")
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,64px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2
            className="reveal"
            style={{ fontSize: 'clamp(1.7rem,3.8vw,2.5rem)', fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 'clamp(36px,5vw,56px)' }}
          >
            איך זה עוזר ביום יום?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 18 }}>
            {([
              {
                icon: '/icons/landing/week28.svg', iw: 44, ih: 44,
                title: 'שבוע 28 להריון',
                body: 'בדקי מה גודל התינוק השבוע, מה הבדיקות הקרובות שלך, ושאלי את ה-AI על כל מה שמדאיג אותך.',
                titleId: 'le-daily-0-title', bodyId: 'le-daily-0-body',
              },
              {
                icon: '/icons/landing/post-birth.svg', iw: 42, ih: 42,
                title: 'יום אחרי לידה',
                body: 'תבצעי רישומים של האכלות, שינה וחיתולים — וכל מה שאת צריכה כדי להיות רגועה.',
                titleId: 'le-daily-1-title', bodyId: 'le-daily-1-body',
              },
              {
                icon: '/icons/landing/nap.svg', iw: 44, ih: 44,
                title: 'נמנום קצר',
                body: 'לחצי Start, התינוק קם — לחצי Stop. הנמנום נרשם אוטומטית. את פנויה לנשום.',
                titleId: 'le-daily-2-title', bodyId: 'le-daily-2-body',
              },
              {
                icon: '/icons/landing/doubt.svg', iw: 42, ih: 42,
                title: 'רגע של ספק',
                body: 'שאלי את ה-AI: "האם זה נורמלי?", "כמה אמורה לאכול?", "מרגישה אבודה" — היא תקשיב.',
                titleId: 'le-daily-3-title', bodyId: 'le-daily-3-body',
              },
            ] as { icon: string; iw: number; ih: number; title: string; body: string; titleId: string; bodyId: string }[]).map(({ icon, iw, ih, title, body, titleId, bodyId }, i) => (
              <div
                key={title}
                className={`scenario-card reveal-up delay-${i % 2}`}
                style={{
                  background: '#F7EDE2',
                  borderRadius: 20,
                  padding: '28px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 2px 16px rgba(127,82,104,0.07)',
                  transition: 'transform 0.22s cubic-bezier(.34,1.56,.64,1), box-shadow 0.22s ease',
                  cursor: 'default',
                }}
              >
                <div style={{
                  width: 56, height: 56,
                  borderRadius: 16,
                  background: 'rgba(127,82,104,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt="" width={iw} height={ih} style={{ width: iw, height: iw }} />
                </div>
                <h3 id={titleId} style={{ fontWeight: 700, fontSize: '0.975rem', color: '#111', margin: 0 }}>{title}</h3>
                <p id={bodyId} style={{ fontWeight: 300, fontSize: '0.85rem', lineHeight: 1.7, color: '#5a3549', margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — ABOUT ("הסיפור שמאחורי המערכת")
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#F7EDE2', padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,64px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2
            className="reveal"
            style={{ fontSize: 'clamp(1.7rem,3.5vw,2.4rem)', fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 'clamp(36px,5vw,52px)' }}
          >
            הסיפור שמאחורי המערכת
          </h2>

          <div
            className="about-row"
            style={{ display: 'flex', gap: 'clamp(28px,5vw,64px)', alignItems: 'flex-start' }}
          >
            {/* Photo col (RTL: right side = first child) */}
            <div className="about-photo-col" style={{ flexShrink: 0, width: 'clamp(180px,22vw,240px)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/about-eidit.png"
                alt="עידית לאוב"
                style={{
                  width: '100%',
                  height: 'clamp(260px,30vw,380px)',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  borderRadius: '1.5rem',
                  display: 'block',
                }}
              />
            </div>

            {/* Text col */}
            <div style={{ flex: 1, minWidth: 260, position: 'relative', paddingTop: 8 }}>
              {/* Decorative opening quote */}
              <span aria-hidden="true" style={{
                position: 'absolute',
                top: -28, right: -16,
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(5rem,10vw,8.5rem)',
                color: '#C4748C', opacity: 0.22, lineHeight: 1,
                userSelect: 'none', pointerEvents: 'none',
              }}>&#8221;</span>

              <p style={{ fontSize: 'clamp(0.93rem,1.5vw,1.06rem)', lineHeight: 2, color: '#444', fontWeight: 300, marginBottom: '1rem', position: 'relative' }}>
                כשדור נולדה, הייתי אמא בפעם הראשונה — ורציתי לדעת מה נורמלי, רציתי לזכור מתי האכלתי, רציתי מישהי שתענה לי בשלוש בלילה בלי לשפוט. לא מצאתי מקום אחד שנותן את כל זה.
              </p>
              <p style={{ fontSize: 'clamp(1rem,1.6vw,1.12rem)', lineHeight: 1.9, color: '#111', fontWeight: 700, marginBottom: '1rem' }}>
                אז הקמתי אותו.
              </p>
              <p style={{ fontSize: 'clamp(0.93rem,1.5vw,1.06rem)', lineHeight: 2, color: '#444', fontWeight: 300, marginBottom: '2.5rem' }}>
                אמא בסדר נולדה מהצורך האמיתי של אמא טרייה: לא עוד אפליקציה, אלא כלי שמבין אותך — את ההריון שלך, את התינוק שלך, ואת הכאוס היפה הזה שנקרא ימים ראשונים.
              </p>

              {/* Signature */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 3, background: 'linear-gradient(90deg,#C4748C,#7F5268)', borderRadius: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: '#7F5268', margin: 0 }}>עידית לאוב</p>
                  <p style={{ color: '#999', fontSize: '0.83rem', fontWeight: 300, margin: '3px 0 0' }}>מייסדת אמא בסדר ואמא של דור אורי</p>
                </div>
              </div>

              {/* Decorative closing quote */}
              <span aria-hidden="true" style={{
                position: 'absolute',
                bottom: -24, left: -16,
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(5rem,10vw,8.5rem)',
                color: '#C4748C', opacity: 0.22, lineHeight: 1,
                userSelect: 'none', pointerEvents: 'none',
              }}>&#8220;</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6 — TESTIMONIALS ("מה אמהות אומרות")
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: 'clamp(60px,8vw,90px) 0' }}>
        <h2
          className="reveal"
          style={{ fontSize: 'clamp(1.7rem,3.8vw,2.5rem)', fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 'clamp(36px,5vw,52px)' }}
        >
          מה אמהות אומרות
        </h2>

        {/* Carousel — LTR wrapper so translateX(-50%) is predictable */}
        <div style={{ overflow: 'hidden', width: '100%', direction: 'ltr' }}>
          <div className="testimonials-track">

            {/* Set A — with IDs for editor */}
            {([
              { name: 'נועה כ.',   role: 'אמא טרייה',           quote: 'סוף סוף אני יודעת בכל רגע מה קורה עם התינוק שלי. זה נתן לי שקט אמיתי',  nId:'le-test-0-name', rId:'le-test-0-role', qId:'le-test-0-quote' },
              { name: 'שירלי מ.',  role: 'בהריון 32 שבועות',    quote: 'הפסקתי לשאול את גוגל בשלוש בלילה. עכשיו יש לי AI שמבין ולא שופט',        nId:'le-test-1-name', rId:'le-test-1-role', qId:'le-test-1-quote' },
              { name: 'גלית ה.',   role: 'אמא + עצמאית',         quote: 'ניהלתי הריון ועסק במקביל. בלי המערכת הזו הייתי קורסת',                   nId:'le-test-2-name', rId:'le-test-2-role', qId:'le-test-2-quote' },
              { name: 'יעל ב.',   role: 'אמא לתאומות',           quote: 'רישום האכלות לשתי תינוקות בלחיצה אחת. שינה לי את החיים ממש',             nId:'le-test-3-name', rId:'le-test-3-role', qId:'le-test-3-quote' },
              { name: 'מיכל ש.',  role: 'אחרי לידה ראשונה',     quote: 'הרגשתי שמישהי בנתה את זה בשבילי בדיוק. לא גנרי בכלל',                   nId:'le-test-4-name', rId:'le-test-4-role', qId:'le-test-4-quote' },
              { name: 'אורית ד.', role: '4 חודשים אחרי לידה',   quote: 'הדשבורד הבוקר הוא הדבר הראשון שאני פותחת. כל יום',                       nId:'le-test-5-name', rId:'le-test-5-role', qId:'le-test-5-quote' },
              { name: 'ריקי ל.',  role: 'שבועיים אחרי לידה',    quote: 'איזה כלי מטורף. הכל במקום אחד ובעברית. לא האמנתי שיש כזה דבר' },
              { name: 'דנה מ.',   role: 'בהריון 36 שבועות',     quote: 'מסדרת לי את הראש כל בוקר. כל הבדיקות, כל השאלות — הכל שם' },
            ] as Array<{ name: string; role: string; quote: string; nId?: string; rId?: string; qId?: string }>).map((t, i) => (
              <div key={`a-${i}`} style={cardWrap}>
                <div style={cardBody}>
                  <div style={cardStars}>★★★★★</div>
                  <p id={t.qId} style={cardQuote}>&ldquo;{t.quote}&rdquo;</p>
                </div>
                <div style={cardFooter}>
                  <p id={t.nId} style={cardName}>{t.name}</p>
                  <p id={t.rId} style={cardRole}>{t.role}</p>
                </div>
              </div>
            ))}

            {/* Set B — duplicated for seamless loop */}
            {([
              { name: 'נועה כ.',   role: 'אמא טרייה',           quote: 'סוף סוף אני יודעת בכל רגע מה קורה עם התינוק שלי. זה נתן לי שקט אמיתי' },
              { name: 'שירלי מ.',  role: 'בהריון 32 שבועות',    quote: 'הפסקתי לשאול את גוגל בשלוש בלילה. עכשיו יש לי AI שמבין ולא שופט' },
              { name: 'גלית ה.',   role: 'אמא + עצמאית',         quote: 'ניהלתי הריון ועסק במקביל. בלי המערכת הזו הייתי קורסת' },
              { name: 'יעל ב.',   role: 'אמא לתאומות',           quote: 'רישום האכלות לשתי תינוקות בלחיצה אחת. שינה לי את החיים ממש' },
              { name: 'מיכל ש.',  role: 'אחרי לידה ראשונה',     quote: 'הרגשתי שמישהי בנתה את זה בשבילי בדיוק. לא גנרי בכלל' },
              { name: 'אורית ד.', role: '4 חודשים אחרי לידה',   quote: 'הדשבורד הבוקר הוא הדבר הראשון שאני פותחת. כל יום' },
              { name: 'ריקי ל.',  role: 'שבועיים אחרי לידה',    quote: 'איזה כלי מטורף. הכל במקום אחד ובעברית. לא האמנתי שיש כזה דבר' },
              { name: 'דנה מ.',   role: 'בהריון 36 שבועות',     quote: 'מסדרת לי את הראש כל בוקר. כל הבדיקות, כל השאלות — הכל שם' },
            ]).map((t, i) => (
              <div key={`b-${i}`} style={cardWrap}>
                <div style={cardBody}>
                  <div style={cardStars}>★★★★★</div>
                  <p style={cardQuote}>&ldquo;{t.quote}&rdquo;</p>
                </div>
                <div style={cardFooter}>
                  <p style={cardName}>{t.name}</p>
                  <p style={cardRole}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
          {[0,1,2].map(i => (
            <span
              key={i}
              style={{
                width: i === 0 ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === 0 ? '#7F5268' : 'rgba(127,82,104,0.25)',
                display: 'block',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 7 — CTA FOOTER ("שנתחיל?")
      ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: '#2c1e27',
          padding: 'clamp(64px,9vw,100px) clamp(20px,5vw,64px)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2
            id="le-cta-heading"
            className="reveal"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(2rem,5vw,3.2rem)',
              fontWeight: 700,
              color: '#F7EDE2',
              lineHeight: 1.2,
              marginBottom: 16,
            }}
          >
            שנתחיל? למה את מחכה!
          </h2>
          <p
            id="le-cta-sub"
            style={{
              fontSize: 'clamp(0.9rem,1.6vw,1.05rem)',
              color: 'rgba(247,237,226,0.7)',
              fontWeight: 300,
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            הצטרפי לאמהות שכבר לא מנסות להסתדר לבד
          </p>
          <Link
            href="/auth"
            className="btn-brand"
            style={{
              background: '#7F5268',
              fontSize: '1rem',
              padding: '14px 40px',
              display: 'inline-flex',
            }}
          >
            הרשמה חינם
            <BtnArrow />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PWA INSTALL
      ═══════════════════════════════════════════════════════════ */}
      <div id="pwa-install">
        <PwaInstallTabs />
      </div>

      {/* ── Floating landing editor (activated via ?editor in URL) ── */}
      <LandingEditor />

    </main>
  )
}
