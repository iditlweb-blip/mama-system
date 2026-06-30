import BackButton from '@/components/layout/BackButton'
import { createClient } from '@/lib/supabase/server'

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: professionals } = await supabase
    .from('professionals')
    .select('*')
    .order('sort_order')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('sort_order')

  return (
    <div style={{ padding: 'clamp(20px,3vw,40px)', maxWidth: 900, margin: '0 auto', fontFamily: 'var(--font-body)', direction: 'rtl' }}>
      <div style={{ marginBottom: 20 }}>
        <BackButton href="/dashboard" />
      </div>

      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #7F5268 0%, #9b6a85 100%)',
        borderRadius: 20,
        padding: 'clamp(28px,4vw,48px)',
        textAlign: 'center',
        color: '#fff',
        marginBottom: 36,
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
        <h1 style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700, margin: '0 0 10px', letterSpacing: '0.03em' }}>
          מוצרים ובעלי מקצוע
        </h1>
        <p style={{ fontSize: 'clamp(0.88rem,1.5vw,1rem)', opacity: 0.9, margin: 0, lineHeight: 1.7 }}>
          העמוד הזה בבנייה ויהיה זמין בקרוב 🌸<br/>
          כאן תמצאי המלצות על מוצרים עם קודי קופון בלעדיים<br/>
          ובעלי מקצוע מומלצים לפי אזור
        </p>
      </div>

      {/* ── Professionals ── */}
      {professionals && professionals.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ color: '#7F5268', fontSize: '1.15rem', fontWeight: 700, marginBottom: 16, letterSpacing: '0.03em' }}>
            👩‍⚕️ בעלי מקצוע מומלצים
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 16 }}>
            {professionals.map((pro) => (
              <div key={pro.id} style={{
                background: '#fff',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 2px 16px rgba(127,82,104,0.1)',
                border: '1px solid rgba(127,82,104,0.08)',
              }}>
                {pro.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pro.image_url} alt={pro.name}
                    style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', marginBottom: 12 }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(127,82,104,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 12 }}>
                    👩‍⚕️
                  </div>
                )}
                <h3 style={{ color: '#3a1e2d', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px' }}>{pro.name}</h3>
                {pro.title && <p style={{ color: '#7F5268', fontSize: '0.82rem', margin: '0 0 4px', fontWeight: 500 }}>{pro.title}</p>}
                {pro.region && <p style={{ color: '#999', fontSize: '0.78rem', margin: '0 0 12px' }}>📍 {pro.region}</p>}
                {pro.phone && (
                  <a href={`tel:${pro.phone}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#7F5268', color: '#fff', borderRadius: 20,
                    padding: '7px 16px', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 600,
                  }}>
                    📞 {pro.phone}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Products ── */}
      {products && products.length > 0 && (
        <section>
          <h2 style={{ color: '#7F5268', fontSize: '1.15rem', fontWeight: 700, marginBottom: 16, letterSpacing: '0.03em' }}>
            🎁 מוצרים מומלצים
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: 16 }}>
            {products.map((prod) => (
              <div key={prod.id} style={{
                background: '#fff',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 2px 16px rgba(127,82,104,0.1)',
                border: '1px solid rgba(127,82,104,0.08)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {prod.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={prod.image_url} alt={prod.name}
                    style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />
                )}
                <h3 style={{ color: '#3a1e2d', fontSize: '0.93rem', fontWeight: 700, margin: '0 0 6px' }}>{prod.name}</h3>
                {prod.description && (
                  <p style={{ color: '#666', fontSize: '0.81rem', margin: '0 0 10px', lineHeight: 1.5, flex: 1 }}>{prod.description}</p>
                )}
                {prod.coupon_code && (
                  <div style={{
                    background: 'rgba(127,82,104,0.07)', border: '1.5px dashed #7F5268',
                    borderRadius: 8, padding: '7px 12px',
                    fontSize: '0.8rem', color: '#7F5268', fontWeight: 700,
                    marginBottom: 10, letterSpacing: '0.06em',
                  }}>
                    🏷️ קוד קופון: {prod.coupon_code}
                  </div>
                )}
                {prod.buy_link && (
                  <a href={prod.buy_link} target="_blank" rel="noopener noreferrer" style={{
                    display: 'inline-block', background: '#7F5268', color: '#fff',
                    borderRadius: 20, padding: '8px 20px',
                    fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600,
                    textAlign: 'center',
                  }}>
                    לרכישה →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(!professionals?.length && !products?.length) && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔜</div>
          <p style={{ fontSize: '0.95rem' }}>התוכן יתווסף בקרוב על ידי הצוות שלנו</p>
        </div>
      )}
    </div>
  )
}
