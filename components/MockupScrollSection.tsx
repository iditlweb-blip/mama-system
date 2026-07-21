'use client'

import { useRef, useEffect } from 'react'

/* ─── Annotation data ─────────────────────────────────────────────────────── */
/* RIGHT column arrows need to point LEFT (toward phone) → flip with scaleX(-1) */
const RIGHT_ANNOTS = [
  { text: 'תמונת פרופיל שלך',                                      arrow: 'annot-arrow-0', flip: true },
  { text: 'מעבר מהיר לכל\nהעמודים במערכת',                         arrow: 'annot-arrow-1', flip: true },
  { text: "קודם כל את ’את לא חייבת\nלהיות הכי טובה’",             arrow: 'annot-arrow-2', flip: true },
  { text: 'מה שתרשמי יופיע מיד\nבעמוד הראשון',                    arrow: 'annot-arrow-3', flip: true },
]

/* LEFT column arrows point RIGHT (toward phone) → use as-is */
const LEFT_ANNOTS = [
  { text: 'מערכת התראות שמתזכרת על:\nבדיקות, חיסונים, יום הולדת', arrow: 'annot-arrow-4', flip: false },
  { text: 'כאן יופיע גיל התינוק\nאו תאריך משוער בהריון',           arrow: 'annot-arrow-5', flip: false },
  { text: 'סטטוס אחרון לכל מה שרשמת.\nהכל מול העיניים',           arrow: 'annot-arrow-6', flip: false },
]

export default function MockupScrollSection() {
  const sectionRef  = useRef<HTMLDivElement>(null)
  const phoneRef    = useRef<HTMLImageElement>(null)
  const rightColRef = useRef<HTMLDivElement>(null)
  const leftColRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ctx: { revert(): void } | null = null

    async function init() {
      const { default: gsap } = await import('gsap')
      const { ScrollTrigger }  = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)

      const phone = phoneRef.current
      const sec   = sectionRef.current
      const rCol  = rightColRef.current
      const lCol  = leftColRef.current

      if (!phone || !sec || !rCol || !lCol) return

      const rightItems = Array.from(rCol.querySelectorAll<HTMLElement>('.annot-item'))
      const leftItems  = Array.from(lCol.querySelectorAll<HTMLElement>('.annot-item'))

      ctx = gsap.context(() => {
        /* ── Set initial states ──────────────────────────────── */
        gsap.set(phone, { scale: 0.28, rotation: -18, y: '30%', transformOrigin: '50% 50%' })
        gsap.set(rightItems, { autoAlpha: 0, x: 28 })
        gsap.set(leftItems,  { autoAlpha: 0, x: -28 })

        /* ── Single scrubbed timeline ────────────────────────── */
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sec,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2,
          },
        })

        /* Phase 1 (0→1): phone grows, rotates, rises into center */
        tl.to(phone, {
          scale: 1,
          rotation: 0,
          y: 0,
          duration: 1,
          ease: 'none',
        }, 0)

        /* Phase 2 (0.9→1.6): right annotations slide in */
        tl.to(rightItems, {
          autoAlpha: 1,
          x: 0,
          stagger: 0.06,
          duration: 0.55,
          ease: 'none',
        }, 0.9)

        /* Phase 3 (0.9→1.6): left annotations slide in simultaneously */
        tl.to(leftItems, {
          autoAlpha: 1,
          x: 0,
          stagger: 0.06,
          duration: 0.55,
          ease: 'none',
        }, 0.9)

      }, sec)
    }

    init()
    return () => { ctx?.revert() }
  }, [])

  return (
    <section
      ref={sectionRef}
      style={{
        height: '320vh',
        background: '#F7EDE2',
        position: 'relative',
      }}
    >
      {/* Sticky viewport */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'clamp(16px, 2.5vw, 48px)',
          padding: '0 clamp(16px, 4vw, 60px)',
          direction: 'ltr',   /* physical layout: left-col | phone | right-col */
        }}
      >

        {/* ── LEFT annotation column (physical left) ── */}
        <div
          ref={leftColRef}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(20px, 3vh, 40px)',
            alignItems: 'flex-start',
          }}
        >
          {LEFT_ANNOTS.map((a) => (
            <div
              key={a.text}
              className="annot-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                direction: 'ltr',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/icons/landing/${a.arrow}.svg`}
                alt=""
                aria-hidden="true"
                style={{ height: 24, width: 'auto', flexShrink: 0, display: 'block' }}
              />
              <p style={{
                margin: 0,
                direction: 'rtl',
                fontSize: 'clamp(1rem, 1.042vw, 1.25rem)',
                letterSpacing: '0.05em',
                color: '#000000',
                lineHeight: 1.6,
                fontWeight: 400,
                whiteSpace: 'pre-line',
                textAlign: 'right',
              }}>
                {a.text}
              </p>
            </div>
          ))}
        </div>

        {/* ── Phone mockup (center) ── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={phoneRef}
          src="/images/mockup-app.png"
          alt="אפליקציה - אמא בסדר"
          style={{
            height: 'min(80vh, 620px)',
            width: 'auto',
            flexShrink: 0,
            display: 'block',
            zIndex: 2,
          }}
        />

        {/* ── RIGHT annotation column (physical right) ── */}
        <div
          ref={rightColRef}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(20px, 3vh, 40px)',
            alignItems: 'flex-end',
          }}
        >
          {RIGHT_ANNOTS.map((a) => (
            <div
              key={a.text}
              className="annot-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                direction: 'ltr',
              }}
            >
              <p style={{
                margin: 0,
                direction: 'rtl',
                fontSize: 'clamp(1rem, 1.042vw, 1.25rem)',
                letterSpacing: '0.05em',
                color: '#000000',
                lineHeight: 1.6,
                fontWeight: 400,
                whiteSpace: 'pre-line',
                textAlign: 'right',
              }}>
                {a.text}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/icons/landing/${a.arrow}.svg`}
                alt=""
                aria-hidden="true"
                style={{
                  height: 24,
                  width: 'auto',
                  flexShrink: 0,
                  display: 'block',
                  transform: 'scaleX(-1)',
                }}
              />
            </div>
          ))}
        </div>

      </div>

      {/* Mobile: show phone only, no annotations */}
      <style>{`
        @media (max-width: 700px) {
          .annot-item { display: none !important; }
        }
      `}</style>
    </section>
  )
}
