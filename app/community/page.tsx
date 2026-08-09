import type { Metadata } from 'next'
import CommunityFeed from '@/components/content/CommunityFeed'

export const metadata: Metadata = {
  title: 'קהילת שאלות ותשובות לאימהות',
  description: 'מקום לשאול ולענות: שאלות של אימהות טריות על שינה, הנקה, התפתחות והכל שביניהם. קהילה תומכת ובלי שיפוטיות.',
  alternates: { canonical: '/community' },
  openGraph: {
    title: 'קהילת שאלות ותשובות · אמא בסדר',
    description: 'מקום לשאול ולענות. קהילת אימהות תומכת.',
    type: 'website',
    url: '/community',
  },
}

// Community is active - revalidate on a shorter window than the blog.
export const revalidate = 60

export default function CommunityPage() {
  return <CommunityFeed basePath="/community" />
}
