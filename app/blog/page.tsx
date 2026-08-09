import type { Metadata } from 'next'
import BlogFeed from '@/components/content/BlogFeed'

export const metadata: Metadata = {
  title: 'בלוג לאימהות טריות',
  description: 'כתבות, טיפים ומדריכים לאימהות טריות - שינה, הנקה, התפתחות התינוק, וטיפול עצמי אחרי לידה.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'בלוג לאימהות טריות · אמא בסדר',
    description: 'כתבות, טיפים ומדריכים לאימהות טריות.',
    type: 'website',
    url: '/blog',
  },
}

// Content changes rarely and is owner-edited - cache the list for an hour.
export const revalidate = 3600

export default function BlogIndexPage() {
  return <BlogFeed basePath="/blog" />
}
