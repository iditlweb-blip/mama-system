// A professional as stored in the `professionals` table (see migration 041).
// Every field except id/name is optional — rows created before 041 only have
// name/title/phone/region.
export interface Professional {
  id: string
  name: string
  title?: string | null
  phone?: string | null
  email?: string | null
  region?: string | null
  category?: string | null
  service_mode?: string | null
  image_url?: string | null
  tagline?: string | null
  about?: string | null
  credentials?: string | null
  services?: string | null          // one service per line
  price_range?: string | null
  response_time?: string | null
  benefit?: string | null
  coupon_code?: string | null
  benefit_terms?: string | null
  benefit_valid_until?: string | null  // YYYY-MM-DD
  instagram?: string | null
  website?: string | null
  facebook?: string | null
  is_active?: boolean | null
  sort_order?: number | null
}

export function servicesList(p: Pick<Professional, 'services'>): string[] {
  return (p.services ?? '').split('\n').map(s => s.trim()).filter(Boolean)
}

// Benefit is shown until the end of its valid-until day (Israel time is close
// enough to the server's date for a day-granularity cutoff).
export function benefitActive(p: Pick<Professional, 'benefit' | 'benefit_valid_until'>): boolean {
  if (!p.benefit?.trim()) return false
  if (!p.benefit_valid_until) return true
  return p.benefit_valid_until >= new Date().toISOString().slice(0, 10)
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

// Pre-filled first message, so the professional knows the lead came from the app.
export const WHATSAPP_INTRO = 'היי, הגעתי דרך האפליקציה של ״אמא בסדר״ 💜'

// 053-4519155 → https://wa.me/972534519155?text=… (strips bidi marks and spaces)
export function whatsappLink(phone: string, text = WHATSAPP_INTRO): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '972' + digits.slice(1)
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function cleanPhone(phone: string): string {
  return phone.replace(/[‎‏‪-‮]/g, '').trim()
}

// Accepts "@handle", "handle" or a full URL.
export function instagramLink(v: string): string {
  const s = v.trim()
  if (/^https?:\/\//.test(s)) return s
  return `https://www.instagram.com/${s.replace(/^@/, '')}`
}

export function instagramHandle(v: string): string {
  const s = v.trim()
  const m = s.match(/instagram\.com\/([^/?#]+)/)
  return '@' + (m ? m[1] : s.replace(/^@/, ''))
}

export function externalLink(v: string): string {
  const s = v.trim()
  return /^https?:\/\//.test(s) ? s : `https://${s}`
}

// Short display form of a URL: drops protocol, www and tracking query strings.
export function displayUrl(v: string): string {
  return v.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('?')[0].replace(/\/$/, '')
}
