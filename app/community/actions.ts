'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Reads the signed-in user + her display name. Posting requires a session;
// RLS additionally enforces that user_id matches the caller, so these can't be
// abused to write on someone else's behalf.
async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle()
  const name = (profile?.name as string) || (user.user_metadata?.full_name as string) || 'אמא מהקהילה'
  return { supabase, userId: user.id, name }
}

export async function postQuestion(data: {
  title: string
  body?: string
  category?: string
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const ctx = await currentUser()
  if (!ctx) return { ok: false, error: 'צריך להתחבר כדי לפרסם שאלה' }
  if (!data.title.trim()) return { ok: false, error: 'צריך לכתוב שאלה' }

  const { data: row, error } = await ctx.supabase
    .from('community_questions')
    .insert({
      user_id: ctx.userId,
      author_name: ctx.name,
      title: data.title.trim(),
      body: data.body?.trim() || null,
      category: data.category?.trim() || null,
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'שמירת השאלה נכשלה' }
  revalidatePath('/community')
  return { ok: true, id: row.id }
}

export async function postAnswer(data: {
  questionId: string
  body: string
}): Promise<{ ok: boolean; error?: string }> {
  const ctx = await currentUser()
  if (!ctx) return { ok: false, error: 'צריך להתחבר כדי לענות' }
  if (!data.body.trim()) return { ok: false, error: 'צריך לכתוב תשובה' }

  const { error } = await ctx.supabase
    .from('community_answers')
    .insert({
      question_id: data.questionId,
      user_id: ctx.userId,
      author_name: ctx.name,
      body: data.body.trim(),
    })

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/community/${data.questionId}`)
  revalidatePath('/community')
  return { ok: true }
}
