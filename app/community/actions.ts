'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendPushToAdmin } from '@/lib/push'

// Reads the signed-in user + her display name. Posting requires a session;
// RLS additionally enforces that user_id matches the caller, so these can't be
// abused to write on someone else's behalf.
async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('name, profile_picture_url').eq('id', user.id).maybeSingle()
  const name = (profile?.name as string) || (user.user_metadata?.full_name as string) || 'אמא מהקהילה'
  const avatar = (profile?.profile_picture_url as string) || null
  return { supabase, userId: user.id, name, avatar }
}

// Resolves how the author is shown. Anonymous hides name + avatar; otherwise we
// denormalize the profile picture onto the row so anon reads can render it.
function authorFields(ctx: { name: string; avatar: string | null }, anonymous?: boolean) {
  return anonymous
    ? { author_name: 'אנונימית', author_avatar_url: null, is_anonymous: true }
    : { author_name: ctx.name, author_avatar_url: ctx.avatar, is_anonymous: false }
}

export async function postQuestion(data: {
  title: string
  body?: string
  category?: string
  anonymous?: boolean
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const ctx = await currentUser()
  if (!ctx) return { ok: false, error: 'צריך להתחבר כדי לפרסם שאלה' }
  if (!data.title.trim()) return { ok: false, error: 'צריך לכתוב שאלה' }

  const { data: row, error } = await ctx.supabase
    .from('community_questions')
    .insert({
      user_id: ctx.userId,
      title: data.title.trim(),
      body: data.body?.trim() || null,
      category: data.category?.trim() || null,
      ...authorFields(ctx, data.anonymous),
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'שמירת השאלה נכשלה' }
  // The website (/community) and the in-app mirror (/content/community) show
  // the exact same data - both need revalidating so a post made from either
  // surface shows up immediately on both.
  revalidatePath('/community')
  revalidatePath('/content/community')

  // Fire-and-forget: never let a push failure affect the response to the poster.
  sendPushToAdmin({
    title: 'שאלה חדשה בקהילה',
    body: data.title.trim(),
    url: `/content/community/${row.id}`,
    tag: 'community-question',
  }).catch(() => {})

  return { ok: true, id: row.id }
}

export async function postAnswer(data: {
  questionId: string
  body: string
  anonymous?: boolean
}): Promise<{ ok: boolean; error?: string }> {
  const ctx = await currentUser()
  if (!ctx) return { ok: false, error: 'צריך להתחבר כדי לענות' }
  if (!data.body.trim()) return { ok: false, error: 'צריך לכתוב תשובה' }

  const { error } = await ctx.supabase
    .from('community_answers')
    .insert({
      question_id: data.questionId,
      user_id: ctx.userId,
      body: data.body.trim(),
      ...authorFields(ctx, data.anonymous),
    })

  if (error) return { ok: false, error: error.message }
  revalidatePath(`/community/${data.questionId}`)
  revalidatePath('/community')
  revalidatePath(`/content/community/${data.questionId}`)
  revalidatePath('/content/community')
  return { ok: true }
}
