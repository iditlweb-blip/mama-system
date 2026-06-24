import Link from 'next/link'
import Image from 'next/image'
import HeroEditor from '@/components/HeroEditor'
import LandingEditor from '@/components/LandingEditor'
import PwaInstallTabs from '@/components/PwaInstallTabs'

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
          [data-hero="side"]         { opacity: 0.8 !important; z-index: 5 !important; bottom: 25% !important; }
          [data-hero="side"] img     { mask-image: none !important; -webkit-mask-image: none !important; }
        }
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .testimonials-track {
          display: flex;
          width: max-content;
          animation: marquee-scroll 32s linear infinite;
        }
        .testimonials-track:hover {
          animation-play-state: paused;
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
        {/* ── Nav — logo right (RTL start), buttons left (RTL end) ── */}
        <nav style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 28px' }}>
          <Image src="/logo.svg" alt="אמא בסדר" width={36} height={62} priority data-hero="logo" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <a
              href="#pwa-install"
              className="btn-brand btn-brand-outline text-sm px-5 py-2.5"
            >
              הורדה לטלפון
            </a>
            <Link href="/auth" className="btn-brand text-sm px-5 py-2.5">
              התחילי עכשיו
              <ArrowIcon />
            </Link>
          </div>
        </nav>

        {/* ── Content ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Headlines */}
          <div
            className="anim-fade-up"
            style={{ textAlign: 'center', padding: '10px 16px 0', flexShrink: 0, position: 'relative', zIndex: 10 }}
          >
            <h1
              id="le-hero-h1"
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
              כל מה שאמא טרייה צריכה- במקום אחד
            </h1>
            <p
              id="le-hero-sub"
              data-hero="subtitle"
              className="anim-fade-up-2"
              style={{ fontSize: 'clamp(0.85rem, 1.7vw, 1.5rem)', color: '#7F5268', margin: '0 auto', fontWeight: 300, maxWidth: '90vw', overflowWrap: 'break-word', wordBreak: 'break-word' }}
            >
              מעקב הריון, מעקב תינוק, ניהול יומי, ותמיכת AI בעברית- כי את לא צריכה להסתדר לבד
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
            { icon: '/icons/baby.svg',  w: 44, h: 40, label: 'מעקב הריון',   sub: 'שבועות, גדלים, בדיקות',   labelId: 'le-feat-0-label', subId: 'le-feat-0-sub' },
            { icon: '/icons/task.svg',  w: 40, h: 37, label: 'מעקב תינוק',   sub: 'האכלות, שינה, חיתולים',   labelId: 'le-feat-1-label', subId: 'le-feat-1-sub' },
            { icon: '/icons/work.svg',  w: 40, h: 40, label: 'AI בעברית',    sub: 'שאלות, ייעוץ, תמיכה',     labelId: 'le-feat-2-label', subId: 'le-feat-2-sub' },
            { icon: '/icons/chat.svg',  w: 42, h: 42, label: 'ניהול יומי',   sub: 'משימות, תזכורות, סדר',    labelId: 'le-feat-3-label', subId: 'le-feat-3-sub' },
          ].map(({ icon, w, h, label, sub, labelId, subId }, i) => (
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
                <p id={labelId} className="font-semibold text-base" style={{ color: '#111' }}>{label}</p>
                <p id={subId} className="text-xs font-light mt-0.5" style={{ color: '#7F5268' }}>{sub}</p>
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
              fontSize: '1.3em',
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
              icon: '🌱',
              title: 'נבנה בשביל אמהות בלבד',
              body: 'לא אפליקציה כללית עם עוד פיצ\'ר לתינוק. כל מה שיש כאן- תוכנן עבור אמא שנמצאת בתחילת הדרך, הריון ואחריה.',
              iconId: 'le-why-0-icon', titleId: 'le-why-0-title', bodyId: 'le-why-0-body',
            },
            {
              icon: '🔗',
              title: 'הכל במקום אחד',
              body: 'הריון, תינוק, יומן ומשימות- בלי לקפוץ בין 5 אפליקציות. רואים הכל בבת אחת, מנהלים בבת אחת.',
              iconId: 'le-why-1-icon', titleId: 'le-why-1-title', bodyId: 'le-why-1-body',
            },
            {
              icon: '🧠',
              title: 'AI שמבין אמא בעברית',
              body: 'שאלות על הריון, עצות לתינוק, עזרה ביומן, תמיכה רגשית- 24/7, בלי שיפוטיות, בשפה שלנו.',
              iconId: 'le-why-2-icon', titleId: 'le-why-2-title', bodyId: 'le-why-2-body',
            },
          ].map(({ icon, title, body, iconId, titleId, bodyId }, i) => (
            <div
              key={title}
              className={`reveal hover-lift rounded-2xl p-7 reveal-delay-${i}`}
              style={{ background: '#fff', border: '1px solid rgba(127,82,104,0.12)' }}
            >
              <span id={iconId} className="text-3xl block mb-4">{icon}</span>
              <h3 id={titleId} className="text-lg font-bold mb-2" style={{ color: '#111' }}>{title}</h3>
              <p id={bodyId} className="text-sm leading-relaxed font-light" style={{ color: '#7F5268' }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          HOW IT HELPS — daily scenarios
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: 'rgba(127,82,104,0.05)' }}>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="reveal text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: '#111' }}>
            איך זה עוזר ביום יום?
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {[
              { emoji: '🤰', title: 'בשבוע 28 להריון',   body: 'בדקי מה גודל התינוק השבוע, מה הבדיקות הקרובות שלך, ושאלי את ה-AI על כל מה שמדאיג אותך.',
                emojiId: 'le-daily-0-emoji', titleId: 'le-daily-0-title', bodyId: 'le-daily-0-body' },
              { emoji: '🌅', title: 'יום אחרי לידה',      body: 'תבצעי רישומים של האכלות, שינה, חיתולים רטובים וכל מה שאת צריכה כדי להיות רגועה.',
                emojiId: 'le-daily-1-emoji', titleId: 'le-daily-1-title', bodyId: 'le-daily-1-body' },
              { emoji: '💤', title: 'נמנום קצר',           body: 'לחצי Start, התינוק קם- לחצי Stop. הנמנום נרשם אוטומטית. את פנויה לנשום.',
                emojiId: 'le-daily-2-emoji', titleId: 'le-daily-2-title', bodyId: 'le-daily-2-body' },
              { emoji: '💜', title: 'רגע של ספק',          body: 'שאלי את ה-AI- "האם זה נורמלי?", "כמה אמורה לאכול?", "מרגישה אבודה"- היא תקשיב.',
                emojiId: 'le-daily-3-emoji', titleId: 'le-daily-3-title', bodyId: 'le-daily-3-body' },
            ].map(({ emoji, title, body, emojiId, titleId, bodyId }, i) => (
              <div
                key={title}
                className={`reveal hover-lift flex gap-4 rounded-2xl p-6 reveal-delay-${i % 2}`}
                style={{ background: '#fff', border: '1px solid rgba(127,82,104,0.1)' }}
              >
                <span id={emojiId} className="text-3xl flex-shrink-0">{emoji}</span>
                <div>
                  <h3 id={titleId} className="font-semibold text-base mb-1" style={{ color: '#111' }}>{title}</h3>
                  <p id={bodyId} className="text-sm font-light leading-relaxed" style={{ color: '#7F5268' }}>{body}</p>
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
          את עושה את הכי טוב שלך וזה הכי טוב לתינוק שלך
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            '"את עושה יותר ממה שאת חושבת שאת עושה"',
            '"לא צריך להיות מושלמת- רק נוכחת"',
            '"הריון ותינוק הם ריצת מרתון- כל צעד קדימה חשוב"',
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
          ABOUT — הסיפור מאחורי המערכת
      ═══════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2
          className="reveal text-3xl md:text-4xl font-bold text-center mb-12"
          style={{ color: '#111' }}
        >
          הסיפור שמאחורי המערכת
        </h2>
        <div
          className="reveal rounded-2xl"
          style={{
            background: '#fff',
            border: '1px solid rgba(127,82,104,0.12)',
            padding: 'clamp(24px, 5vw, 56px)',
            display: 'flex',
            gap: 'clamp(24px, 5vw, 56px)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Photo */}
          <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/eidit.png"
              alt="עידית לאוב"
              style={{
                width: 'clamp(180px, 25vw, 300px)',
                height: 'clamp(180px, 25vw, 300px)',
                objectFit: 'cover',
                borderRadius: '1.25rem',
                border: '3px solid rgba(127,82,104,0.15)',
                boxShadow: '0 8px 32px rgba(127,82,104,0.12)',
              }}
            />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <span
              aria-hidden="true"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: 'clamp(5rem, 10vw, 8rem)',
                lineHeight: 0.7,
                color: '#7F5268',
                opacity: 0.25,
                display: 'block',
                marginBottom: '-0.5rem',
                userSelect: 'none',
              }}
            >
              &#8220;
            </span>
            <p
              style={{
                fontSize: 'clamp(0.95rem, 1.6vw, 1.15rem)',
                lineHeight: 1.85,
                color: '#333',
                fontWeight: 300,
                marginBottom: '1.75rem',
              }}
            >
              כשדור נולדה, הייתי אמא בפעם הראשונה- ומרגישה אבודה לגמרי. רציתי לדעת מה נורמלי,
              רציתי לזכור מתי האכלתי, רציתי מישהי שתענה לי בשלוש בלילה בלי לשפוט. לא מצאתי מקום
              אחד שנותן את כל זה- אז הקמתי אותו. אמא בסדר נולדה מהצורך האמיתי של אמא טרייה: לא
              עוד אפליקציה, אלא כלי שמבין אותך- את ההריון שלך, את התינוק שלך, ואת הכאוס היפה
              הזה שנקרא ימים ראשונים.
            </p>
            <div>
              <p className="font-bold text-base" style={{ color: '#111' }}>עידית לאוב</p>
              <p className="text-sm font-light" style={{ color: '#7F5268' }}>מייסדת אמא בסדר ואמא של דור אורי</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TESTIMONIALS — מה אמהות אומרות
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ background: 'rgba(127,82,104,0.05)', overflow: 'hidden', padding: '80px 0' }}>
        <h2
          className="reveal text-3xl md:text-4xl font-bold text-center mb-12"
          style={{ color: '#111' }}
        >
          מה אמהות אומרות
        </h2>
        <div style={{ overflow: 'hidden', width: '100%' }}>
          <div className="testimonials-track">
            {/* First set — has IDs for editor */}
            {[
              { name: 'נועה כ.',   role: 'אמא טרייה',               stars: 5, quote: '"סוף סוף אני יודעת בכל רגע מה קורה עם התינוק שלי. זה נתן לי שקט אמיתי"',
                nameId: 'le-test-0-name', roleId: 'le-test-0-role', quoteId: 'le-test-0-quote' },
              { name: 'שירלי מ.', role: 'בהריון 32 שבועות',         stars: 5, quote: '"הפסקתי לשאול את גוגל בשלוש בלילה. עכשיו יש לי AI שמבין ולא שופט"',
                nameId: 'le-test-1-name', roleId: 'le-test-1-role', quoteId: 'le-test-1-quote' },
              { name: 'גלית ר.',   role: 'אמא + עצמאית',             stars: 5, quote: '"ניהלתי הריון ועסק במקביל. בלי המערכת הזו הייתי קורסת"',
                nameId: 'le-test-2-name', roleId: 'le-test-2-role', quoteId: 'le-test-2-quote' },
              { name: 'יעל ב.',   role: 'אמא לתאומות',               stars: 5, quote: '"רישום האכלות לשתי תינוקות בלחיצה אחת. שינה לי את החיים"',
                nameId: 'le-test-3-name', roleId: 'le-test-3-role', quoteId: 'le-test-3-quote' },
              { name: 'מיכל ש.',  role: 'אחרי לידה ראשונה',          stars: 5, quote: '"הרגשתי שמישהי בנתה את זה בשבילי בדיוק. לא גנרי בכלל"',
                nameId: 'le-test-4-name', roleId: 'le-test-4-role', quoteId: 'le-test-4-quote' },
              { name: 'אורית ד.', role: '4 חודשים אחרי לידה',        stars: 5, quote: '"הדשבורד הבוקר הוא הדבר הראשון שאני פותחת. כל יום"',
                nameId: 'le-test-5-name', roleId: 'le-test-5-role', quoteId: 'le-test-5-quote' },
            ].map(({ name, role, quote, nameId, roleId, quoteId }, idx) => (
              <div
                key={`a-${idx}`}
                style={{
                  flexShrink: 0,
                  width: '300px',
                  marginInlineEnd: '20px',
                  background: '#fff',
                  borderRadius: '1rem',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(127,82,104,0.1)',
                  border: '1px solid rgba(127,82,104,0.1)',
                }}
              >
                <div style={{ color: '#F5A623', fontSize: '1.1rem', marginBottom: '10px', letterSpacing: '2px' }}>
                  ★★★★★
                </div>
                <p
                  id={quoteId}
                  style={{
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    color: '#333',
                    fontWeight: 300,
                    marginBottom: '16px',
                    fontStyle: 'italic',
                  }}
                >
                  {quote}
                </p>
                <div>
                  <p id={nameId} className="font-semibold text-sm" style={{ color: '#111' }}>{name}</p>
                  <p id={roleId} className="text-xs font-light" style={{ color: '#7F5268' }}>{role}</p>
                </div>
              </div>
            ))}
            {/* Duplicate set for seamless loop — no IDs */}
            {[
              { name: 'נועה כ.',   role: 'אמא טרייה',               stars: 5, quote: '"סוף סוף אני יודעת בכל רגע מה קורה עם התינוק שלי. זה נתן לי שקט אמיתי"' },
              { name: 'שירלי מ.', role: 'בהריון 32 שבועות',         stars: 5, quote: '"הפסקתי לשאול את גוגל בשלוש בלילה. עכשיו יש לי AI שמבין ולא שופט"' },
              { name: 'גלית ר.',   role: 'אמא + עצמאית',             stars: 5, quote: '"ניהלתי הריון ועסק במקביל. בלי המערכת הזו הייתי קורסת"' },
              { name: 'יעל ב.',   role: 'אמא לתאומות',               stars: 5, quote: '"רישום האכלות לשתי תינוקות בלחיצה אחת. שינה לי את החיים"' },
              { name: 'מיכל ש.',  role: 'אחרי לידה ראשונה',          stars: 5, quote: '"הרגשתי שמישהי בנתה את זה בשבילי בדיוק. לא גנרי בכלל"' },
              { name: 'אורית ד.', role: '4 חודשים אחרי לידה',        stars: 5, quote: '"הדשבורד הבוקר הוא הדבר הראשון שאני פותחת. כל יום"' },
            ].map(({ name, role, quote }, idx) => (
              <div
                key={`b-${idx}`}
                style={{
                  flexShrink: 0,
                  width: '300px',
                  marginInlineEnd: '20px',
                  background: '#fff',
                  borderRadius: '1rem',
                  padding: '24px',
                  boxShadow: '0 4px 20px rgba(127,82,104,0.1)',
                  border: '1px solid rgba(127,82,104,0.1)',
                }}
              >
                <div style={{ color: '#F5A623', fontSize: '1.1rem', marginBottom: '10px', letterSpacing: '2px' }}>
                  ★★★★★
                </div>
                <p
                  style={{
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    color: '#333',
                    fontWeight: 300,
                    marginBottom: '16px',
                    fontStyle: 'italic',
                  }}
                >
                  {quote}
                </p>
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#111' }}>{name}</p>
                  <p className="text-xs font-light" style={{ color: '#7F5268' }}>{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="w-full text-center py-20 px-6" style={{ background: '#7F5268' }}>
        <h2
          id="le-cta-heading"
          className="reveal font-display mb-4"
          style={{
            fontSize: 'clamp(3rem, 9vw, 6.5rem)',
            fontFamily: 'var(--font-display)',
            color: '#F7EDE2',
            lineHeight: 1.1,
          }}
        >
          מתחילות?
        </h2>
        <p id="le-cta-sub" className="reveal text-base font-light mb-10" style={{ color: 'rgba(247,237,226,0.7)' }}>
          הצטרפי לאמהות שכבר לא מסתדרות לבד
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

      {/* ═══════════════════════════════════════════════════════════
          PWA INSTALL — "איך מורידים לטלפון"
      ═══════════════════════════════════════════════════════════ */}
      <section id="pwa-install" className="max-w-3xl mx-auto px-6 py-20">
        <h2
          className="reveal text-3xl md:text-4xl font-bold text-center mb-3"
          style={{ color: '#111' }}
        >
          הורידי לטלפון — בלי חנות
        </h2>
        <p className="reveal text-center text-sm font-light mb-3" style={{ color: '#7F5268' }}>
          הוסיפי לדף הבית וזה פועל כמו אפליקציה — חינם, בלחיצה אחת
        </p>

        {/* note: also works on desktop */}
        <div
          className="reveal rounded-2xl p-4 mb-8 flex gap-3 items-start"
          style={{ background: 'rgba(127,82,104,0.07)', border: '1px solid rgba(127,82,104,0.15)' }}
        >
          <span className="text-xl flex-shrink-0">💻</span>
          <p className="text-sm font-light" style={{ color: '#7F5268' }}>
            <strong className="font-semibold">לא חייבים להוריד.</strong>{' '}
            אמא בסדר עובדת ישירות מהדפדפן — במחשב ובטלפון — גם בלי הוספה לדף הבית.
            אם לא הצלחתם, פשוט גשו ל-<strong className="font-semibold">mama-system.vercel.app</strong> מכל דפדפן.
          </p>
        </div>

        <PwaInstallTabs />
      </section>

      <HeroEditor />
      <LandingEditor />

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
