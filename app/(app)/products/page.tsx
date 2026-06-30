import BackButton from '@/components/layout/BackButton'
import { createClient } from '@/lib/supabase/server'

export default async function ProductsPage() {
  const supabase = await createClient()

  // Fetch professionals (may be empty)
  const { data: professionals } = await supabase
    .from('professionals')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return (
    <div style={{ padding: 'clamp(20px,3vw,40px)', maxWidth: 900, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <div style={{ marginBottom: 20 }}>
        <BackButton href="/dashboard" />
      </div>

      {/* Under construction banner */}
      <div style={{
        background: 'linear-gradient(135deg, #7F5268 0%, #9b6a85 100%)',
        borderRadius: 20,
        padding: 'clamp(28px,4vw,48px)',
        textAlign: 'center',
        color: '#fff',
        marginBottom: 32,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏗️</div>
        <h1 style={{ fontSize: 'clamp(1.5rem,2.5vw,2rem)', fontWeight: 600, margin: '0 0 10px', letterSpacing: '0.04em' }}>
          מוצרים ובעלי מקצוע
        </h1>
        <p style={{ fontSize: 'clamp(0.9rem,1.5vw,1.1rem)', opacity: 0.9, margin: 0, lineHeight: 1.7, letterSpacing: '0.03em' }}>
          העמוד הזה בבנייה ויהיה זמין בקרוב 🌸<br/>
          כאן תמצאי המלצות על מוצרים לתינוק עם קודי קופון בלעדיים,<br/>
          ובעלי מקצוע מומלצים לפי אזור.
        </p>
      </div>

      {/* Professionals section */}
      {professionals && professionals.length > 0 ? (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ color: '#7F5268', fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, letterSpacing: '0.04em' }}>
            בעלי מקצוע מומלצים
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {professionals.map((pro) => (
              <div key={pro.id} style={{
                background: '#fff',
                borderRadius: 16,
                padding: '20px',
                boxShadow: '0 2px 12px rgba(127,82,104,0.1)',
              }}>
                {pro.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pro.image_url} alt={pro.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />
                )}
                <h3 style={{ color: '#3a1e2d', fontSize: '1rem', fontWeight: 600, margin: '0 0 4px' }}>{pro.name}</h3>
                <p style={{ color: '#7F5268', fontSize: '0.85rem', margin: '0 0 4px' }}>{pro.specialty}</p>
                <p style={{ color: '#888', fontSize: '0.8rem', margin: '0 0 12px' }}>{pro.city ? `${pro.city}, ` : ''}{pro.region}</p>
                {pro.phone && (
                  <a href={`tel:${pro.phone}`} style={{
                    display: 'inline-block',
                    background: '#7F5268',
                    color: '#fff',
                    borderRadius: 20,
                    padding: '6px 16px',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}>
                    📞 {pro.phone}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Products section */}
      {products && products.length > 0 ? (
        <section>
          <h2 style={{ color: '#7F5268', fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, letterSpacing: '0.04em' }}>
            מוצרים מומלצים
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
            {products.map((prod) => (
              <div key={prod.id} style={{
                background: '#fff',
                borderRadius: 16,
                padding: '20px',
                boxShadow: '0 2px 12px rgba(127,82,104,0.1)',
              }}>
                {prod.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />
                )}
                <h3 style={{ color: '#3a1e2d', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 6px' }}>{prod.name}</h3>
                {prod.description && <p style={{ color: '#666', fontSize: '0.82rem', margin: '0 0 10px', lineHeight: 1.5 }}>{prod.description}</p>}
                {prod.coupon_code && (
                  <div style={{
                    background: 'rgba(127,82,104,0.08)',
                    border: '1px dashed #7F5268',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    color: '#7F5268',
                    fontWeight: 600,
                    marginBottom: 10,
                    letterSpacing: '0.05em',
                  }}>
                    קוד קופון: {prod.coupon_code}
                  </div>
                )}
                {prod.buy_url && (
                  <a href={prod.buy_url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-block',
                    background: '#7F5268',
                    color: '#fff',
                    borderRadius: 20,
                    padding: '8px 20px',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}>
                    לרכישה →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
