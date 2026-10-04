import Link from 'next/link'
import { MapPin, Clock, Monitor, Award, Mail, Globe, Wallet, Ticket, ChevronLeft, Phone } from 'lucide-react'
import {
  type Professional, servicesList, benefitActive, formatDate, whatsappLink, cleanPhone,
  instagramLink, instagramHandle, externalLink, displayUrl,
} from './types'

// Full professional card — the same design as the published social card
// (photo, name, chips, tagline, about + services, benefit band, contacts).
// Used on the products page (inside a modal) and as the live preview in the
// admin edit form. Pure markup, no hooks, so it renders on server or client.

const PURPLE = '#7F5268'
const PURPLE_LIGHT = '#C4A0B4'

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1.2Z" />
    </svg>
  )
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.8c0-.9.3-1.5 1.6-1.5h1.7V4.4c-.3 0-1.3-.1-2.5-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.5V14h2.7v8h3.3Z" />
    </svg>
  )
}

// Profile photo, or the אמא בסדר logo when none was uploaded.
export function ProAvatar({ pro, size, border = 0 }: { pro: Pick<Professional, 'name' | 'image_url'>; size: number | string; border?: number }) {
  return (
    <div className="shrink-0 overflow-hidden rounded-full"
      style={{ width: size, height: size, aspectRatio: '1', border: border ? `${border}px solid #fff` : undefined, background: '#F7EDE2' }}>
      {pro.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pro.image_url} alt={pro.name} className="h-full w-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/logo-new.svg" alt="אמא בסדר" className="h-full w-full object-contain" style={{ padding: '16%' }} />
      )}
    </div>
  )
}

function Chip({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs sm:text-sm font-medium"
      style={{ color: PURPLE }}>
      {icon}{children}
    </span>
  )
}

function ContactButton({ href, icon, label, primary, ltr }: {
  href: string; icon: React.ReactNode; label: string; primary?: boolean; ltr?: boolean
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex min-w-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold no-underline"
      style={primary
        ? { background: PURPLE, color: '#fff' }
        : { background: '#fff', color: PURPLE, border: `1px solid rgba(127,82,104,0.25)` }}>
      <span className="shrink-0">{icon}</span>
      <span className="truncate" dir={ltr ? 'ltr' : undefined}>{label}</span>
    </a>
  )
}

