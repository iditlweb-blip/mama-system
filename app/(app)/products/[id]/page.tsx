import Link from 'next/link'
import { notFound } from 'next/navigation'
import BackButton from '@/components/layout/BackButton'
import { createClient } from '@/lib/supabase/server'
import { ShoppingBag, Gift } from 'lucide-react'
import CopyableCoupon from '../CopyableCoupon'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) notFound()

  // Related products: same category, excluding this one.
  const { data: related } = await supabase
    .from('products')
    .select('*')
    .eq('category', product.category ?? 'כללי')
    .neq('id', product.id)
    .order('sort_order')
    .limit(4)

  return (
    <div style={{ padding: 'clamp(20px,3vw,40px)', maxWidth: 820, margin: '0 auto', fontFamily: 'var(--font-body)', direction: 'rtl' }}>
      <div style={{ marginBottom: 20 }}>
        <BackButton href="/products" />
      </div>

      <div style={{
        background: '#fff', borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 2px 20px rgba(127,82,104,0.1)', border: '1px solid rgba(127,82,104,0.08)',
      }}>
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name}
            style={{ width: '100%', height: 'clamp(240px,42vw,400px)', objectFit: 'contain', background: '#fff', display: 'block', padding: 12, boxSizing: 'border-box' }} />
        ) : (
          <div style={{ width: '100%', height: 'clamp(160px,30vw,260px)', background: 'linear-gradient(135deg,#7F5268,#9b6a85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={54} color="#fff" strokeWidth={1.4} />
          </div>
        )}

        <div style={{ padding: 'clamp(20px,3vw,32px)' }}>
          {product.category && (
            <span style={{ display: 'inline-block', fontSize: '0.72rem', fontWeight: 700, color: '#7F5268', background: 'rgba(127,82,104,0.1)', borderRadius: 8, padding: '3px 10px', marginBottom: 12 }}>
              {product.category}
            </span>
          )}
          <h1 style={{ color: '#3a1e2d', fontSize: 'clamp(1.3rem,2.6vw,1.8rem)', fontWeight: 700, margin: '0 0 12px', letterSpacing: '0.02em' }}>
            {product.name}
          </h1>

          {product.description && (
            <p style={{ color: '#555', fontSize: '0.98rem', margin: '0 0 18px', lineHeight: 1.7 }}>
              {product.description}
            </p>
          )}

          {product.details && (
            <div style={{ color: '#444', fontSize: '0.92rem', lineHeight: 1.8, marginBottom: 20, whiteSpace: 'pre-wrap' }}>
              {product.details}
            </div>
          )}

          {product.coupon_code && (
            <div style={{ marginBottom: 20 }}>
              <CopyableCoupon code={product.coupon_code} size="lg" />
            </div>
          )}

          {product.buy_link && (
            <a href={product.buy_link} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: '#7F5268', color: '#fff', borderRadius: 22, padding: '12px 32px',
              fontSize: '0.95rem', textDecoration: 'none', fontWeight: 700, width: '100%',
              boxSizing: 'border-box',
            }}>
              <ShoppingBag size={18} /> לרכישה באתר
            </a>
          )}
        </div>
      </div>

      {/* Related products */}
      {related && related.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <h2 style={{ color: '#7F5268', fontSize: '1.05rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gift size={18} /> מוצרים נוספים באותה קטגוריה
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
            {related.map((r) => (
              <Link key={r.id} href={`/products/${r.id}`} style={{
                textDecoration: 'none', color: 'inherit',
                background: '#fff', borderRadius: 14, padding: 14,
                boxShadow: '0 2px 14px rgba(127,82,104,0.08)',
                border: '1px solid rgba(127,82,104,0.08)',
                display: 'flex', flexDirection: 'column',
              }}>
                {r.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.image_url} alt={r.name}
                    style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
                )}
                <h3 style={{ color: '#3a1e2d', fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{r.name}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
