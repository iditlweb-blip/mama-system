import BackButton from '@/components/layout/BackButton'
import { createClient } from '@/lib/supabase/server'
import { ShoppingBag, Stethoscope, MapPin, Phone, Gift, Sparkles } from 'lucide-react'
import ProductsGrid from './ProductsGrid'

export default async function ProductsPage() {
  const supabase = await createClient()

  // Feature toggle — admins turn the products page on from the admin panel.
  // Until then (or if the setting is missing) the page shows a "coming soon"
  // placeholder instead of the products/professionals content.
  const { data: setting } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'products_enabled')
    .maybeSingle()
  const productsEnabled = setting?.value === true

  if (!productsEnabled) {
    return (
      <div style={{ padding: 'clamp(20px,3vw,40px)', maxWidth: 1040, margin: '0 auto', fontFamily: 'var(--font-body)', direction: 'rtl' }}>
        <div style={{ marginBottom: 20 }}>
          <BackButton href="/dashboard" />
        </div>
        <div style={{ textAlign: 'center', padding: 'clamp(48px,10vw,96px) 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(127,82,104,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={34} color="#7F5268" strokeWidth={1.6} />
            </div>
          </div>
          <h1 style={{ color: '#7F5268', fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 700, margin: '0 0 12px' }}>
            בקרוב כאן
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.95rem,2.5vw,1.1rem)', lineHeight: 1.7, maxWidth: 460, margin: '0 auto' }}>
            בהמשך נוסיף כאן מוצרים נבחרים ואנשי מקצוע מומלצים שילוו וייעזרו לך במסע האימהות. יש למה לחכות 💜
          </p>
        </div>
      </div>
    )
  }

  const { data: professionals } = await supabase
    .from('professionals')
    .select('*')
    .order('sort_order')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('sort_order')

  return (
    <div style={{ padding: 'clamp(20px,3vw,40px)', maxWidth: 1040, margin: '0 auto', fontFamily: 'var(--font-body)', direction: 'rtl' }}>
      <div style={{ marginBottom: 20 }}>
        <BackButton href="/dashboard" />
      </div>

      {/* Banner — compact */}
      <div style={{
        background: 'linear-gradient(135deg, #7F5268 0%, #9b6a85 100%)',
        borderRadius: 16,
        padding: '16px 20px',
        color: '#fff',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <div style={{ flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)' }}>
          <ShoppingBag size={24} color="#fff" strokeWidth={1.7} />
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(1.05rem,2vw,1.3rem)', fontWeight: 700, margin: '0 0 2px', letterSpacing: '0.02em' }}>
            מוצרים ובעלי מקצוע
          </h1>
          <p style={{ fontSize: '0.82rem', opacity: 0.9, margin: 0, lineHeight: 1.5 }}>
            המלצות על מוצרים עם קודי קופון בלעדיים ובעלי מקצוע לפי אזור
          </p>
        </div>
      </div>

      {/* ── Professionals ── */}
      {professionals && professionals.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ color: '#7F5268', fontSize: '1.15rem', fontWeight: 700, marginBottom: 16, letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Stethoscope size={20} /> בעלי מקצוע מומלצים
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
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(127,82,104,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Stethoscope size={26} color="#7F5268" strokeWidth={1.6} />
                  </div>
                )}
                <h3 style={{ color: '#3a1e2d', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px' }}>{pro.name}</h3>
                {pro.title && <p style={{ color: '#7F5268', fontSize: '0.82rem', margin: '0 0 4px', fontWeight: 500 }}>{pro.title}</p>}
                {pro.region && (
                  <p style={{ color: '#999', fontSize: '0.78rem', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={13} /> {pro.region}
                  </p>
                )}
                {pro.phone && (
                  <a href={`tel:${pro.phone}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#7F5268', color: '#fff', borderRadius: 20,
                    padding: '7px 16px', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 600,
                  }}>
                    <Phone size={13} /> {pro.phone}
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
          <h2 style={{ color: '#7F5268', fontSize: '1.15rem', fontWeight: 700, marginBottom: 16, letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Gift size={20} /> מוצרים מומלצים
          </h2>
          <ProductsGrid products={products} />
        </section>
      )}

      {/* Empty state */}
      {(!professionals?.length && !products?.length) && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Sparkles size={40} color="#c9a8b8" strokeWidth={1.5} />
          </div>
          <p style={{ fontSize: '0.95rem' }}>התוכן יתווסף בקרוב על ידי הצוות שלנו</p>
        </div>
      )}
    </div>
  )
}
