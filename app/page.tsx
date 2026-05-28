import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <main style={{ background: '#F7EDE2', fontFamily: 'var(--font-body)', overflowX: 'hidden' }}>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 w-full">
        <Image src="/logo.svg" alt="אמא בסדר" width={26} height={44} priority />
        <Link href="/auth" className="btn-brand text-sm px-5 py-2.5">
          כניסה
          <ArrowIcon />
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="w-full text-center px-4 pt-6">

        {/* Headlines */}
        <h1
          className="anim-fade-up text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mx-auto mb-3"
          style={{ color: '#000', maxWidth: 640, letterSpacing: '-0.015em' }}
        >
          אמא אחת. אלף משימות.<br />מערכת אחת.
        </h1>
        <p
          className="anim-fade-up-2 text-base md:text-lg font-light mb-8 mx-auto"
          style={{ color: '#7F5268', maxWidth: 420 }}
        >
          המערכת שמסדרת לך את החיים — לא רק את העסק
        </p>

        {/* ── Three-image hero — full bleed ── */}
        <div
          className="anim-fade-up-3 relative w-full flex items-end justify-center"
          style={{ minHeight: 420, maxHeight: 560 }}
        >
          {/* Left — office (was right, now swapped) */}
          <div
            className="absolute bottom-0 right-0 md:right-4 lg:right-8 hidden md:block"
            style={{ width: '28%', maxWidth: 320 }}
          >
            <Image
              src="/images/office-right.png"
              alt=""
              width={320}
              height={400}
              className="w-full h-auto object-cover"
              style={{
                borderRadius: '2rem 2rem 0 0',
                maskImage: 'linear-gradient(to top, transparent 0%, black 35%)',
                WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 35%)',
              }}
            />
          </div>

          {/* Center — mom hero, biggest */}
          <div
            className="relative z-10 anim-float"
            style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}
          >
            <Image
              src="/images/hero-mom.png"
              alt="אמא ותינוק"
              width={480}
              height={560}
              priority
              className="w-full h-auto object-contain mx-auto"
              style={{
                maskImage: 'linear-gradient(to top, transparent 0%, black 20%)',
                WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 20%)',
              }}
            />
          </div>

          {/* Right — toys (was left, now swapped) */}
          <div
            className="absolute bottom-0 left-0 md:left-4 lg:left-8 hidden md:block"
            style={{ width: '28%', maxWidth: 320 }}
          >
            <Image
              src="/images/toys-left.png"
              alt=""
              width={320}
              height={400}
              className="w-full h-auto object-cover"
              style={{
                borderRadius: '2rem 2rem 0 0',
                maskImage: 'linear-gradient(to top, transparent 0%, black 35%)',
                WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 35%)',
              }}
            />
          </div>
        </div>

        {/* ── Big display text ── */}
        <div
          className="font-display select-none pointer-events-none -mt-6 mb-8 overflow-hidden"
          style={{ lineHeight: 1 }}
          aria-hidden="true"
        >
          <span
            className="text-stroke"
            style={{
              fontSize: 'clamp(3.5rem, 12vw, 9rem)',
              fontFamily: 'var(--font-display)',
              display: 'block',
              letterSpacing: '0.04em',
              WebkitTextStroke: '1.5px #7F5268',
              color: 'transparent',
              opacity: 0.55,
            }}
          >
            אמא בסדר
          </span>
        </div>

        {/* ── CTA ── */}
        <div className="flex flex-col items-center gap-2 pb-16">
          <Link href="/auth" className="btn-brand text-base px-9 py-3.5">
            כניסה למערכת
            <ArrowIcon />
          </Link>
          <span className="text-xs font-light mt-1" style={{ color: '#7F5268', opacity: 0.65 }}>
            בחינם · ללא כרטיס אשראי
          </span>
        </div>
      </section>

      {/* ── Features strip ───────────────────────────────────────── */}
      <section style={{ background: '#fff', borderTop: '1px solid rgba(127,82,104,0.1)', borderBottom: '1px solid rgba(127,82,104,0.1)' }}>
        <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { emoji: '👶', label: 'מעקב תינוק', sub: 'האכלות, שינה, חיתולים' },
            { emoji: '✅', label: 'ניהול משימות', sub: 'Kanban + Pomodoro' },
            { emoji: '💼', label: 'ניהול עבודה', sub: 'לוז, משימות עסקיות' },
            { emoji: '🤖', label: 'AI בעברית', sub: 'ייעוץ, תמיכה, טיפים' },
          ].map(({ emoji, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <span
                className="w-20 h-20 rounded-3xl text-4xl flex items-center justify-center"
                style={{ background: 'rgba(127,82,104,0.08)' }}
              >
                {emoji}
              </span>
              <div>
                <p className="font-semibold text-base" style={{ color: '#000' }}>{label}</p>
                <p className="text-xs font-light mt-0.5" style={{ color: '#7F5268' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why choose this ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2
          className="text-3xl md:text-4xl font-bold text-center mb-12"
          style={{ color: '#000' }}
        >
          למה דווקא <span style={{ color: '#7F5268' }}>אמא בסדר</span>?
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
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl p-7"
              style={{ background: '#fff', border: '1px solid rgba(127,82,104,0.12)' }}
            >
              <span className="text-3xl block mb-4">{icon}</span>
              <h3 className="text-lg font-bold mb-2" style={{ color: '#000' }}>{title}</h3>
              <p className="text-sm leading-relaxed font-light" style={{ color: '#7F5268' }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it helps ─────────────────────────────────────────── */}
      <section style={{ background: 'rgba(127,82,104,0.05)' }}>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: '#000' }}>
            איך זה עוזר ביום יום?
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { emoji: '🌅', title: 'בוקר שלישי 06:00', body: 'בדקי מה שלום התינוק בדשבורד, רשמי האכלה בלחיצה, וראי את 3 המשימות הדחופות של היום.' },
              { emoji: '💤', title: 'נמנום קצר', body: 'לחצי Start בטיימר השינה. כשהתינוק קם — לחצי Stop. הנמנום נרשם אוטומטית.' },
              { emoji: '💻', title: 'שעת עבודה', body: 'פתחי Pomodoro, סמני משימות שהושלמו, ושאלי את ה-AI על הצעד הבא בפרויקט.' },
              { emoji: '🌙', title: 'סוף יום', body: 'קבלי סיכום: כמה ישן, כמה אכל, מה הושלם. מחר מתחיל יום חדש — את מוכנה.' },
            ].map(({ emoji, title, body }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl p-6"
                style={{ background: '#fff', border: '1px solid rgba(127,82,104,0.1)' }}
              >
                <span className="text-3xl flex-shrink-0">{emoji}</span>
                <div>
                  <h3 className="font-semibold text-base mb-1" style={{ color: '#000' }}>{title}</h3>
                  <p className="text-sm font-light leading-relaxed" style={{ color: '#7F5268' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quotes ───────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: '#000' }}>
          כי את עושה את הכי חשוב בעולם
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            '"את עושה יותר ממה שאת חושבת שאת עושה"',
            '"לא צריך להיות מושלמת — רק נוכחת"',
            '"עסק מהבית עם תינוק זה כפול מאמץ, כפול גאווה"',
          ].map(q => (
            <blockquote
              key={q}
              className="rounded-2xl p-6 italic text-sm leading-relaxed font-light"
              style={{ background: '#fff', border: '1px solid rgba(127,82,104,0.12)', color: '#7F5268' }}
            >
              {q}
            </blockquote>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section
        className="w-full text-center py-20 px-6"
        style={{ background: '#7F5268' }}
      >
        <h2
          className="font-display mb-4"
          style={{
            fontSize: 'clamp(3rem, 9vw, 6.5rem)',
            fontFamily: 'var(--font-display)',
            color: '#F7EDE2',
            lineHeight: 1.1,
          }}
        >
          מתחילים?
        </h2>
        <p className="text-base font-light mb-10" style={{ color: 'rgba(247,237,226,0.7)' }}>
          הצטרפי לאמהות שכבר מנהלות חיים שלמים מממשק אחד
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-3 px-9 py-3.5 rounded-full font-medium text-base transition-opacity hover:opacity-90"
          style={{ background: '#F7EDE2', color: '#7F5268' }}
        >
          כניסה למערכת
          <ArrowIcon color="#7F5268" />
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer
        className="w-full text-center py-7 px-6"
        style={{ background: '#F7EDE2', borderTop: '1px solid rgba(127,82,104,0.1)' }}
      >
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
