'use client'

import { useRef, useEffect } from 'react'

const STEPS = [
  {
    num: '01',
    title: 'הרשמה למערכת',
    body: 'לחצי על כפתור ׳כניסה למערכת׳, הירשמי עם המייל או הגוגל שלך במהירות ואת בפנים',
    side: 'right' as const,
  },
  {
    num: '02',
    title: 'הגדרות',
    body: 'אם את בהריון סמני את התאריך המשוער ומין העובר — אם את רוצה מעקב תינוק סמני בהתאם, המערכת תעשה את השאר בשבילך',
    side: 'left' as const,
  },
  {
    num: '03',
    title: 'זהו!',
    body: 'מעכשיו המערכת עושה הכל בשבילך — כנסי להתעדכן, לסמן, לראות את גודל העובר או השלב הבא בהתפתחות התינוק שלך.',
    side: 'right' as const,
  },
  {
    num: '04',
    title: 'אל תשכחי!',
    body: 'אל תשכחי את עצמך! האפליקציה כאן כדי לעשות לך סדר ולעזור לך — תשמשי בה!',
    side: 'left' as const,
  },
]

/* ── SVG path data for dashed connecting lines ──────────────────────────── */
const DASH_LINES = [
  {
    viewBox: '0 0 292 176', w: 292, h: 176, alignRight: true,
    d: 'M289.498 2.5C288.912 2.5 277.083 4.24033 256.5 7.91846C247.396 9.5452 241.208 11.9388 234.762 14.8773C221.594 20.8799 213.036 27.3888 209.191 31.4951C205.736 35.1843 208.647 43.1003 206.068 44.8138C196.365 51.2596 197.777 49.266 186.141 49.7937C172.614 50.4071 163.825 54.5988 159.949 56.28C149.803 60.6804 142.88 68.8092 137.487 76.1738C132.502 82.9807 127.364 90.3845 121.538 95.9496C109.217 107.718 97.6157 109.963 88.8068 111.077C77.4931 112.507 69.2751 103.283 66.6829 100.049C65.2876 98.3086 65.2662 95.6394 65.4944 93.4554C65.6033 92.4125 66.1788 91.6031 67.0947 90.7555C69.2006 88.8065 72.1684 81.5975 77.3469 81.8929C81.1653 82.1106 89.3951 86.8249 90.6957 88.5066C92.1865 90.4343 94.9938 97.8401 95.4632 102.395C96.1721 109.276 85.289 114.502 82.5552 117.882C81.4367 119.265 78.5214 120.781 72.2567 123.704C62.161 128.414 49.8575 131.873 40.5025 134C33.7044 135.546 29.0315 137.486 20.6601 142.272C11.53 147.493 7.27753 155.702 4.14071 162.42C3.4456 164.121 3.02654 165.393 2.77187 167.135C2.51719 168.878 2.43959 171.053 2.54149 173.5',
  },
  {
    viewBox: '0 0 302 104', w: 302, h: 104, alignRight: false,
    d: 'M2.50098 2.50073C5.56406 9.61741 17.19 30.1829 27.6208 39.1882C34.3213 44.973 52.065 47.4481 79.7673 52.0283C117.233 58.2227 141.928 56.2718 146.492 54.741C148.981 53.9059 151.34 51.935 152.803 49.8596C154.266 47.7842 154.639 45.4039 154.64 43.4405C154.642 41.4771 154.261 40.0028 152.987 38.6399C147.14 32.3859 138.913 33.8928 135.305 34.7948C133.54 35.236 126.859 42.6554 126.385 45.0022C123.747 58.0749 139.124 72.9595 156.565 78.324C173.288 83.4675 220.144 83.484 244.381 85.8988C255.027 86.9593 261.719 93.8581 267.367 97.5615C274.925 100.845 282.913 101.829 287.395 101.41C290.134 100.991 293.818 100.153 299.501 99.29',
  },
  {
    viewBox: '0 0 146 122', w: 146, h: 122, alignRight: true,
    d: 'M136.447 2.5C138.545 5.16213 143.974 16.1087 143.468 29.306C142.932 43.2876 119.268 55.1671 97.001 59.9057C92.8521 60.7887 77.9587 50.0479 78.001 48C78.0432 45.9521 82.1178 34.8965 83.501 33.5C84.8841 32.1035 100.365 28.2869 102.001 28.5C108.519 29.3492 115.334 48.1911 118.881 59.9057C124.351 77.9729 117.688 93.1089 112.524 104.288C109.978 109.8 98.1001 110.783 76.7636 112.614C42.2338 113.237 19.3659 113.536 14.5907 114.807C11.5543 115.779 7.27306 117.416 2.50098 119.5',
  },
]

