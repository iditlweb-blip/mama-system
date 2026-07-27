'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, ClipboardList, Stethoscope } from 'lucide-react'
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
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        dir="rtl"
        style={{
          background: 'var(--surface, #fff)', borderRadius: 20, padding: 22,
          maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(127,82,104,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={19} style={{ color: '#7F5268' }} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text, #3a1e2d)' }}>תזכורות</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reminders.map(r => (
            <div key={r.key} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: r.kind === 'exam' ? 'rgba(92,107,160,0.08)' : 'rgba(127,82,104,0.06)',
              border: `1px solid ${r.kind === 'exam' ? 'rgba(92,107,160,0.2)' : 'rgba(127,82,104,0.15)'}`,
              borderRadius: 12, padding: '10px 12px',
            }}>
              {r.kind === 'exam'
                ? <Stethoscope size={17} style={{ color: '#5C6BA0', flexShrink: 0, marginTop: 1 }} />
                : <ClipboardList size={17} style={{ color: '#7F5268', flexShrink: 0, marginTop: 1 }} />}
              <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.5, color: 'var(--text, #3a1e2d)' }}>
                {r.kind === 'exam'
                  ? <>ראיתי שעדיין לא סימנת את הבדיקה <b>{r.text}</b> - כדאי לוודא שלא שכחת לבצע אותה.</>
                  : <>תזכורת: <b>{r.text}</b></>}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={dismiss}
          style={{
            marginTop: 16, width: '100%', padding: '11px', borderRadius: 12, border: 'none',
            background: '#7F5268', color: '#fff', fontSize: '0.9rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <X size={16} /> הבנתי, תודה
        </button>
      </div>
    </div>
  )
}
