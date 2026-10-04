import { notFound } from 'next/navigation'
import BackButton from '@/components/layout/BackButton'
import { createClient } from '@/lib/supabase/server'
import ProfessionalCard from '@/components/professionals/ProfessionalCard'
import type { Professional } from '@/components/professionals/types'

// A professional's own page — the full card, reached from the tile on /products.
export default async function ProfessionalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('professionals')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  const pro = data as Professional | null
  if (!pro || pro.is_active === false) notFound()

  return (
    <div style={{ padding: 'clamp(16px,3vw,40px)', maxWidth: 760, margin: '0 auto', fontFamily: 'var(--font-body)', direction: 'rtl' }}>
      <div style={{ marginBottom: 16 }}>
        <BackButton href="/products" />
      </div>
      <ProfessionalCard pro={pro} />
    </div>
  )
}
