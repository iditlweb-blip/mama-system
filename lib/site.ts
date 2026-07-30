// Single source of truth for the public site URL. Used by metadataBase,
// robots.ts, sitemap.ts and canonical/OG tags so every absolute URL points at
// the real domain rather than the legacy Vercel host.
//
// Override in the environment if the primary domain ever changes.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://moms-ok.com'
).replace(/\/$/, '')

export const SITE_NAME = 'אמא בסדר'
export const SITE_DESCRIPTION =
  'אמא בסדר - מערכת ותוכן לאימהות טריות: מעקב תינוק, התפתחות, משימות, בלוג וקהילת שאלות ותשובות.'
