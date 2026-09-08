'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  X, Clock, Baby, Milk, Droplet, Circle, Sparkles, Sunrise, Check,
} from 'lucide-react'
import { BabyLog, LogType } from '@/types/database'
import { getActiveParent, PARENT_LABEL, PARENT_COLOR, type Parent } from '@/lib/activeParent'
import { LOG_ADDED_EVT } from '@/lib/useSleepTimer'
import { TRACKER_ICONS } from './trackerIcons'

// datetime-local inputs expect LOCAL wall-clock time. new Date().toISOString()
// returns UTC, which shifts the value by the timezone offset (e.g. 16:00 →
// 13:00 in Israel summer). Format against the local offset instead.
function toLocalInput(d: Date): string {
  const off = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - off).toISOString().slice(0, 16)
}

const ACTIVITY_TAGS = ['בחוץ', 'משטח פעילות', 'חברים', 'בריכה', 'משפחה'] as const

/**
 * The add/edit form for a single log entry - shared by every entry point into
 * it (the tracker page's own timeline, the dashboard's quick actions, and the
 * global floating "+" button - see QuickAddFab). Fully self-contained: it
 * owns its own field state, inserts/updates the row itself, and broadcasts
 * LOG_ADDED_EVT on success so every mounted screen (not just the one that
 * opened it) picks up the new/changed entry, the same way the sleep timer's
 * stop() already does.
 *
 * Extracted out of the tracker page rather than duplicated a third time - the
 * dashboard had its own near-identical copy of this form before the floating
 * button existed, which is exactly the kind of drift a shared modal prevents.
 */
