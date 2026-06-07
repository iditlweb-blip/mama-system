import Link from 'next/link'
import Image from 'next/image'
import HeroEditor from '@/components/HeroEditor'

export default function LandingPage() {
  return (
    <main style={{ background: '#F7EDE2', fontFamily: 'var(--font-body)', overflowX: 'hidden', direction: 'rtl' }}>

      {/* ── Mobile hero overrides ── */}
      <style>{`
        @media (max-width: 767px) {
          [data-hero="display-text"] { font-size: 96px !important; }
          [data-hero="img-wrap"]     { top: 5% !important; }
          [data-hero="img"]          { width: 90% !important; }
          [data-hero="display-wrap"] { bottom: 21% !important; }
          [data-hero="side"]         { opacity: 0.55 !important; z-index: 15 !important; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════
          HERO — full viewport, no scroll
      ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          height: '100svh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: '#F7EDE2',
        }}
      >
        {/* ── Nav — logo right (RTL start), button left (RTL end) ── */}
        <nav style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px' }}>
          <Image src="/logo.svg" alt="אמא בסדר" width={36} height={62} priority data-hero="logo" />
          <Link href="/auth" className="btn-brand text-sm px-5 py-2.5">
            כניסה
            <ArrowIcon />
          </Link>
        </nav>

        {/* ── Content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Headlines */}
          <div
            className="anim-fade-up"
            style={{ textAlign: 'center', padding: '10px 16px 0', flexShrink: 0, position: 'relative', zIndex: 10 }}
          >
            <h1
              data-hero="h1"
              className="md:whitespace-nowrap"
              style={{
                fontSize: 'clamp(1.85rem, 3.2vw, 3.3rem)',
                fontWeight: 800,
                lineHeight: 1.2,
                color: '#111',
                letterSpacing: '-0.02em',
                margin: '0 auto 8px',
              }}
            >
              אמא אחת. אלף משימות. מערכת אחת.
            </h1>
            <p
              data-hero="subtitle"
              className="anim-fade-up-2 md:whitespace-nowrap"
              style={{ fontSize: 'clamp(0.85rem, 1.7vw, 1.5rem)', color: '#7F5268', margin: '0 auto', fontWeight: 300 }}
            >
              המערכת שמסדרת לך את החיים — לא רק את העסק
            </p>
          </div>

          {/* Image area — flex-1, images + overlay */}
          <div style={{ flex: 1, position: 'relative', minHeight: 0, overflow: 'hidden' }}>

            {/* Toys — physical left (visual right in RTL) */}
            <div
              data-hero="side"
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '33%', pointerEvents: 'none', zIndex: 1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/toys-left.png"
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  maskImage: 'linear-gradient(to top, transparent 0%, black 22%), linear-gradient(to right, transparent 0%, black 35%)',
                  maskComposite: 'intersect',
                  WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 22%), linear-gradient(to right, transparent 0%, black 35%)',
                  WebkitMaskComposite: 'destination-in',
                }}
              />
            </div>

            {/* Office — physical right (visual left in RTL) */}
            <div
              data-hero="side"
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '33%', pointerEvents: 'none', zIndex: 1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/office-right.png"
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  maskImage: 'linear-gradient(to top, transparent 0%, black 22%), linear-gradient(to left, transparent 0%, black 35%)',
                  maskComposite: 'intersect',
                  WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 22%), linear-gradient(to left, transparent 0%, black 35%)',
                  WebkitMaskComposite: 'destination-in',
                }}
              />
            </div>

            {/* Center mom — centered, shifted down slightly */}
            <div
              data-hero="img-wrap"
              className="anim-float"
              style={{
                position: 'absolute',
                top: '3%', bottom: 0,
                left: 0, right: 0,
                display: 'flex',
                justifyContent: 'center',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                data-hero="img"
                src="/images/hero-mom.png"
                alt="אמא ותינוק"
                style={{
                  width: 'clamp(220px, 60%, 520px)',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center top',
                  maskImage: 'linear-gradient(to top, transparent 0%, black 18%)',
                  WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 18%)',
                }}
              />
            </div>

            {/* "אמא בסדר" — handwriting display text, overlaid */}
            <div
              data-hero="display-wrap"
              className="anim-fade-up-3"
              style={{
                position: 'absolute',
                bottom: 'clamp(72px, 14.5%, 115px)',
                left: 0, right: 0,
                textAlign: 'center',
                zIndex: 20,
                pointerEvents: 'none',
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              <span
                data-hero="display-text"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(3.5rem, 12vw, 9.5rem)',
                  color: '#7F5268',
                  WebkitTextStroke: '1px #7F5268',
                  paintOrder: 'stroke fill',
                  letterSpacing: '0.03em',
                  display: 'block',
                }}
              >
                אמא בסדר
              </span>
            </div>

            {/* CTA */}
            <div
              data-hero="cta-wrap"
              style={{
                position: 'absolute',
                bottom: 'clamp(10px, 2.5%, 20px)',
                left: 0, right: 0,
                textAlign: 'center',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Link href="/auth" className="btn-brand px-9 py-3 text-base">
                כניסה למערכת
                <ArrowIcon />
              </Link>
              <span style={{ fontSize: '0.72rem', color: '#7F5268', opacity: 0.7 }}>
                עדיין אין לך חשבון?{' '}
                <Link href="/auth" style={{ textDecoration: 'underline', color: '#7F5268' }}>
                  הירשמי עכשיו
                </Link>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FEATURES STRIP — SVG icons
      ═══════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: '#fff',
          borderTop: '1px solid rgba(127,82,104,0.1)',
          borderBottom: '1px solid rgba(127,82,104,0.1)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: '/icons/baby.svg',  w: 44, h: 40, label: 'מעקב תינוק',    sub: 'האכלות, שינה, חיתולים' },
            { icon: '/icons/task.svg',  w: 40, h: 37, label: 'ניהול משימות',  sub: 'Kanban + Pomodoro'     },
            { icon: '/icons/work.svg',  w: 40, h: 40, label: 'ניהול עבודה',   sub: 'לוז, משימות עסקיות'   },
            { icon: '/icons/chat.svg',  w: 42, h: 42, label: 'AI בעברית',     sub: 'ייעוץ, תמיכה, טיפים'  },
          ].map(({ icon, w, h, label, sub }, i) => (
            <div
              key={label}
              className={`reveal hover-lift flex flex-col items-center gap-3 reveal-delay-${i}`}
            >
              <div
                className="icon-box w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{ background: 'rgba(127,82,104,0.08)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={icon} alt="" width={w} height={h} />
              </div>
              <div>
                <p className="font-semibold text-base" style={{ color: '#111' }}>{label}</p>
                <p className="text-xs font-light mt-0.5" style={{ color: '#7F5268' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          WHY — "למה דווקא אמא בסדר?"
      ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2
          className="reveal text-3xl md:text-4xl font-bold text-center mb-12"
          style={{ color: '#111' }}
        >
          למה דווקא{' '}
          <span
            style={{
              fontFamily: 'var(--font-display)',
              color: '#7F5268',
              WebkitTextStroke: '0.5px #7F5268',
              paintOrder: 'stroke fill',
            }}
          >
            אמא בסדר
          </span>
          ?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🎯',
              title: 'בנוי לחיים האמיתיים שלך',
              body: 'לא אפליקציה כללית. מערכת שהוקמה ספציפית לאמא שגם עובדת — מאחדת עסק, תינוק ובית במקום אחד.',
            },
            {
              icon: '⚡',
              title: 'מהיר, פשוט, בדרייב',
              body: 'כפתורי רישום מהיר, טיימר שינה חי, ולוח משימות שמבין שהיום יש לך 20 דקות בין נמנום לנמנום.',
            },
            {
              icon: '🧠',
              title: 'AI שמבין אמא',
              body: '4 מצבי ייעוץ בעברית: עצות לתינוק, ניהול זמן, עסק מהבית, ותמיכה רגשית — בלי שיפוטיות.',
            },
          ].map(({ icon, title, body }, i) => (
            <div
              key={title}
              className={`reveal hover-lift rounded-2xl p-7 reveal-delay-${i}`}
              style={{ background: '#fff', border: '1px solid rgba(127,82,104,0.12)' }}
            >
              <span className="text-3xl block mb-4">{icon}</span>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#111' }}>{title}</h3>
              <p className="text-sm leading-relaxed font-light" style={{ color: '#7F5268' }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT HELPS
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: 'rgba(127,82,104,0.05)' }}>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="reveal text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: '#111' }}>
            איך זה עוזר ביום יום?
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { emoji: '🌅', title: 'בוקר שלישי 06:00', body: 'בדקי מה שלום התינוק בדשבורד, רשמי האכלה בלחיצה, וראי את 3 המשימות הדחופות של היום.' },
              { emoji: '💤', title: 'נמנום קצר',          body: 'לחצי Start בטיימר השינה. כשהתינוק קם — לחצי Stop. הנמנום נרשם אוטומטית.' },
              { emoji: '💻', title: 'שעת עבודה',          body: 'פתחי Pomodoro, סמני משימות שהושלמו, ושאלי את ה-AI על הצעד הבא בפרויקט.' },
              { emoji: '🌙', title: 'סוף יום',            body: 'קבלי סיכום: כמה ישן, כמה אכל, מה הושלם. מחר מתחיל יום חדש — את מוכנה.' },
            ].map(({ emoji, title, body }, i) => (
              <div
                key={title}
                className={`reveal hover-lift flex gap-4 rounded-2xl p-6 reveal-delay-${i % 2}`}
                style={{ background: '#fff', border: '1px solid rgba(127,82,104,0.1)' }}
              >
                <span className="text-3xl flex-shrink-0">{emoji}</span>
                <div>
                  <h3 className="font-semibold text-base mb-1" style={{ color: '#111' }}>{title}</h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: '#7F5268' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          QUOTES
      ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="reveal text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: '#111' }}>
          כי את עושה את הכי חשוב בעולם
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            '"את עושה יותר ממה שאת חושבת שאת עושה"',
            '"לא צריך להיות מושלמת — רק נוכחת"',
            '"עסק מהבית עם תינוק זה כפול מאמץ, כפול גאווה"',
          ].map((q, i) => (
            <blockquote
              key={q}
              className={`reveal hover-lift rounded-2xl p-6 italic text-sm leading-relaxed font-light reveal-delay-${i}`}
              style={{ background: '#fff', border: '1px solid rgba(127,82,104,0.12)', color: '#7F5268' }}
            >
              {q}
            </blockquote>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="w-full text-center py-20 px-6" style={{ background: '#7F5268' }}>
        <h2
          className="reveal font-display mb-4"
          style={{
            fontSize: 'clamp(3rem, 9vw, 6.5rem)',
            fontFamily: 'var(--font-display)',
            color: '#F7EDE2',
            lineHeight: 1.1,
          }}
        >
          מתחילים?
        </h2>
        <p className="reveal text-base font-light mb-10" style={{ color: 'rgba(247,237,226,0.7)' }}>
          הצטרפי לאמהות שכבר מנהלות חיים שלמים מממשק אחד
        </p>
        <Link
          href="/auth"
          className="reveal inline-flex items-center gap-3 px-9 py-3.5 rounded-full font-medium text-base transition-opacity hover:opacity-90"
          style={{ background: '#F7EDE2', color: '#7F5268' }}
        >
          כניסה למערכת
          <ArrowIcon color="#7F5268" />
        </Link>
      </section>

      <HeroEditor />

      {/* ── Footer ── */}
      <footer className="w-full text-center py-7 px-6" style={{ background: '#F7EDE2', borderTop: '1px solid rgba(127,82,104,0.1)' }}>
        <p className="text-sm font-light" style={{ color: '#7F5268' }}>
          נעשה עם המון אהבה ע״י <strong className="font-semibold">עידית לאוב</strong>
        </p>
        <p className="text-xs font-light mt-1" style={{ color: 'rgba(127,82,104,0.6)' }}>
          © 2025 כל הזכויות שמורות ל״אמא בסדר״
        </p>
      </footer>
    </main>
  )
}

function ArrowIcon({ color = 'rgba(230,230,230,0.85)' }: { color?: string }) {
  return (
    <svg width="26" height="15" viewBox="0 0 36 21" fill="none" aria-hidden="true">
      <path
        d="M12 0C12 1.113 10.9005 2.775 9.7875 4.17C8.3565 5.97 6.6465 7.5405 4.686 8.739C3.216 9.6375 1.434 10.5 0 10.5M0 10.5C1.434 10.5 3.2175 11.3625 4.686 12.261C6.6465 13.461 8.3565 15.0315 9.7875 16.8285C10.9005 18.225 12 19.89 12 21M0 10.5H36"
        stroke={color}
        strokeWidth="1.5"
      />
    </svg>
  )
}
