'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Baby, Heart, Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const [babyName, setBabyName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').upsert({
      id: user!.id,
      baby_name: babyName.trim() || null,
      baby_birthdate: birthdate || null,
    })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #FFF7ED, #FCE7F3, #EDE9FE)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#7F5268' }}>
            <Baby className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>ברוכה הבאה! 💜</h1>
          <p style={{ color: 'var(--text-muted)' }}>ספרי לנו קצת על התינוק שלך</p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>שם התינוק/ת</label>
            <input
              type="text"
              value={babyName}
              onChange={e => setBabyName(e.target.value)}
              placeholder="מה השם?"
              className="w-full px-4 py-3 rounded-xl border outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>תאריך לידה</label>
            <input
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl border outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: '#7F5268' }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4 fill-white" />}
            {saving ? 'שומרת...' : 'מתחילים!'}
          </button>

          <button onClick={() => router.push('/dashboard')}
            className="w-full text-sm text-center py-1"
            style={{ color: 'var(--text-muted)' }}>
            דלגי על זה לעכשיו
          </button>
        </div>
      </div>
    </div>
  )
}
