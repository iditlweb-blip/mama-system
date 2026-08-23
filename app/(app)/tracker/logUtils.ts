import type { BabyLog } from '@/types/database'

// Shared between TrackerClient (timeline rows) and ExportModal (Excel export)
// - kept out of TrackerClient.tsx itself to avoid a circular import between
// the two (ExportModal is imported by TrackerClient for the export button).
const FEED_SIDE_LABEL: Record<string, string> = { left: 'צד שמאל', right: 'צד ימין', both: 'שני הצדדים' }
export const SLEEP_QUALITY_LABEL: Record<string, string> = { light: 'קלה', short: 'קצרה', good: 'טובה' }
export const SLEEP_POSITION_LABEL: Record<string, string> = { stomach: 'על הבטן', back: 'על הגב' }
export const FELL_ASLEEP_BY_LABEL: Record<string, string> = { nursing: 'הנקה', alone: 'לבד', stroller: 'עגלה', arms: 'על הידיים', carrier: 'מנשא', other: 'אחר' }

export function buildLogDescription(log: BabyLog): string {
  if (log.type === 'feed') {
    const parts = []
    if (log.feed_type) parts.push(log.feed_type === 'breast' ? 'שד' : 'בקבוק')
    if (log.feed_type === 'breast') {
      const l = log.feed_left_min ?? 0, r = log.feed_right_min ?? 0
      if (l || r) {
        const sides = []
        if (l) sides.push(`שמאל ${l} דק’`)
        if (r) sides.push(`ימין ${r} דק’`)
        parts.push(sides.join(' + '))
        parts.push(`סה"כ ${l + r} דק’`)
      } else {
        if (log.feed_side) parts.push(FEED_SIDE_LABEL[log.feed_side])
        if (log.duration_min) parts.push(`${log.duration_min} דק’`)
      }
    } else {
      if (log.amount_ml) parts.push(`${log.amount_ml} מ"ל`)
      if (log.duration_min) parts.push(`${log.duration_min} דק’`)
    }
    return `האכלה${parts.length ? ' - ' + parts.join(', ') : ''}`
  }
  if (log.type === 'sleep') {
    const parts = []
    if (log.duration_min) {
      const h = Math.floor(log.duration_min / 60)
      const m = log.duration_min % 60
      parts.push(`${h > 0 ? h + 'ש’ ' : ''}${m > 0 ? m + 'ד’' : ''}`.trim())
    }
    if (log.sleep_quality) parts.push(SLEEP_QUALITY_LABEL[log.sleep_quality])
    if (log.sleep_position) parts.push(SLEEP_POSITION_LABEL[log.sleep_position])
    if (log.fell_asleep_by) parts.push(`נרדם/ה - ${FELL_ASLEEP_BY_LABEL[log.fell_asleep_by]}`)
    return `שינה${parts.length ? ' - ' + parts.join(', ') : ''}`
  }
  if (log.type === 'diaper') {
    const labels = { wet: 'רטוב', dirty: 'מלוכלך', both: 'רטוב + מלוכלך' }
    return `חיתול${log.diaper_type ? ' - ' + labels[log.diaper_type] : ''}`
  }
  if (log.type === 'activity') {
    return `פעילות${log.activity_tags?.length ? ' - ' + log.activity_tags.join(', ') : ''}`
  }
  return ''
}