export default function AddLogModal({ userId, initialType, editingLog, onClose, onSaved }: {
  userId: string
  initialType: LogType
  /** Pass an existing log to edit it in place instead of creating a new one. */
  editingLog?: BabyLog | null
  onClose: () => void
  onSaved?: (log: BabyLog) => void
}) {
  const supabase = createClient()
  const type = editingLog?.type ?? initialType
  const editingId = editingLog?.id ?? null

  const [saving, setSaving] = useState(false)
  const [feedType, setFeedType] = useState<'breast' | 'bottle'>(editingLog?.feed_type === 'bottle' ? 'bottle' : 'breast')
  const [feedLeft, setFeedLeft] = useState(() =>
    editingLog?.feed_left_min != null ? String(editingLog.feed_left_min)
      : (editingLog?.feed_side === 'left' && editingLog?.duration_min ? String(editingLog.duration_min) : ''))
  const [feedRight, setFeedRight] = useState(() =>
    editingLog?.feed_right_min != null ? String(editingLog.feed_right_min)
      : (editingLog?.feed_side === 'right' && editingLog?.duration_min ? String(editingLog.duration_min) : ''))
  const [logBy, setLogBy] = useState<Parent | ''>((editingLog?.logged_by as Parent) ?? getActiveParent() ?? '')
  const [amount, setAmount] = useState(editingLog?.amount_ml != null ? String(editingLog.amount_ml) : '')
  const [duration, setDuration] = useState(editingLog?.duration_min != null ? String(editingLog.duration_min) : '')
  const [wakeTime, setWakeTime] = useState(editingLog?.end_time ? toLocalInput(new Date(editingLog.end_time)) : '')
  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'both'>((editingLog?.diaper_type as 'wet' | 'dirty' | 'both') || 'wet')
  const [activityTags, setActivityTags] = useState<string[]>(editingLog?.activity_tags || [])
  const [sleepQuality, setSleepQuality] = useState<'light' | 'short' | 'good' | ''>(editingLog?.sleep_quality || '')
  const [sleepPosition, setSleepPosition] = useState<'stomach' | 'back' | ''>(editingLog?.sleep_position || '')
  const [fellAsleepBy, setFellAsleepBy] = useState<'nursing' | 'alone' | 'stroller' | 'arms' | 'carrier' | 'other' | ''>(editingLog?.fell_asleep_by || '')
  const [notes, setNotes] = useState(editingLog?.notes || '')
  const [startTime, setStartTime] = useState(() => editingLog ? toLocalInput(new Date(editingLog.start_time)) : toLocalInput(new Date()))

  const { Icon, color, label } = TRACKER_ICONS[type]

  async function saveLog() {
    setSaving(true)
    const payload: Partial<BabyLog> = {
      user_id: userId, type,
      start_time: new Date(startTime).toISOString(),
      notes: notes || null,
      feed_type: null, feed_side: null, feed_left_min: null, feed_right_min: null,
      amount_ml: null, diaper_type: null, activity_tags: null,
      sleep_quality: null, sleep_position: null, fell_asleep_by: null,
      duration_min: null, end_time: null,
      logged_by: logBy || null,
    }
    if (type === 'feed') {
      payload.feed_type = feedType
      if (feedType === 'breast') {
        const l = parseInt(feedLeft) || 0
        const r = parseInt(feedRight) || 0
        payload.feed_left_min = l || null
        payload.feed_right_min = r || null
        payload.feed_side = l && r ? null : l ? 'left' : r ? 'right' : null
        if (l + r > 0) payload.duration_min = l + r
        else if (duration) payload.duration_min = parseInt(duration)
      } else {
        if (amount) payload.amount_ml = parseInt(amount)
        if (duration) payload.duration_min = parseInt(duration)
      }
    }
    if (type === 'diaper') payload.diaper_type = diaperType
    if (type === 'activity') payload.activity_tags = activityTags.length ? activityTags : null
    if (type === 'sleep') {
      payload.sleep_quality = sleepQuality || null
      payload.sleep_position = sleepPosition || null
      payload.fell_asleep_by = fellAsleepBy || null
    }
    if (type === 'sleep' || type === 'activity') {
      if (wakeTime) {
        const start = new Date(startTime)
        const end = new Date(wakeTime)
        if (end.getTime() > start.getTime()) {
          payload.end_time = end.toISOString()
          payload.duration_min = Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
        }
      } else if (duration) {
        payload.duration_min = parseInt(duration)
      }
    }

    const query = editingId
      ? supabase.from('baby_logs').update(payload).eq('id', editingId).select().single()
      : supabase.from('baby_logs').insert(payload).select().single()
    const { data } = await query
    setSaving(false)
    if (data) {
      window.dispatchEvent(new CustomEvent(LOG_ADDED_EVT, { detail: data }))
      onSaved?.(data as BabyLog)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 pb-[calc(64px+env(safe-area-inset-bottom)+1rem)] md:pb-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-sm space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={24} />
            <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{editingId ? 'עריכת' : 'רישום'} {label}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: 'var(--bg)' }}>
            <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-3 h-3" /> {type === 'sleep' ? 'נרדמה בשעה' : 'שעה'}
          </label>
          <div className="flex items-center gap-2">
            <input type="time" value={startTime.slice(11, 16)}
              onChange={e => setStartTime(`${startTime.slice(0, 10)}T${e.target.value}`)}
              className="flex-1 px-3 py-2.5 rounded-xl border text-2xl font-bold text-center outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            <input type="date" value={startTime.slice(0, 10)}
              onChange={e => setStartTime(`${e.target.value}T${startTime.slice(11, 16)}`)}
              className="px-2 py-1.5 rounded-lg border text-xs outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {type === 'feed' && (
          <>
            <div>
              <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>סוג האכלה</label>
              <div className="grid grid-cols-2 gap-2">
                {([['breast', Baby, 'שד'], ['bottle', Milk, 'בקבוק']] as const).map(([ft, FtIcon, lbl]) => (
                  <button key={ft} onClick={() => setFeedType(ft)}
                    className="py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                    style={feedType === ft
                      ? { background: '#7F5268', color: 'white' }
                      : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                    }><FtIcon className="w-3.5 h-3.5" />{lbl}</button>
                ))}
              </div>
            </div>
            {feedType === 'breast' ? (
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>משך לפי צד (דקות)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>שמאל</span>
                    <input type="number" min="0" value={feedLeft} onChange={e => setFeedLeft(e.target.value)} placeholder="0"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
                  <div>
                    <span className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>ימין</span>
                    <input type="number" min="0" value={feedRight} onChange={e => setFeedRight(e.target.value)} placeholder="0"
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                  </div>
                </div>
                {(parseInt(feedLeft) || 0) + (parseInt(feedRight) || 0) > 0 && (
                  <p className="text-xs mt-1.5 font-medium" style={{ color: '#7F5268' }}>
                    סה"כ {(parseInt(feedLeft) || 0) + (parseInt(feedRight) || 0)} דק’
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>כמות (מ"ל)</label>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="120"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>משך (דקות)</label>
                  <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="15"
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                </div>
              </div>
            )}
          </>
        )}

        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>מי מתעד/ת? (לא חובה)</label>
          <div className="grid grid-cols-3 gap-2">
            {([['', 'ללא'], ['mom', PARENT_LABEL.mom], ['dad', PARENT_LABEL.dad]] as const).map(([val, lbl]) => (
              <button key={val || 'none'} type="button" onClick={() => setLogBy(val as Parent | '')}
                className="py-2 rounded-xl text-sm font-medium transition-all"
                style={logBy === val
                  ? (val ? { background: PARENT_COLOR[val as Parent].bg, color: PARENT_COLOR[val as Parent].text, border: `1.5px solid ${PARENT_COLOR[val as Parent].border}` }
                         : { background: '#7F5268', color: 'white' })
                  : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                }>{lbl}</button>
            ))}
          </div>
        </div>

        {(type === 'sleep' || type === 'activity') && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium flex items-center gap-1 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                <Sunrise className="w-3 h-3" /> {type === 'sleep' ? 'התעוררה בשעה (אופציונלי)' : 'שעת סיום (אופציונלי)'}
              </label>
              <div className="flex items-center gap-2">
                <input type="time" value={wakeTime ? wakeTime.slice(11, 16) : ''}
                  onChange={e => {
                    const t = e.target.value
                    if (!t) { setWakeTime(''); return }
                    const datePart = wakeTime ? wakeTime.slice(0, 10) : startTime.slice(0, 10)
                    setWakeTime(`${datePart}T${t}`)
                  }}
                  className="flex-1 px-3 py-2.5 rounded-xl border text-2xl font-bold text-center outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                <input type="date" value={wakeTime ? wakeTime.slice(0, 10) : startTime.slice(0, 10)}
                  onChange={e => {
                    const d = e.target.value
                    const timePart = wakeTime ? wakeTime.slice(11, 16) : ''
                    setWakeTime(timePart ? `${d}T${timePart}` : '')
                  }}
                  className="px-2 py-1.5 rounded-lg border text-xs outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text-muted)' }} />
              </div>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {type === 'sleep' ? 'אם ממלאים - משך השינה יחושב אוטומטית' : 'אם ממלאים - משך הפעילות יחושב אוטומטית'}
              </p>
            </div>
            {type === 'sleep' && !wakeTime && (
              <div>
                <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>משך שינה (דקות)</label>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="90"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              </div>
            )}
            {type === 'sleep' && (
              <>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>איך הייתה השינה? (אופציונלי)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([['light', 'קלה'], ['short', 'קצרה'], ['good', 'טובה']] as const).map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => setSleepQuality(sleepQuality === val ? '' : val)}
                        className="py-2 rounded-xl text-xs font-medium transition-all"
                        style={sleepQuality === val
                          ? { background: '#5C7A6A', color: 'white' }
                          : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                        }>{lbl}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>תנוחת שינה (אופציונלי)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {([['stomach', 'על הבטן'], ['back', 'על הגב']] as const).map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => setSleepPosition(sleepPosition === val ? '' : val)}
                        className="py-2 rounded-xl text-xs font-medium transition-all"
                        style={sleepPosition === val
                          ? { background: '#5C7A6A', color: 'white' }
                          : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                        }>{lbl}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>איך נרדם/ה? (אופציונלי)</label>
                  <div className="flex flex-wrap gap-2">
                    {([['nursing', 'הנקה'], ['alone', 'לבד'], ['stroller', 'עגלה'], ['arms', 'על הידיים'], ['carrier', 'מנשא'], ['other', 'אחר']] as const).map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => setFellAsleepBy(fellAsleepBy === val ? '' : val)}
                        className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                        style={fellAsleepBy === val
                          ? { background: '#5C7A6A', color: 'white' }
                          : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                        }>{lbl}</button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {type === 'diaper' && (
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>סוג חיתול</label>
            <div className="grid grid-cols-3 gap-2">
              {([['wet', Droplet, 'רטוב'], ['dirty', Circle, 'מלוכלך'], ['both', Sparkles, 'שניהם']] as const).map(([dt, DtIcon, lbl]) => (
                <button key={dt} onClick={() => setDiaperType(dt)}
                  className="py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1"
                  style={diaperType === dt
                    ? { background: '#4A7C59', color: 'white' }
                    : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                  }><DtIcon className="w-4 h-4" fill={dt === 'dirty' ? 'currentColor' : 'none'} />{lbl}</button>
              ))}
            </div>
          </div>
        )}

        {type === 'activity' && (
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>סוג הפעילות (אפשר לבחור כמה)</label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TAGS.map(tag => {
                const active = activityTags.includes(tag)
                return (
                  <button key={tag} type="button"
                    onClick={() => setActivityTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                    className="px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={active
                      ? { background: color, color: 'white' }
                      : { background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                    }>{tag}</button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>הערות (אופציונלי)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="הוסיפי הערה..."
            className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
        </div>

        <button onClick={saveLog} disabled={saving}
          className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: color }}>
          {saving ? 'שומרת...' : <><Check className="w-4 h-4" />{editingId ? 'שמירת שינויים' : `שמירת ${label}`}</>}
        </button>
      </div>
    </div>
  )
}