/* ── Animated dashed SVG path ─────────────────────────────────────────────── */
function AnimatedDashLine({ d, viewBox, w, h, alignRight }: (typeof DASH_LINES)[0]) {
  const pathRef = useRef<SVGPathElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const path = pathRef.current
    const wrap = wrapRef.current
    if (!path || !wrap) return

    /* Measure path and set initial hidden state — dashes stay throughout */
    const len = path.getTotalLength()
    const cycleLen = 30
    const startOffset = Math.ceil(len / cycleLen) * cycleLen

    path.style.strokeDasharray  = '15 15'
    path.style.strokeDashoffset = String(startOffset)

    async function animate() {
      const { default: gsap } = await import('gsap')
      const { ScrollTrigger }  = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)

      ScrollTrigger.create({
        trigger: wrap,
        start: 'top 82%',
        once: true,
        onEnter: () => {
          gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.8,
            ease: 'power2.inOut',
          })
        },
      })
    }

    animate()
  }, [])

  /* Scale down the SVG so it fits in the column */
  const scaledW = Math.min(w, 200)
  const scaledH = Math.round((h / w) * scaledW)

  return (
    <div
      ref={wrapRef}
      style={{
        display:        'flex',
        justifyContent: alignRight ? 'flex-end' : 'flex-start',
        margin:         '-8px 0',
        padding:        '0 clamp(24px, 5%, 80px)',
        pointerEvents:  'none',
      }}
    >
      <svg
        viewBox={viewBox}
        width={scaledW}
        height={scaledH}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <path
          ref={pathRef}
          d={d}
          stroke="#7F5268"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="15 15"
        />
      </svg>
    </div>
  )
}

/* ── Step numeral dimensions (natural SVG size in px) ──────────────────────── */
const STEP_SVG_DIMS: Record<string, [number, number]> = {
  '01': [217, 185],
  '02': [125, 173],
  '03': [113, 179],
  '04': [141, 174],
}

/* ── Step card ──────────────────────────────────────────────────────────────── */
function StepCard({ num, title, body, side }: (typeof STEPS)[0]) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    async function animate() {
      const { default: gsap } = await import('gsap')
      const { ScrollTrigger }  = await import('gsap/ScrollTrigger')
      gsap.registerPlugin(ScrollTrigger)

      gsap.fromTo(
        el,
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once:  true,
          },
        },
      )
    }

    animate()
  }, [])

  const [sw, sh] = STEP_SVG_DIMS[num] ?? [120, 180]
  /* Scale to ~65% for display */
  const dispW = Math.round(sw * 0.65)
  const dispH = Math.round(sh * 0.65)

  /* RTL flex: flex-start = physical RIGHT, flex-end = physical LEFT */
  return (
    <div style={{
      display:        'flex',
      justifyContent: side === 'right' ? 'flex-start' : 'flex-end',
      position:       'relative',
    }}>
      {/* Step numeral SVG — decorative, anchored to the outer edge of the card */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/icons/landing/step-${num}.svg`}
        alt=""
        aria-hidden="true"
        style={{
          position:      'absolute',
          bottom:        -15,
          ...(side === 'right' ? { right: 0 } : { left: 0 }),
          width:         dispW,
          height:        dispH,
          pointerEvents: 'none',
          zIndex:        0,
        }}
      />
      <div
        ref={cardRef}
        style={{
          display:         'flex',
          alignItems:      'flex-start',
          gap:             'clamp(14px, 2vw, 24px)',
          background:      'rgba(255,255,255,0.82)',
          backdropFilter:  'blur(8px)',
          borderRadius:    24,
          padding:         'clamp(22px, 2.8vw, 38px) clamp(22px, 3vw, 42px)',
          width:           'min(60%, 640px)',
          overflow:        'hidden',
          opacity:         0,   /* GSAP reveals */
          position:        'relative',
          zIndex:          1,
          /* Card direction stays RTL (inherits from <main dir="rtl">) */
        }}
      >
        {/* Text block */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <h3 style={{
            fontFamily:    'var(--font-body)',
            fontWeight:    600,
            fontSize:      num === '01'
              ? 'clamp(1.5rem, 2.215vw, 2.6563rem)'
              : 'clamp(1.375rem, 1.899vw, 2.2788rem)',
            letterSpacing: '0.05em',
            color:         '#3a1e2d',
            margin:        '0 0 10px',
          }}>
            {title}
          </h3>
          <p style={{
            fontWeight:    300,
            fontSize:      num === '01'
              ? 'clamp(1.0625rem, 1.477vw, 1.7719rem)'
              : 'clamp(1rem, 1.266vw, 1.5188rem)',
            letterSpacing: '0.05em',
            lineHeight:    1.8,
            color:         '#666',
            margin:        0,
          }}>
            {body}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Full section ─────────────────────────────────────────────────────────── */
export default function HowItWorksSection() {
  return (
    <section style={{
      background: '#F7EDE2',
      padding: 'clamp(50px, 7vh, 90px) clamp(24px, 4vw, 80px)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <h2 style={{
          fontFamily:    'var(--font-body)',
          fontSize:      'clamp(2rem, 2.604vw, 3.125rem)',
          letterSpacing: '0.05em',
          fontWeight:    500,
          color:         '#3a1e2d',
          textAlign:     'center',
          margin:        '0 0 clamp(40px, 6vh, 68px)',
        }}>
          איך זה עובד?
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {STEPS.map((step, i) => (
            <div key={step.num}>
              <StepCard {...step} />
              {i < STEPS.length - 1 && (
                <AnimatedDashLine {...DASH_LINES[i]} />
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
