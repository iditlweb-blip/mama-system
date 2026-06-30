import Link from 'next/link'
import type { CSSProperties } from 'react'
import LandingEditor from '@/components/LandingEditor'
import PwaInstallTabs from '@/components/PwaInstallTabs'
import CounterUp from '@/components/CounterUp'
import MockupScrollSection from '@/components/MockupScrollSection'
import HowItWorksSection from '@/components/HowItWorksSection'

// ─── Arrow SVG — natural direction points LEFT ← (correct for Hebrew RTL) ──
function Arrow({ size = 21, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={Math.round(size * 21 / 36)} viewBox="0 0 36 21" fill="none"
      style={{ flexShrink: 0 }}>
      <path d="M12 0C12 1.113 10.9005 2.775 9.7875 4.17C8.3565 5.97 6.6465 7.5405 4.686 8.739C3.216 9.6375 1.434 10.5 0 10.5M0 10.5C1.434 10.5 3.2175 11.3625 4.686 12.261C6.6465 13.461 8.3565 15.0315 9.7875 16.8285C10.9005 18.225 12 19.89 12 21M0 10.5H36"
        stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

// ─── Btn styles ─────────────────────────────────────────────────────────────
const btnFilled: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 12,
  background: '#7F5268', color: '#fff',
  fontFamily: 'var(--font-body)', fontWeight: 300,
  fontSize: 'clamp(1rem, 1.042vw, 1.25rem)', letterSpacing: '0.05em',
  padding: '10px 30px', minHeight: 60,
  borderRadius: 30, border: 'none', cursor: 'pointer',
  textDecoration: 'none', whiteSpace: 'nowrap',
  transition: 'opacity 0.2s',
}
const btnOutline: CSSProperties = {
  ...btnFilled,
  background: 'transparent', color: '#7F5268',
  border: '1.5px solid #7F5268',
}

export default function LandingPage() {
  return (
    <main dir="rtl" style={{ fontFamily: 'var(--font-body)', overflowX: 'hidden', background: '#F7EDE2' }}>

      {/* ── Global keyframes & helpers ── */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .spin-slow { animation: spin-slow 12s linear infinite; }

        @keyframes revealUp {
          from { opacity:0; transform:translateY(32px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .reveal-up {
          opacity:0;
          animation: revealUp 0.65s cubic-bezier(0.16,1,0.3,1) forwards;
          animation-timeline: view();
          animation-range: entry 0% entry 40%;
        }
        .delay-1 { animation-delay: 0.08s; }
        .delay-2 { animation-delay: 0.16s; }
        .delay-3 { animation-delay: 0.24s; }

        .feat-card:hover { transform: translateY(-5px) !important; }
        .scenario-card:hover { transform: translateY(-5px) !important; }
        .btn-hover:hover { opacity: 0.88; }

        @media (max-width: 900px) {
          .feat-section-inner { flex-direction: column !important; }
          .why-grid { grid-template-columns: 1fr !important; }
          .daily-grid { grid-template-columns: 1fr !important; }
          .testimonials-grid { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
          .about-inner { flex-direction: column !important; align-items: center !important; }
        }
        @media (max-width: 600px) {
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════
          §1 HERO  (matches Figma Desktop-4, 1920×1003)
      ══════════════════════════════════════════════════════ */}
      <section style={{
        background: '#F7EDE2',
        position: 'relative',
        width: '100%',
        minHeight: '100svh',
        overflow: 'hidden',
      }}>

        {/* ── Nav ── */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px clamp(24px,4vw,80px)',
          position: 'relative', zIndex: 10,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/landing/logo-new.svg" alt="אמא בסדר" width={44} height={76} style={{ width: 44, height: 'auto' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/auth" className="btn-hover" style={btnFilled}>
              תתחילי לנסות
              <Arrow />
            </Link>
            <a href="#pwa-install" className="btn-hover" style={btnOutline}>
              הורדה לטלפון
              <Arrow color="#7F5268" />
            </a>
          </div>
        </nav>

        {/* ── Hero canvas (everything below nav) ── */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100svh - 92px)',   /* full screen minus nav */
          minHeight: 640,
        }}>

          {/* ── Toys background image — physical LEFT, 20% opacity (Figma: 0 to ~820px of 1920) ── */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/toys-left.png"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0, top: 0,
              width: '52%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'right top',
              opacity: 0.10,
              zIndex: 0,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />

          {/* ── Big "אמא בסדר" title — centered, y≈17% from top of hero body ── */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id="le-hero-h1"
            src="/icons/landing/hero-title.svg"
            alt="אמא בסדר"
            style={{
              position: 'absolute',
              top: '14%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'clamp(280px, 81.875vw, 1572px)',
              height: 'auto',
              zIndex: 1,
              pointerEvents: 'none',
              userSelect: 'none',
              display: 'block',
            }}
          />

          {/* ── Center photo — sits on top of title, Figma: x=585, y=316 in 1920×1003 ── */}
          <div style={{
            position: 'absolute',
            /* Figma center-x = (585+346)/1920 = 48.5% → ≈ center */
            left: '50%',
            transform: 'translateX(-50%)',
            /* Figma top = 316/1003 = 31.5% of hero body */
            top: '28%',
            /* Figma width = 693/1920 = 36% of viewport */
            width: 'clamp(260px, 36vw, 693px)',
            /* Figma height = 742; keep aspect */
            height: 'clamp(320px, 44vw, 742px)',
            zIndex: 2,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero-mom-baby.png"
              alt="אמא ותינוק"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                display: 'block',
              }}
            />
          </div>

          {/* ── Stats block — physical LEFT, Figma x=190, y=729 (≈9.9% L, 72.7% T) ── */}
          <div style={{
            position: 'absolute',
            left: 'clamp(16px, 9.9vw, 190px)',
            top: '68%',
            zIndex: 3,
          }}>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: 'clamp(2rem, 2.604vw, 3.125rem)',
              color: '#7F5268',
              margin: 0,
              lineHeight: 1,
            }}>
              <CounterUp target={300} suffix="+" />
            </p>
            <p style={{
              fontSize: 'clamp(1rem, 1.042vw, 1.25rem)',
              letterSpacing: '0.05em',
              color: '#7F5268',
              fontWeight: 300,
              margin: '4px 0 14px',
              lineHeight: 1.4,
            }}>
              הורדות לטלפון של<br />אימהות מרוצות
            </p>
            <div style={{ display: 'flex', direction: 'ltr', gap: 0 }}>
              {[1,2,3,4,5,6,7,8].map(n => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img key={n} src={`/images/avatar-${n}.png`} alt=""
                  style={{
                    width: 38, height: 38,
                    borderRadius: '50%',
                    border: '2.5px solid #F7EDE2',
                    objectFit: 'cover',
                    marginLeft: n === 1 ? 0 : -10,
                    boxSizing: 'border-box',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Subtitle — physical RIGHT, Figma x=1213 (63.2% from L = 36.8% from R), y=476 (47.5% T) ── */}
          <div style={{
            position: 'absolute',
            right: 'clamp(16px, 10.833vw, 208px)',
            top: '44%',
            zIndex: 3,
            maxWidth: 'clamp(220px, 26vw, 499px)',
            textAlign: 'right',
          }}>
            <p
              id="le-hero-sub"
              style={{
                fontSize: 'clamp(1.0625rem, 1.302vw, 1.5625rem)',
                letterSpacing: '0.05em',
                color: '#7F5268',
                fontWeight: 300,
                lineHeight: 1.78,
                margin: 0,
              }}
            >
              בתוך כל הטירוף, העייפות וים העצות מסביב — אנחנו כאן כדי לעשות לך סדר.
              מהבדיקה הראשונה ועד גיל שנה, כל מה שאת באמת צריכה לדעת במקום אחד.
            </p>
          </div>

          {/* ── CTA — physical RIGHT, Figma x=1476 (76.9% from L = 23.1% from R), y=815 (81.3% T) ── */}
          <div style={{
            position: 'absolute',
            right: 'clamp(16px, 10.833vw, 208px)',
            top: '78%',
            zIndex: 3,
          }}>
            <Link href="/auth" className="btn-hover" style={{ ...btnFilled }}>
              כניסה למערכת
              <Arrow />
            </Link>
            <p style={{ marginTop: 10, fontSize: '0.78rem', color: '#7F5268', fontWeight: 300, textAlign: 'right' }}>
              עדין אין לך חשבון?{' '}
              <Link href="/auth" style={{ color: '#7F5268', fontWeight: 500, textDecoration: 'underline' }}>
                הירשמי עכשיו
              </Link>
            </p>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §2 FEATURES  (4 cards + photo collage)
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: '#F7EDE2', padding: 'clamp(50px,6vh,90px) clamp(24px,4vw,80px)' }}>
        <div
          className="feat-section-inner"
          style={{ display: 'flex', gap: 'clamp(28px, 7.552vw, 145px)', alignItems: 'center', maxWidth: 1760, margin: '0 auto' }}
        >

          {/* ── Photo collage — first child → visual RIGHT in RTL ── */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            gap: 22,
            height: 'clamp(380px, 50vw, 635px)',
            minWidth: 260,
            position: 'relative',
          }}>
            {/* Left narrow column: 2 stacked portrait images */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              width: 206,
              flexShrink: 0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/img27.png"
                alt=""
                style={{
                  flex: 1,
                  width: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  borderRadius: 18,
                  display: 'block',
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/img26.png"
                alt=""
                style={{
                  flex: 1,
                  width: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  borderRadius: 18,
                  display: 'block',
                }}
              />
            </div>

            {/* Right wide column: one large main photo */}
            <div style={{ flex: 1, position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/img25.png"
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  borderRadius: 24,
                  display: 'block',
                }}
              />
              {/* Rotating circle badge — overlaps the gap between columns */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icons/landing/rotating-circle.svg"
                alt=""
                className="spin-slow"
                style={{
                  position: 'absolute',
                  left: 'calc(-1 * clamp(44px, 4vw, 56px))',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 'clamp(80px, 8vw, 104px)',
                  height: 'clamp(80px, 8vw, 104px)',
                  zIndex: 2,
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* ── 2×2 Feature cards — second child → visual LEFT in RTL ── */}
          <div style={{ flex: '0 0 auto', width: 'clamp(280px, 42.5%, 748px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '35px 38px' }}>
              {([
                { icon: '/icons/landing/chat.svg',      iw: 90, label: 'מעקב תינוק בכל שלב',   sub: 'כולל מידע התפתחותי',        id: 0 },
                { icon: '/icons/landing/task.svg',      iw: 70, label: 'ניהול יומי',            sub: 'משימות ותזכורות',            id: 1 },
                { icon: '/icons/landing/baby.svg',      iw: 80, label: 'שיטת מעקב תינוק',       sub: 'כולל מידע התפתחותי',        id: 2 },
                { icon: '/icons/landing/pregnancy.svg', iw: 76, label: 'מעקב הריון',            sub: 'גודל התינוק, בדיקות ועוד',  id: 3 },
              ] as {icon:string;iw:number;label:string;sub:string;id:number}[]).map(({ icon, iw, label, sub, id }, i) => (
                <div
                  key={label}
                  className={`feat-card reveal-up delay-${i}`}
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: 30,
                    padding: '50px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'center',
                    height: 300,
                    minHeight: 300,
                    backdropFilter: 'blur(4px)',
                    transition: 'transform 0.22s cubic-bezier(.34,1.56,.64,1)',
                    cursor: 'default',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt="" style={{ width: iw, height: iw, objectFit: 'contain', marginBottom: 16, flexShrink: 0 }} />
                  <p id={`le-feat-${id}-label`}
                    style={{ fontWeight: 500, fontSize: 'clamp(1rem, 1.042vw, 1.25rem)', letterSpacing: '0.05em', color: '#000000', margin: 0, lineHeight: 1.45 }}>
                    {label}
                  </p>
                  <p id={`le-feat-${id}-sub`}
                    style={{ fontWeight: 300, fontSize: 'clamp(0.72rem,0.95vw,0.84rem)', color: '#7F5268', margin: '4px 0 0' }}>
                    {sub}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §2.5 MOCKUP SCROLL  (phone zoom + annotations)
      ══════════════════════════════════════════════════════ */}
      <MockupScrollSection />

      {/* ══════════════════════════════════════════════════════
          §2.7 HOW IT WORKS  ("איך זה עובד?")
      ══════════════════════════════════════════════════════ */}
      <HowItWorksSection />

      {/* ══════════════════════════════════════════════════════
          §3 WHY  ("למה דווקא אמא בסדר?")
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: 'clamp(50px,7vh,90px) clamp(24px,4vw,80px)' }}>
        <div style={{ maxWidth: 1760, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(2rem, 2.604vw, 3.125rem)',
              letterSpacing: '0.05em',
              fontWeight: 500,
              color: '#7F5268',
              textAlign: 'center',
              margin: '0 0 clamp(40px,5vh,60px)',
            }}
          >
            למה דווקא אמא בסדר?
          </h2>

          <div
            className="why-grid reveal-up"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'clamp(20px,3vw,56px)' }}
          >
            {/* RTL grid: first item → visual RIGHT, last → visual LEFT */}
            {([
              {
                icon: '/icons/landing/built-for-moms.svg', iw: 72,
                title: 'נבנה בשביל אמהות בלבד',
                body: "לא אפליקציה כללית עם עוד פיצ'ר לתינוק. כל מה שיש כאן — תוכנן עבור אמא שנמצאת בתחילת הדרך, הריון ואחריה.",
                ti: 'le-why-2-title', bi: 'le-why-2-body',
              },
              {
                icon: '/icons/landing/all-in-one.svg', iw: 100,
                title: 'הכל במקום אחד',
                body: 'הריון, תינוק, יומן ומשימות — בלי לקפוץ בין 5 אפליקציות. רואים הכל בבת אחת, מנהלים בבת אחת.',
                ti: 'le-why-1-title', bi: 'le-why-1-body',
              },
              {
                icon: '/icons/landing/chat.svg', iw: 100,
                title: 'AI שמבין אמא בעברית',
                body: 'שאלות על הריון, עצות לתינוק, עזרה ביומן, תמיכה רגשית — 24/7, בלי שיפוטיות, בשפה שלנו.',
                ti: 'le-why-0-title', bi: 'le-why-0-body',
              },
            ] as {icon:string;iw:number;title:string;body:string;ti:string;bi:string}[]).map(({ icon, iw, title, body, ti, bi }, i) => (
              <div key={title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                {/* Icon — right aligned */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon} alt="" width={iw} height={iw} style={{ width: iw, height: iw, objectFit: 'contain' }} />
                </div>
                <h3
                  id={ti}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    fontSize: 'clamp(1.25rem, 1.5625vw, 1.875rem)',
                    letterSpacing: '0.05em',
                    color: '#000000',
                    margin: '0 0 12px',
                    textAlign: 'right',
                    width: '100%',
                  }}
                >
                  {title}
                </h3>
                <p
                  id={bi}
                  style={{
                    fontWeight: 300,
                    fontSize: 'clamp(0.9375rem, 0.9375vw, 1.125rem)',
                    letterSpacing: '0.05em',
                    lineHeight: 1.8,
                    color: '#7F5268',
                    margin: 0,
                    textAlign: 'right',
                    width: '100%',
                  }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §3.5 GALLERY  ("תעזרי לנו, לעזור לך")
          4 photos arranged in a half-circle / arch
      ══════════════════════════════════════════════════════ */}
      <section style={{
        background: '#F7EDE2',
        overflow: 'hidden',
        padding: 'clamp(50px,7vh,80px) 0 clamp(60px,9vh,110px)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(2rem, 2.604vw, 3.125rem)',
          letterSpacing: '0.05em',
          fontWeight: 500,
          color: '#7F5268',
          textAlign: 'center',
          margin: '0 0 clamp(36px,5vh,64px)',
        }}>
          בכל מקום, כל הזמן
        </h2>

        {/*
          Half-circle arc layout (4 photos):
          The "circle" center is BELOW the container so only the upper arc is visible.
          Photos get progressively higher toward the center.

             [img2] [img3]        ← top center, small gap
           [img1]       [img4]    ← lower, wider
        */}
        <div style={{
          position: 'relative',
          height: 'clamp(360px, 42vw, 600px)',
          maxWidth: 1400,
          margin: '0 auto',
        }}>

          {/* img1 — far left, lowest */}
          <div style={{
            position: 'absolute',
            left: 'clamp(20px, 5vw, 100px)',
            bottom: 'clamp(20px, 5%, 60px)',
            width: 'clamp(140px, 14vw, 210px)',
            height: 'clamp(185px, 19vw, 280px)',
            borderRadius: 20,
            overflow: 'hidden',
            transform: 'rotate(-25.23deg)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.14)',
            zIndex: 2,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/gallery-1.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
          </div>

          {/* img2 — center-left, highest */}
          <div style={{
            position: 'absolute',
            left: '50%',
            marginLeft: 'clamp(-320px, -16vw, -150px)',
            top: 0,
            width: 'clamp(150px, 15vw, 220px)',
            height: 'clamp(200px, 20vw, 295px)',
            borderRadius: 20,
            overflow: 'hidden',
            transform: 'rotate(-7.7deg)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.14)',
            zIndex: 3,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/gallery-2.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
          </div>

          {/* img3 — center-right, highest */}
          <div style={{
            position: 'absolute',
            left: '50%',
            marginLeft: 'clamp(30px, 2vw, 60px)',
            top: 0,
            width: 'clamp(150px, 15vw, 220px)',
            height: 'clamp(200px, 20vw, 295px)',
            borderRadius: 20,
            overflow: 'hidden',
            transform: 'rotate(7.7deg)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.14)',
            zIndex: 3,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/gallery-3.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
          </div>

          {/* img4 — far right, lowest */}
          <div style={{
            position: 'absolute',
            right: 'clamp(20px, 5vw, 100px)',
            bottom: 'clamp(20px, 5%, 60px)',
            width: 'clamp(140px, 14vw, 210px)',
            height: 'clamp(185px, 19vw, 280px)',
            borderRadius: 20,
            overflow: 'hidden',
            transform: 'rotate(25.23deg)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.14)',
            zIndex: 2,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/gallery-4.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
          </div>

          {/* CTA — floats at center of the arc */}
          <div style={{
            position: 'absolute',
            left: '50%',
            bottom: 'clamp(10px, 4%, 40px)',
            transform: 'translateX(-50%)',
            zIndex: 10,
          }}>
            <Link href="/auth" className="btn-hover" style={btnFilled}>
              תתחילי לנסות
              <Arrow />
            </Link>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §4 DAILY SCENARIOS  ("איך זה עוזר ביום יום?")
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: '#F7EDE2', padding: 'clamp(50px,7vh,90px) clamp(24px,4vw,80px)' }}>
        <div style={{ maxWidth: 1466, margin: '0 auto' }}>
          <h2
            id="le-daily-title"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(2rem, 2.604vw, 3.125rem)',
              letterSpacing: '0.05em',
              fontWeight: 500,
              color: '#7F5268',
              textAlign: 'center',
              margin: '0 0 clamp(36px,5vh,52px)',
            }}
          >
            איך זה עוזר ביום יום?
          </h2>

          <div
            className="daily-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '29px 28px' }}
          >
            {/* RTL 2-col grid: [0]=top-right, [1]=top-left, [2]=bottom-right, [3]=bottom-left */}
            {([
              {
                icon: '/icons/landing/week28.svg', iw: 80,
                title: 'בשבוע 28 להריון',
                body: 'בדקי מה גודל התינוק השבוע, מה הבדיקות הקרובות שלך, ושאלי את ה-AI על כל מה שמדאיג אותך.',
                dark: true, ti: 'le-daily-1-title', bi: 'le-daily-1-body',
              },
              {
                icon: '/icons/landing/post-birth.svg', iw: 80,
                title: 'יום אחרי לידה',
                body: 'תבצעי רישומים של האכלות, שינה, חיתולים רטובים וכל מה שאת צריכה כדי להיות רגועה.',
                dark: false, ti: 'le-daily-0-title', bi: 'le-daily-0-body',
              },
              {
                icon: '/icons/landing/nap.svg', iw: 76,
                title: 'נמנום קצר',
                body: 'לחצי Start, התינוק קם — לחצי Stop. הנמנום נרשם אוטומטית. את פנויה לנשום.',
                dark: false, ti: 'le-daily-3-title', bi: 'le-daily-3-body',
              },
              {
                icon: '/icons/landing/doubt.svg', iw: 76,
                title: 'רגע של ספק',
                body: 'שאלי את ה-AI: "האם זה נורמלי?", "כמה אמורה לאכול?", "מרגישה אבודה" — היא תקשיב.',
                dark: false, ti: 'le-daily-2-title', bi: 'le-daily-2-body',
              },
            ] as {icon:string;iw:number;title:string;body:string;dark:boolean;ti:string;bi:string}[]).map(({ icon, iw, title, body, dark, ti, bi }) => (
              <div
                key={title}
                className="scenario-card reveal-up"
                style={{
                  background: dark ? '#7F5268' : '#fff',
                  borderRadius: 30,
                  padding: '0 clamp(12px,1.042vw,20px)',
                  display: 'flex',
                  alignItems: 'center',
                  minHeight: 218,
                  /* Explicit LTR so first child = physical LEFT, last = physical RIGHT */
                  direction: 'ltr',
                  gap: 'clamp(16px,1.198vw,23px)',
                  transition: 'transform 0.22s cubic-bezier(.34,1.56,.64,1)',
                  cursor: 'default',
                }}
              >
                {/* Text — first child → physical LEFT in LTR */}
                <div style={{ flex: 1, direction: 'rtl' }}>
                  <h3
                    id={ti}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                      fontSize: 'clamp(1.25rem, 1.5625vw, 1.875rem)',
                      letterSpacing: '0.05em',
                      color: dark ? '#fff' : '#3a1e2d',
                      margin: '0 0 10px',
                      textAlign: 'right',
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    id={bi}
                    style={{
                      fontWeight: 300,
                      fontSize: 'clamp(0.9375rem, 0.9375vw, 1.125rem)',
                      letterSpacing: '0.05em',
                      lineHeight: 1.75,
                      color: dark ? 'rgba(255,255,255,0.82)' : '#7F5268',
                      margin: 0,
                      textAlign: 'right',
                    }}
                  >
                    {body}
                  </p>
                </div>
                {/* Icon — last child → physical RIGHT in LTR (matches Figma: icon on right) */}
                <div style={{ flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={icon} alt=""
                    style={{
                      width: iw, height: iw,
                      objectFit: 'contain',
                      opacity: dark ? 0.9 : 1,
                      filter: dark ? 'brightness(10)' : 'none',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §5 ABOUT  ("הסיפור שמאחורי המערכת")
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: '#F7EDE2', padding: 'clamp(50px,7vh,90px) clamp(24px,4vw,80px)' }}>
        <div style={{ maxWidth: 1024, margin: '0 auto' }}>

          {/* Photo centered */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(24px,3vh,40px)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/about-eidit.png"
              alt="עידית לאוב"
              style={{
                width: 'clamp(220px,25vw,391px)',
                height: 'clamp(280px,32vw,478px)',
                objectFit: 'cover',
                objectPosition: 'center top',
                borderRadius: '1.5rem',
                display: 'block',
              }}
            />
          </div>

          {/* Title centered */}
          <h2
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(2rem, 2.604vw, 3.125rem)',
              letterSpacing: '0.05em',
              fontWeight: 500,
              color: '#7F5268',
              textAlign: 'center',
              margin: '0 0 clamp(24px,3vh,36px)',
            }}
          >
            הסיפור שמאחורי המערכת
          </h2>

          {/* Story text */}
          <div style={{ position: 'relative' }}>
            {/* Opening quote */}
            <span aria-hidden="true" style={{
              position: 'absolute', top: -20, right: 0,
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(5rem,9vw,8rem)',
              color: '#7F5268', opacity: 0.18, lineHeight: 1,
              pointerEvents: 'none', userSelect: 'none',
            }}>&ldquo;</span>
            {/* Closing quote */}
            <span aria-hidden="true" style={{
              position: 'absolute', bottom: -20, left: 0,
              fontFamily: 'Georgia, serif',
              fontSize: 'clamp(5rem,9vw,8rem)',
              color: '#7F5268', opacity: 0.18, lineHeight: 1,
              pointerEvents: 'none', userSelect: 'none',
            }}>&rdquo;</span>

            <p
              id="le-about-body"
              style={{
                fontWeight: 300,
                fontSize: 'clamp(1rem, 1.042vw, 1.25rem)',
                letterSpacing: '0.05em',
                lineHeight: 1.9,
                color: '#000000',
                textAlign: 'center',
                margin: '0 auto 28px',
                maxWidth: 900,
                position: 'relative',
              }}
            >
              כשדור נולדה, הייתי אמא בפעם הראשונה והרגשתי אבודה לגמרי. רציתי לדעת מה נורמלי, רציתי לזכור מתי האכלתי,
              רציתי מישהי שתענה לי בשלוש בלילה בלי לשפוט. לא מצאתי מקום אחד שנותן את כל זה,{' '}
              <strong style={{ fontWeight: 700, color: '#3a1e2d' }}>אז הקמתי אותו.</strong>
              {' '}אמא בסדר נולדה מהצורך האמיתי של אמא טרייה: לא עוד אפליקציה, אלא כלי שמבין אותך —
              את ההריון שלך, את התינוק שלך, ואת הכאוס היפה הזה שנקרא ימים ראשונים.
            </p>

            {/* Signature */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 2, background: '#7F5268', borderRadius: 2 }} />
              <div style={{ textAlign: 'center' }}>
                <p id="le-about-name" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#7F5268', margin: 0 }}>
                  עידית לאוב
                </p>
                <p id="le-about-role" style={{ fontWeight: 300, fontSize: '0.82rem', color: '#7F5268', margin: '2px 0 0' }}>
                  מייסדת אמא בסדר ואמא של דור אורי
                </p>
              </div>
              <div style={{ width: 32, height: 2, background: '#7F5268', borderRadius: 2 }} />
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §6 TESTIMONIALS  ("מה אמהות אומרות")
      ══════════════════════════════════════════════════════ */}
      <section style={{ background: '#f2e6dc', padding: 'clamp(50px,7vh,80px) clamp(24px,4vw,80px)' }}>
        <div style={{ maxWidth: 1920, margin: '0 auto' }}>
          <h2
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(2rem, 2.604vw, 3.125rem)',
              letterSpacing: '0.05em',
              fontWeight: 500,
              color: '#7F5268',
              textAlign: 'center',
              margin: '0 0 clamp(32px,4vh,48px)',
            }}
          >
            מה אמהות אומרות
          </h2>

          {/* 4 cards in a row */}
          <div
            className="testimonials-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'clamp(12px,2.44vw,47px)',
              maxWidth: 2080,
              margin: '0 auto',
            }}
          >
            {([
              { name: 'גלית ר.',  role: 'אמא + עצמאית',        quote: 'ניהלתי הריון ועסק במקביל. בלי המערכת הזו הייתי קורסת.',           ni:'le-test-0-name', ri:'le-test-0-role', qi:'le-test-0-quote' },
              { name: 'נועה כ.',  role: 'אמא טרייה',            quote: 'סוף סוף אני יודעת בכל רגע מה קורה עם התינוק שלי. זה נתן לי שקט אמיתי.',  ni:'le-test-1-name', ri:'le-test-1-role', qi:'le-test-1-quote' },
              { name: 'שירלי מ.', role: 'בהריון 32 שבועות',     quote: 'הפסקתי לשאול את גוגל בשלוש בלילה. עכשיו יש לי AI שמבין ולא שופט.',        ni:'le-test-2-name', ri:'le-test-2-role', qi:'le-test-2-quote' },
              { name: 'יעל ב.',   role: 'אמא לתאומות',           quote: 'רישום האכלות לשתי תינוקות בלחיצה אחת. שינה לי את החיים ממש.',              ni:'le-test-3-name', ri:'le-test-3-role', qi:'le-test-3-quote' },
            ] as {name:string;role:string;quote:string;ni:string;ri:string;qi:string}[]).map((t, i) => (
              <div
                key={i}
                className="reveal-up"
                style={{
                  position: 'relative',
                  height: 243,
                  minHeight: 243,
                }}
              >
                {/* White card body */}
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: 223,
                  background: '#fff',
                  borderRadius: 30,
                  padding: '33px 13px 76px',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                }}>
                  {/* Stars */}
                  <div style={{ display: 'flex', marginBottom: 16, justifyContent: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icons/landing/stars-rating.svg" alt="" aria-hidden="true" style={{ width: 157, height: 27 }} />
                  </div>
                  <p
                    id={t.qi}
                    style={{
                      fontSize: 'clamp(1rem, 1.042vw, 1.25rem)',
                      letterSpacing: '0.05em',
                      lineHeight: 1.75,
                      color: '#000000',
                      fontStyle: 'italic',
                      fontWeight: 300,
                      margin: 0,
                      textAlign: 'center',
                    }}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>
                {/* Purple footer — overlaps card bottom edge */}
                <div style={{
                  position: 'absolute',
                  top: 174,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 207,
                  height: 69,
                  background: '#7F5268',
                  borderRadius: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <p id={t.ni} style={{ color: '#fff', fontWeight: 500, fontSize: '0.88rem', margin: 0 }}>{t.name}</p>
                  <p id={t.ri} style={{ color: 'rgba(255,255,255,0.68)', fontWeight: 300, fontSize: '0.78rem', margin: '2px 0 0' }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Arrow navigation dots */}
          {/* RTL flex: first child = visual RIGHT, second child = visual LEFT */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 32, alignItems: 'center' }}>
            {/* Previous button — visual RIGHT, outline, → arrow */}
            <button aria-label="הקודם" style={{
              width: 52, height: 52, borderRadius: '50%', border: '1.5px solid #7F5268',
              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width={18} height={10} viewBox="0 0 36 21" fill="none" style={{ flexShrink: 0 }}>
                <path d="M24 0C24 1.113 25.0995 2.775 26.2125 4.17C27.6435 5.97 29.3535 7.5405 31.314 8.739C32.784 9.6375 34.566 10.5 36 10.5M36 10.5C34.566 10.5 32.7825 11.3625 31.314 12.261C29.3535 13.461 27.6435 15.0315 26.2125 16.8285C25.0995 18.225 24 19.89 24 21M36 10.5H0"
                  stroke="#7F5268" strokeWidth="1.5" />
              </svg>
            </button>
            {[0,1].map(i => (
              <span key={i} style={{
                width: i === 0 ? 28 : 10, height: 10, borderRadius: 5,
                background: i === 0 ? '#7F5268' : 'rgba(127,82,104,0.3)',
                display: 'inline-block',
                transition: 'all 0.3s',
              }} />
            ))}
            {/* Next button — visual LEFT, filled purple, ← arrow */}
            <button aria-label="הבא" style={{
              width: 52, height: 52, borderRadius: '50%', border: 'none',
              background: '#7F5268', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Arrow color="#fff" size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          §7 CTA FOOTER  ("שנתחיל?")
      ══════════════════════════════════════════════════════ */}
      <section style={{
        background: '#7F5268',
        padding: 'clamp(60px,9vh,100px) clamp(24px,4vw,80px)',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2
            id="le-cta-heading"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: 'clamp(2rem, 2.604vw, 3.125rem)',
              letterSpacing: '0.05em',
              color: '#ffffff',
              margin: '0 0 14px',
              lineHeight: 1.25,
            }}
          >
            שנתחיל? למה את מחכה?
          </h2>
          <p
            id="le-cta-sub"
            style={{
              fontWeight: 300,
              fontSize: 'clamp(1.25rem, 1.5625vw, 1.875rem)',
              letterSpacing: '0.05em',
              color: '#ffffff',
              lineHeight: 1.7,
              margin: '0 0 36px',
            }}
          >
            הצטרפי לאמהות שכבר לא מנסות להסתדר לבד
          </p>
          <Link
            href="/auth"
            className="btn-hover"
            style={{
              ...btnFilled,
              background: '#fff',
              color: '#7F5268',
            }}
          >
            להרשמה למערכת
            <Arrow color="#7F5268" />
          </Link>
        </div>
      </section>

      {/* ── PWA Install ── */}
      <div id="pwa-install">
        <PwaInstallTabs />
      </div>

      {/* ── Floating landing editor (activated via ?editor) ── */}
      <LandingEditor />

    </main>
  )
}
