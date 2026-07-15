'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Info } from 'lucide-react'
import CopyableCoupon from './CopyableCoupon'

export interface ProductRow {
  id: string
  name: string
  description: string | null
  details: string | null
  category: string | null
  image_url: string | null
  coupon_code: string | null
  buy_link: string | null
  sort_order: number | null
}

export default function ProductsGrid({ products }: { products: ProductRow[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')

  // Distinct categories present in the data (keeps the filter self-maintaining).
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach(p => { if (p.category?.trim()) set.add(p.category.trim()) })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'he'))
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(p => {
      if (category !== 'all' && (p.category?.trim() || 'כללי') !== category) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        (p.details ?? '').toLowerCase().includes(q) ||
        (p.category ?? '').toLowerCase().includes(q)
      )
    })
  }, [products, search, category])

  const chip = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1.5px solid #7F5268',
    background: active ? '#7F5268' : 'transparent',
    color: active ? '#fff' : '#7F5268',
    transition: 'all .2s ease',
    whiteSpace: 'nowrap',
  })

  return (
    <>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={16} color="#7F5268" style={{ position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="חיפוש מוצר..."
          style={{
            width: '100%', padding: '10px 40px 10px 14px', borderRadius: 12,
            border: '1.5px solid rgba(127,82,104,0.25)', fontSize: '0.9rem',
            outline: 'none', background: '#fff', color: '#3a1e2d',
            fontFamily: 'inherit', direction: 'rtl',
          }}
        />
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          <button onClick={() => setCategory('all')} style={chip(category === 'all')}>הכל</button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={chip(category === c)}>{c}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '30px 20px', color: '#999', fontSize: '0.9rem' }}>
          לא נמצאו מוצרים תואמים
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: 18 }}>
          {filtered.map((prod) => (
            <div key={prod.id} style={{
              background: '#fff', borderRadius: 16, padding: 20,
              boxShadow: '0 2px 16px rgba(127,82,104,0.1)',
              border: '1px solid rgba(127,82,104,0.08)',
              display: 'flex', flexDirection: 'column',
            }}>
              <Link href={`/products/${prod.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {prod.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={prod.image_url} alt={prod.name}
                    style={{ width: '100%', height: 180, objectFit: 'contain', background: '#fff', borderRadius: 10, marginBottom: 12, border: '1px solid rgba(127,82,104,0.08)' }} />
                )}
                {prod.category && (
                  <span style={{ display: 'inline-block', fontSize: '0.68rem', fontWeight: 700, color: '#7F5268', background: 'rgba(127,82,104,0.1)', borderRadius: 8, padding: '2px 8px', marginBottom: 8 }}>
                    {prod.category}
                  </span>
                )}
                <h3 style={{ color: '#3a1e2d', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px' }}>{prod.name}</h3>
                {prod.description && (
                  <p style={{ color: '#666', fontSize: '0.83rem', margin: '0 0 10px', lineHeight: 1.5 }}>{prod.description}</p>
                )}
              </Link>

              <div style={{ flex: 1 }} />

              {prod.coupon_code && (
                <div style={{ marginBottom: 10 }}>
                  <CopyableCoupon code={prod.coupon_code} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                {prod.buy_link && (
                  <a href={prod.buy_link} target="_blank" rel="noopener noreferrer" style={{
                    flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: '#7F5268', color: '#fff', borderRadius: 20, padding: '9px 12px',
                    fontSize: '0.83rem', textDecoration: 'none', fontWeight: 600, textAlign: 'center',
                  }}>
                    לרכישה באתר
                  </a>
                )}
                <Link href={`/products/${prod.id}`} style={{
                  flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: 'transparent', color: '#7F5268', border: '1.5px solid #7F5268',
                  borderRadius: 20, padding: '9px 12px', fontSize: '0.83rem',
                  textDecoration: 'none', fontWeight: 600, textAlign: 'center',
                }}>
                  <Info size={15} /> מידע מלא
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
