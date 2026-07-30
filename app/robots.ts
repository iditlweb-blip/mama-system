import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Tells crawlers what to index. Public content (landing, blog, community) is
// open; the logged-in app and API routes are kept out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin',
        '/auth',
        '/onboarding',
        '/dashboard',
        '/tracker',
        '/tasks',
        '/chat',
        '/settings',
        '/personal',
        '/pregnancy',
        '/development',
        '/business',
        '/contractions',
        '/products',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
