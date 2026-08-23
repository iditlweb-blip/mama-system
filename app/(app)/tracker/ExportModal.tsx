'use client'

import { useState } from 'react'
import { X, FileSpreadsheet, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { BabyLog } from '@/types/database'
import { buildLogDescription, SLEEP_QUALITY_LABEL, SLEEP_POSITION_LABEL, FELL_ASLEEP_BY_LABEL } from './logUtils'

// SheetJS (xlsx) is used write-only here - the workbook is built entirely
// from data already fetched from our own DB, never from a user-supplied
// file, so the package's known parsing-side CVEs (prototype pollution /
// ReDoS while reading untrusted spreadsheets) don't apply to this usage.
import * as XLSX from 'xlsx'

const PERIODS = [
  { label: '7 ימים אחרונים', days: 7 },
  { label: '30 ימים אחרונים', days: 30 },
  { label: '3 חודשים אחרונים', days: 90 },
  { label: '6 חודשים אחרונים', days: 180 },
  { label: 'כל הזמן', days: null },
] as const

function heDate(iso: string): string {
  return new Date(iso).toLocaleDateString('he-IL')
}
function heTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}
function whoLabel(v: string | null): string {
  return v === 'mom' ? 'אמא' : v === 'dad' ? 'אבא' : ''
}
// "16:00-18:24" when there's an end time, otherwise just the start time.
function timeRange(l: BabyLog): string {
  return l.end_time ? `${heTime(l.start_time)}-${heTime(l.end_time)}` : heTime(l.start_time)
}

export default function ExportModal({ userId, babyName, onClose }: {
  userId: string; babyName: string | null; onClose: () => void
}) {
  const [days, setDays] = useState<number | null>(30)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleExport() {
    setLoading(true)
    setError('')
    try {
      let query = supabase.from('baby_logs').select('*').eq('user_id', userId).order('start_time', { ascending: true }).limit(10000)
      if (days != null) {
        const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString()
        // Match a log whose start OR end falls in the window, so an overnight
        // sleep that began just before the cutoff isn't dropped.
        query = query.or(`start_time.gte.${since},end_time.gte.${since}`)
      }
      const { data, error: qErr } = await query
      if (qErr) throw qErr
      const logs = (data ?? []) as BabyLog[]
      if (logs.length === 0) {
        setError('אין נתונים לתקופה שנבחרה')
        setLoading(false)
        return
      }

      const wb = XLSX.utils.book_new()

      // ── Combined chronological sheet ──────────────────────────────────
      const allRows = logs.map(l => ({
        'תאריך': heDate(l.start_time),
        'שעה': timeRange(l),
        'סוג': typeLabel(l.type),
        'פרטים': buildLogDescription(l),
        'מי תיעד/ה': whoLabel(l.logged_by),
        'הערות': l.notes || '',
      }))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allRows), 'הכל')

      // ── Sleep ──────────────────────────────────────────────────────────
      const sleepLogs = logs.filter(l => l.type === 'sleep')
      if (sleepLogs.length > 0) {
        const rows = sleepLogs.map(l => ({
          'תאריך': heDate(l.start_time),
          'שעות שינה': timeRange(l),
          'משך': l.duration_min != null ? `${Math.floor(l.duration_min / 60)}:${String(l.duration_min % 60).padStart(2, '0')}` : '',
          'לילה / יום': l.is_night ? 'לילה' : 'יום',
          'איכות שינה': l.sleep_quality ? SLEEP_QUALITY_LABEL[l.sleep_quality] : '',
          'תנוחה': l.sleep_position ? SLEEP_POSITION_LABEL[l.sleep_position] : '',
          'איך נרדם/ה': l.fell_asleep_by ? FELL_ASLEEP_BY_LABEL[l.fell_asleep_by] : '',
          'מי תיעד/ה': whoLabel(l.logged_by),
          'הערות': l.notes || '',
        }))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'שינה')
      }

      // ── Feeds ──────────────────────────────────────────────────────────
      const feedLogs = logs.filter(l => l.type === 'feed')
      if (feedLogs.length > 0) {
        const rows = feedLogs.map(l => {
          const details = l.feed_type === 'breast'
            ? [l.feed_left_min ? `שמאל ${l.feed_left_min} דק'` : '', l.feed_right_min ? `ימין ${l.feed_right_min} דק'` : ''].filter(Boolean).join(' + ')
            : [l.amount_ml ? `${l.amount_ml} מ"ל` : '', l.duration_min ? `${l.duration_min} דק'` : ''].filter(Boolean).join(', ')
          return {
            'תאריך': heDate(l.start_time),
            'שעה': heTime(l.start_time),
            'סוג': l.feed_type === 'breast' ? 'הנקה' : l.feed_type === 'bottle' ? 'בקבוק' : '',
            'פרטים': details,
            'מי תיעד/ה': whoLabel(l.logged_by),
            'הערות': l.notes || '',
          }
        })
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'האכלות')
      }

      // ── Diapers ────────────────────────────────────────────────────────
      const diaperLogs = logs.filter(l => l.type === 'diaper')
      if (diaperLogs.length > 0) {
        const labels = { wet: 'רטוב', dirty: 'מלוכלך', both: 'רטוב + מלוכלך' }
        const rows = diaperLogs.map(l => ({
          'תאריך': heDate(l.start_time),
          'שעה': heTime(l.start_time),
          'סוג': l.diaper_type ? labels[l.diaper_type] : '',
          'מי תיעד/ה': whoLabel(l.logged_by),
          'הערות': l.notes || '',
        }))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'חיתולים')
      }

      // ── Activity ───────────────────────────────────────────────────────
      const activityLogs = logs.filter(l => l.type === 'activity')
      if (activityLogs.length > 0) {
        const rows = activityLogs.map(l => ({
          'תאריך': heDate(l.start_time),
          'שעות': timeRange(l),
          'תגיות': (l.activity_tags ?? []).join(', '),
          'מי תיעד/ה': whoLabel(l.logged_by),
          'הערות': l.notes || '',
        }))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'פעילות')
      }

      const dateStamp = new Date().toISOString().slice(0, 10)
      const safeName = (babyName || 'תינוק').replace(/[\\/:*?"<>|]/g, '')
      XLSX.writeFile(wb, `מעקב-${safeName}-${dateStamp}.xlsx`)
      onClose()
    } catch (err) {
      console.error('[export] failed:', err)
      setError('הייצוא נכשל, נסי שוב')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 pb-[calc(64px+env(safe-area-inset-bottom)+1rem)] md:pb-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" style={{ color: '#4A7C59' }} />
            <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>ייצוא לאקסל</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: 'var(--bg)' }}>
            <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>לאיזו תקופה?</label>
          <div className="grid grid-cols-2 gap-2">
            {PERIODS.map(p => (
              <button key={p.label} type="button" onClick={() => setDays(p.days)}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={days === p.days
                  ? { background: '#4A7C59', color: 'white' }
                  : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }>{p.label}</button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs" style={{ color: '#C0392B' }}>{error}</p>}

        <button onClick={handleExport} disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: '#4A7C59' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          {loading ? 'מכינה קובץ...' : 'הורדת קובץ אקסל'}
        </button>
      </div>
    </div>
  )
}

function typeLabel(type: BabyLog['type']): string {
  return { feed: 'האכלה', sleep: 'שינה', diaper: 'חיתול', activity: 'פעילות' }[type] ?? type
}
