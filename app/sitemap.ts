import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { createAdminClient } from '@/lib/supabase/admin'

// Regenerate at most once an hour - content changes don't need instant sitemap
// updates, and this avoids a DB round-trip on every crawl.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,          lastModified: now, changeFrequency: 'weekly',  priority: 1 },
    { url: `${SITE_URL}/blog`,      lastModified: now, changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${SITE_URL}/community`, lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${SITE_URL}/legal/privacy`,       lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/legal/terms`,         lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/legal/accessibility`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Blog posts + community questions are pulled dynamically. Wrapped in a
  // try/catch so the sitemap keeps working even before those tables exist
  // (migrations are applied manually) or if the DB is briefly unreachable.
  const dynamicRoutes: MetadataRoute.Sitemap = []
  try {
    const admin = createAdminClient()

    const { data: posts } = await admin
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
    for (const p of posts ?? []) {
      dynamicRoutes.push({
        url: `${SITE_URL}/blog/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }

    const { data: questions } = await admin
      .from('community_questions')
      .select('id, created_at')
      .eq('status', 'published')
    for (const q of questions ?? []) {
      dynamicRoutes.push({
        url: `${SITE_URL}/community/${q.id}`,
        lastModified: q.created_at ? new Date(q.created_at) : now,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
  } catch {
    // Tables not migrated yet / transient DB error - ship the static routes.
  }

  return [...staticRoutes, ...dynamicRoutes]
}
