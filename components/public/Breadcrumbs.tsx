import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export interface Crumb {
  label: string
  /** Omitted on the last crumb - the page you are already on. */
  href?: string
}

/**
 * The trail above an inner page's title. Emits BreadcrumbList JSON-LD alongside
 * the visible trail so search results can show the same path.
 *
 * The separator points LEFT because the page is RTL: the trail reads
 * right-to-left, so each chevron points at the crumb that comes next.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: c.href } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="פירורי לחם"
        style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4,
          fontSize: '0.82rem', color: '#9a8790', marginBottom: 14,
        }}
      >
        {items.map((crumb, i) => {
          const last = i === items.length - 1
          return (
            <span key={`${crumb.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              {i > 0 && <ChevronLeft style={{ width: 13, height: 13, flexShrink: 0, opacity: 0.6 }} />}
              {last || !crumb.href ? (
                <span
                  aria-current={last ? 'page' : undefined}
                  style={{
                    color: '#7F5268', fontWeight: 500,
                    // A long article title shouldn't push the trail onto three
                    // lines - trim it instead.
                    maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} style={{ color: '#9a8790', textDecoration: 'none' }}>
                  {crumb.label}
                </Link>
              )}
            </span>
          )
        })}
      </nav>
    </>
  )
}
