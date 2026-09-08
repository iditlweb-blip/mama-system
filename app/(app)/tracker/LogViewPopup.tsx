import { X, Pencil, Trash2 } from 'lucide-react'
import { BabyLog } from '@/types/database'
import { PARENT_LABEL, PARENT_COLOR } from '@/lib/activeParent'
import { TRACKER_ICONS } from './trackerIcons'
import { buildLogDescription } from './logUtils'

// Read-only view of one log entry, opened by tapping a compact timeline row -
// shared between the daily tab's own timeline and the archive tab's per-sleep
// list, so both open "exactly the same" popup. Shows the full breakdown
// (buildLogDescription, not a row's own single-line summary) plus edit and
// delete actions, since rows themselves don't carry those inline everywhere.
export default function LogViewPopup({ log, onClose, onEdit, onDelete }: {
  log: BabyLog
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { Icon, color, label } = TRACKER_ICONS[log.type]
  const startLabel = new Date(log.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const dateLabel = new Date(log.start_time).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 pb-[calc(64px+env(safe-area-inset-bottom)+1rem)] md:pb-4 bg-black/50"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon size={24} />
            <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>{label}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70" style={{ background: 'var(--bg)' }}>
            <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <p className="text-sm" style={{ color: 'var(--text)' }}>{buildLogDescription(log)}</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{dateLabel}, {startLabel}</p>
        {log.notes && <p className="text-xs rounded-lg p-2" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>{log.notes}</p>}
        {(log.logged_by === 'mom' || log.logged_by === 'dad') && (
          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: PARENT_COLOR[log.logged_by].bg, color: PARENT_COLOR[log.logged_by].text }}>
            {PARENT_LABEL[log.logged_by]}
          </span>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: `${color}1a`, color }}>
            <Pencil className="w-3.5 h-3.5" /> עריכה
          </button>
          <button onClick={onDelete}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
            <Trash2 className="w-3.5 h-3.5" /> מחיקה
          </button>
        </div>
      </div>
    </div>
  )
}
