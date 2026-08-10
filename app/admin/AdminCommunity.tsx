'use client'

import { useState, useTransition } from 'react'
import { Loader2, Trash2, Eye, EyeOff, ExternalLink, MessagesSquare, MessageCircle, Check, X } from 'lucide-react'
import { setQuestionStatus, deleteQuestion, approveQuestion, rejectQuestion } from './actions'

export interface CommunityQuestion {
  id: string
  author_name: string | null
  title: string
  body: string | null
  category: string | null
  status: string
  created_at: string
  community_answers?: { count: number }[]
}

export default function AdminCommunity({ initialQuestions, onToast }: {
  initialQuestions: CommunityQuestion[]
  onToast: (msg: string, ok?: boolean) => void
}) {
  // Pending questions need attention first - surface them above everything else.
  const [questions, setQuestions] = useState(
    [...initialQuestions].sort((a, b) => (a.status === 'pending' ? -1 : 0) - (b.status === 'pending' ? -1 : 0))
  )
  const [isPending, startTransition] = useTransition()

  function toggleHidden(q: CommunityQuestion) {
    const next = q.status === 'hidden' ? 'published' : 'hidden'
    startTransition(async () => {
      const res = await setQuestionStatus(q.id, next)
      if (res.ok) {
        setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, status: next } : x))
        onToast(next === 'hidden' ? 'השאלה הוסתרה' : 'השאלה הוחזרה')
      } else onToast(res.error ?? 'שגיאה', false)
    })
  }

  function approve(q: CommunityQuestion) {
    startTransition(async () => {
      const res = await approveQuestion(q.id)
      if (res.ok) {
        setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, status: 'published' } : x))
        onToast('השאלה פורסמה ונשלחה התראה לכל המשתמשות')
      } else onToast(res.error ?? 'שגיאה', false)
    })
  }

  function reject(q: CommunityQuestion) {
    if (!confirm(`לדחות את השאלה "${q.title}"? היא לא תפורסם, והשואלת תקבל על כך הודעה.`)) return
    startTransition(async () => {
      const res = await rejectQuestion(q.id)
      if (res.ok) { setQuestions(prev => prev.filter(x => x.id !== q.id)); onToast('השאלה נדחתה') }
      else onToast(res.error ?? 'שגיאה', false)
    })
  }

  function remove(q: CommunityQuestion) {
    if (!confirm(`למחוק לצמיתות את השאלה "${q.title}" וכל התשובות עליה?`)) return
    startTransition(async () => {
      const res = await deleteQuestion(q.id)
      if (res.ok) { setQuestions(prev => prev.filter(x => x.id !== q.id)); onToast('נמחק') }
      else onToast(res.error ?? 'שגיאה', false)
    })
  }

  return (
    <div className="card">
      <h2 className="font-bold text-lg flex items-center gap-2 mb-1" style={{ color: 'var(--text)' }}>
        <MessagesSquare className="w-5 h-5" style={{ color: '#7F5268' }} />קהילת שאלות ותשובות
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        שאלה חדשה ממתינה לאישור שלך לפני שהיא מתפרסמת. אחרי אישור כל המשתמשות מקבלות התראה. אפשר גם להסתיר שאלה שכבר פורסמה (הפיך) או למחוק אותה לצמיתות.
      </p>

      <div className="space-y-2">
        {questions.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>אין שאלות עדיין</p>
        ) : questions.map(q => {
          const answerCount = q.community_answers?.[0]?.count ?? 0
          const hidden = q.status === 'hidden'
          const isPendingApproval = q.status === 'pending'
          return (
            <div key={q.id} className="px-4 py-3 rounded-xl border flex items-start justify-between gap-3"
              style={{
                borderColor: isPendingApproval ? '#B8860B' : 'var(--border)',
                background: isPendingApproval ? 'rgba(184,134,11,0.06)' : undefined,
                opacity: hidden ? 0.6 : 1,
              }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{q.title}</p>
                  {isPendingApproval && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(184,134,11,0.15)', color: '#B8860B' }}>ממתינה לאישור</span>
                  )}
                  {hidden && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(192,57,43,0.12)', color: '#C0392B' }}>מוסתר</span>
                  )}
                  {q.category && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{q.category}</span>}
                </div>
                {q.body && <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{q.body}</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>{q.author_name ?? 'אנונימית'}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" />{answerCount}</span>
                  <span>{new Date(q.created_at).toLocaleDateString('he-IL')}</span>
                  {!isPendingApproval && (
                    <a href={`/community/${q.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1" style={{ color: '#7F5268' }}>
                      <ExternalLink className="w-3 h-3" />פתיחה
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isPendingApproval ? (
                  <>
                    <button onClick={() => approve(q)} disabled={isPending} title="אישור ופרסום"
                      className="p-1.5 rounded-lg" style={{ background: 'rgba(74,124,89,0.12)', color: '#4A7C59' }}>
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => reject(q)} disabled={isPending} title="דחייה"
                      className="p-1.5 rounded-lg" style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => toggleHidden(q)} disabled={isPending} title={hidden ? 'הצגה' : 'הסתרה'}
                      className="p-1.5 rounded-lg" style={{ background: 'rgba(127,82,104,0.1)', color: '#7F5268' }}>
                      {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => remove(q)} disabled={isPending} title="מחיקה"
                      className="p-1.5 rounded-lg" style={{ background: 'rgba(192,57,43,0.1)', color: '#C0392B' }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