export default function ProfessionalCard({ pro, showExpiredBenefit = false }: {
  pro: Professional
  // Admin preview shows the benefit even after it expired (with a note).
  showExpiredBenefit?: boolean
}) {
  const services = servicesList(pro)
  const active = benefitActive(pro)
  const showBenefit = !!pro.benefit?.trim() && (active || showExpiredBenefit)
  const phone = pro.phone ? cleanPhone(pro.phone) : ''

  return (
    <article dir="rtl" className="relative overflow-hidden rounded-[28px]"
      style={{ background: '#F7EDE2', fontFamily: 'var(--font-body)', color: '#1d1418' }}>
      {/* decorative background */}
      <div aria-hidden className="pointer-events-none absolute rounded-full"
        style={{ width: 360, height: 360, top: -170, left: -130, background: PURPLE_LIGHT, opacity: 0.28 }} />
      <div aria-hidden className="pointer-events-none absolute rounded-full"
        style={{ width: 220, height: 220, top: -90, right: -90, background: '#EEE0D0' }} />

      <div className="relative p-5 sm:p-8">
        {/* Hero: photo + name */}
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-7 sm:text-right">
          <div className="rounded-full" style={{ boxShadow: '0 12px 30px rgba(127,82,104,0.22)' }}>
            <ProAvatar pro={pro} size="clamp(112px, 26vw, 156px)" border={6} />
          </div>
          <div className="min-w-0">
            <h3 className="m-0 leading-tight"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'clamp(2.1rem, 7vw, 3rem)' }}>
              {pro.name}
            </h3>
            {pro.title && (
              <p className="m-0 mt-1 font-semibold" style={{ color: PURPLE, fontSize: 'clamp(1.05rem, 3.4vw, 1.35rem)' }}>
                {pro.title}
              </p>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {pro.region && <Chip icon={<MapPin size={14} />}>{pro.region}</Chip>}
              {pro.service_mode && <Chip icon={<Monitor size={14} />}>{pro.service_mode}</Chip>}
              {pro.response_time && <Chip icon={<Clock size={14} />}>מענה {pro.response_time}</Chip>}
            </div>
          </div>
        </div>

        {pro.tagline && (
          <p className="m-0 mt-6 text-center sm:text-right"
            style={{ fontFamily: 'var(--font-display)', color: PURPLE, fontSize: 'clamp(1.35rem, 4.6vw, 1.75rem)', lineHeight: 1.3 }}>
            ״{pro.tagline.replace(/^["״]|["״]$/g, '')}״
          </p>
        )}

        {/* About + services */}
        {(pro.about || pro.credentials || services.length > 0) && (
          <div className="mt-6 rounded-[24px] bg-white p-5 sm:p-7" style={{ boxShadow: '0 4px 20px rgba(127,82,104,0.07)' }}>
            {(pro.about || pro.credentials) && (
              <section>
                <h4 className="m-0 mb-2 text-base font-semibold" style={{ color: PURPLE }}>קצת עליי</h4>
                {pro.about && (
                  <p className="m-0 whitespace-pre-line text-[0.95rem] leading-relaxed" style={{ color: '#3a2a32' }}>{pro.about}</p>
                )}
                {pro.credentials && (
                  <p className="m-0 mt-3 flex items-start gap-2 text-sm font-semibold" style={{ color: '#3a2a32' }}>
                    <Award size={17} className="mt-0.5 shrink-0" style={{ color: PURPLE }} />{pro.credentials}
                  </p>
                )}
              </section>
            )}

            {services.length > 0 && (
              <section className={(pro.about || pro.credentials) ? 'mt-7' : ''}>
                <h4 className="m-0 mb-3 text-base font-semibold" style={{ color: PURPLE }}>השירותים שלי</h4>
                <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-3 p-0 sm:grid-cols-2">
                  {services.map(s => (
                    <li key={s} className="flex items-center gap-3 text-[0.92rem] leading-snug" style={{ color: '#3a2a32' }}>
                      <span aria-hidden className="shrink-0 rounded-full"
                        style={{ width: 22, height: 22, border: `2px solid ${PURPLE}` }} />
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        {/* Benefit */}
        {showBenefit && (
          <div className="mt-5 rounded-[22px] p-5 text-white sm:px-7" style={{ background: PURPLE }}>
            <div className="flex items-start gap-3">
              <Ticket size={22} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-lg font-semibold leading-snug">{pro.benefit}</p>
                {pro.coupon_code && (
                  <p className="m-0 mt-2 text-sm">
                    קוד קופון:{' '}
                    <span dir="ltr" className="inline-block rounded-lg px-2.5 py-0.5 font-bold tracking-wider"
                      style={{ background: 'rgba(255,255,255,0.18)', border: '1px dashed rgba(255,255,255,0.6)' }}>
                      {pro.coupon_code}
                    </span>
                  </p>
                )}
                <p className="m-0 mt-2 text-xs opacity-85 leading-relaxed">
                  הטבה בלעדית לאמהות אמא בסדר
                  {pro.benefit_valid_until && ` · בתוקף עד ${formatDate(pro.benefit_valid_until)}`}
                  {!active && ' (פג תוקף – לא מוצג באפליקציה)'}
                </p>
                {pro.benefit_terms && <p className="m-0 mt-1 text-xs opacity-75 whitespace-pre-line">{pro.benefit_terms}</p>}
              </div>
            </div>
          </div>
        )}

        {pro.price_range && (
          <p className="m-0 mt-4 flex items-center justify-center gap-2 text-sm sm:justify-start" style={{ color: '#3a2a32' }}>
            <Wallet size={16} style={{ color: PURPLE }} /> טווח מחירים: <strong>{pro.price_range}</strong>
          </p>
        )}

        {/* Contacts */}
        {phone && (
          <a href={whatsappLink(phone)} target="_blank" rel="noopener noreferrer"
            className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-3.5 text-base font-semibold text-white no-underline sm:w-auto sm:inline-flex"
            style={{ background: '#25D366', boxShadow: '0 6px 18px rgba(37,211,102,0.3)' }}>
            <WhatsAppIcon size={22} />
            שליחת הודעה בוואטסאפ
          </a>
        )}

        {(phone || pro.email || pro.instagram || pro.website || pro.facebook) && (
          <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {phone && <ContactButton href={`tel:${phone.replace(/[^\d+]/g, '')}`} icon={<Phone size={17} />} label={phone} ltr />}
            {pro.instagram && <ContactButton href={instagramLink(pro.instagram)} icon={<InstagramIcon />} label={instagramHandle(pro.instagram)} ltr />}
            {pro.website && <ContactButton href={externalLink(pro.website)} icon={<Globe size={18} />} label={displayUrl(pro.website)} ltr />}
            {pro.facebook && <ContactButton href={externalLink(pro.facebook)} icon={<FacebookIcon />} label="פייסבוק" />}
            {pro.email && <ContactButton href={`mailto:${pro.email}`} icon={<Mail size={18} />} label={pro.email} ltr />}
          </div>
        )}
      </div>
    </article>
  )
}

// Compact tile for the products-page grid; links to the professional's page.
export function ProfessionalTile({ pro }: { pro: Professional }) {
  const active = benefitActive(pro)
  return (
    <Link href={`/products/pro/${pro.id}`} dir="rtl"
      className="flex h-full flex-col rounded-2xl bg-white p-5 text-right no-underline transition-shadow hover:shadow-lg"
      style={{ boxShadow: '0 2px 16px rgba(127,82,104,0.1)', border: '1px solid rgba(127,82,104,0.08)', color: 'inherit' }}>
      <div className="flex items-center gap-3">
        <ProAvatar pro={pro} size={64} />
        <div className="min-w-0 flex-1">
          <h3 className="m-0 truncate text-base font-bold" style={{ color: '#3a1e2d' }}>{pro.name}</h3>
          {pro.title && <p className="m-0 mt-0.5 text-sm font-medium" style={{ color: PURPLE }}>{pro.title}</p>}
          {pro.region && (
            <p className="m-0 mt-0.5 flex items-center gap-1 text-xs" style={{ color: '#999' }}>
              <MapPin size={12} /> {pro.region}
            </p>
          )}
        </div>
        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'rgba(127,82,104,0.1)', color: PURPLE }}>
          <ChevronLeft size={20} />
        </span>
      </div>
      {pro.tagline && (
        <p className="m-0 mt-3 line-clamp-2 text-sm leading-relaxed" style={{ color: '#5a4a52' }}>{pro.tagline}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        {active ? (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: 'rgba(127,82,104,0.1)', color: PURPLE }}>
            <Ticket size={13} /> הטבה לאמהות
          </span>
        ) : <span />}
        <span className="inline-flex items-center gap-0.5 text-sm font-semibold" style={{ color: PURPLE }}>
          לכל הפרטים <ChevronLeft size={16} />
        </span>
      </div>
    </Link>
  )
}
