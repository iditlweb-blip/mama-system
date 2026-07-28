'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, ClipboardList, Stethoscope, ChevronDown } from 'lucide-react'
import { STANDARD_TESTS, calcPregnancyWeek } from '@/lib/pregnancy'
import { pushNotification } from '@/lib/notifications'

// In-app reminder popup shown once when the app opens. It surfaces two things:
//  1. Task reminders whose time has arrived (#4) - tasks with remind_at in the
//     past that aren't done and weren't shown yet (tasks.reminded).
//  2. Pregnancy tests whose recommended window has passed but aren't marked
//     done (#11) - a gentle "did you forget?" nudge.
// Task reminders are deduped in the DB (reminded=true once shown). Exam nudges
// are deduped per device in localStorage so they don't nag on every open.

interface Reminder { key: string; kind: 'task' | 'exam'; text: string; taskId?: string }

const EXAM_DISMISS_KEY = 'examRemindersDismissed'

function getDismissedExams(): string[] {
  try { return JSON.parse(localStorage.getItem(EXAM_DISMISS_KEY) || '[]') } catch { return [] }
}

export default function RemindersPopup({ userId, dueDate, trackingType }: {
  userId: string
  dueDate: string | null
  trackingType: 'pregnancy' | 'baby' | null
}) {
  const supabase = createClient()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [visible, setVisible] = useState(false)
  // Accordion state - only the first reminder starts open, the rest collapsed.
  const [openKey, setOpenKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const found: Reminder[] = []

      // 1. Due task reminders.
      const nowIso = new Date().toISOString()
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, remind_at')
        .eq('user_id', userId)
        .not('remind_at', 'is', null)
        .lte('remind_at', nowIso)
        .neq('status', 'done')
        .eq('reminded', false)
      for (const t of (tasks ?? [])) {
        found.push({ key: `task-${t.id}`, kind: 'task', taskId: t.id, text: t.title })
      }

      // 2. Overdue-and-unmarked pregnancy tests.
      if (trackingType === 'pregnancy' && dueDate) {
        const week = calcPregnancyWeek(dueDate)
        const dismissed = getDismissedExams()
        const { data: myTests } = await supabase
          .from('pregnancy_tests')
          .select('test_name, completed')
          .eq('user_id', userId)
        const completedNames = new Set((myTests ?? []).filter(t => t.completed).map(t => t.test_name))
        for (const st of STANDARD_TESTS) {
          if (week >= st.until && !completedNames.has(st.name) && !dismissed.includes(st.name)) {
            found.push({ key: `exam-${st.name}`, kind: 'exam', text: st.name })
          }
        }
      }

      if (!cancelled && found.length > 0) {
        setReminders(found)
        setOpenKey(found[0].key)
        setVisible(true)
        // Also drop them into the bell, so closing the popup without marking
        // them read leaves the red dot waiting in the TopBar.
        for (const r of found) {
          pushNotification(r.key, r.kind === 'exam'
            ? `לא סימנת את הבדיקה: ${r.text}`
            : `תזכורת: ${r.text}`)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [supabase, userId, dueDate, trackingType])

  async function dismiss() {
    // Mark task reminders shown (DB) and exam nudges dismissed (device).
    const taskIds = reminders.filter(r => r.kind === 'task' && r.taskId).map(r => r.taskId!)
    if (taskIds.length) {
      await supabase.from('tasks').update({ reminded: true }).in('id', taskIds)
    }
    const examNames = reminders.filter(r => r.kind === 'exam').map(r => r.text)
    if (examNames.length) {
      try {
        const merged = Array.from(new Set([...getDismissedExams(), ...examNames]))
        localStorage.setItem(EXAM_DISMISS_KEY, JSON.stringify(merged))
      } catch { /* storage disabled - ignore */ }
    }
    setVisible(false)
  }

  if (!visible || reminders.length === 0) return null

  return (
    <div
      onClick={dismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(30,20,26,0.45)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        dir="rtl"
        style={{
          background: 'var(--surface, #fff)', borderRadius: 20, padding: 16,
          maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          // Never taller than the screen - the list itself scrolls, so the
          // backdrop always stays reachable for a tap-outside dismiss.
          maxHeight: 'min(70dvh, 520px)', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(127,82,104,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={17} style={{ color: '#7F5268' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text, #3a1e2d)' }}>
            תזכורות
            {reminders.length > 1 && (
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted, #8a7a80)', marginRight: 6 }}>
                ({reminders.length})
              </span>
            )}
          </h2>
          <button
            onClick={dismiss}
            aria-label="סגירה"
            style={{
              marginRight: 'auto', width: 28, height: 28, borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} style={{ color: 'var(--text-muted, #8a7a80)' }} />
          </button>
        </div>

        {/* Accordion: only one row is expanded at a time, so a long list of
            unmarked tests stays a short, scannable list instead of a wall. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {reminders.map(r => {
            const isOpen = openKey === r.key
            const accent = r.kind === 'exam' ? '#5C6BA0' : '#7F5268'
            return (
              <div key={r.key} style={{
                background: r.kind === 'exam' ? 'rgba(92,107,160,0.06)' : 'rgba(127,82,104,0.05)',
                border: `1px solid ${r.kind === 'exam' ? 'rgba(92,107,160,0.18)' : 'rgba(127,82,104,0.14)'}`,
                borderRadius: 12, overflow: 'hidden',
              }}>
                <button
                  onClick={() => setOpenKey(isOpen ? null : r.key)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 11px', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'right', fontFamily: 'var(--font-body)',
                  }}
                >
                  {r.kind === 'exam'
                    ? <Stethoscope size={15} style={{ color: accent, flexShrink: 0 }} />
                    : <ClipboardList size={15} style={{ color: accent, flexShrink: 0 }} />}
                  <span style={{
                    flex: 1, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text, #3a1e2d)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {r.text}
                  </span>
                  <ChevronDown
                    size={15}
                    style={{
                      color: 'var(--text-muted, #8a7a80)', flexShrink: 0,
                      transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s',
                    }}
                  />
                </button>
                {isOpen && (
                  <p style={{
                    margin: 0, padding: '0 11px 10px 11px', fontSize: '0.8rem',
                    lineHeight: 1.55, color: 'var(--text-muted, #6b5a60)',
                  }}>
                    {r.kind === 'exam'
                      ? <>עדיין לא סימנת את הבדיקה הזו. כדאי לוודא שלא שכחת לבצע אותה, ואם כבר ביצעת - אפשר לסמן אותה בעמוד ההריון.</>
                      : <>הגיע הזמן של המשימה הזו. אפשר לסמן אותה כבוצעה בעמוד המשימות.</>}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={dismiss}
          style={{
            marginTop: 12, width: '100%', padding: '10px', borderRadius: 12, border: 'none',
            background: '#7F5268', color: '#fff', fontSize: '0.87rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)', flexShrink: 0,
          }}
        >
          הבנתי, תודה
        </button>
      </div>
    </div>
  )
}
