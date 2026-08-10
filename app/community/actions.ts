'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendPushToAdmin } from '@/lib/push'
import { sendTelegram, escapeHtml } from '@/lib/telegram'
import { SITE_URL } from '@/lib/site'

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

  // Questions need the owner's approval before they're visible to anyone -
  // status starts at 'pending' (overriding the column's own 'published'
  // default), and only the "Users read own questions" RLS policy (migration
  // 031) lets the asker's own .select() below read the row back.
  const { data: row, error } = await ctx.supabase
    .from('community_questions')
    .insert({
      user_id: ctx.userId,
      title: data.title.trim(),
      body: data.body?.trim() || null,
      category: data.category?.trim() || null,
      status: 'pending',
      ...authorFields(ctx, data.anonymous),
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'שמירת השאלה נכשלה' }
  revalidatePath('/admin')

  // Awaited (not fire-and-forget): on Vercel, a serverless invocation can
  // freeze right after this action's response is sent, killing an unawaited
  // outbound request mid-flight - confirmed as the reason the signup Telegram
  // alert was silently failing. try/catch keeps a notification hiccup from
  // affecting the response to the poster. Both go to the owner only - this is
  // a moderation alert, not the "published" broadcast (see approveQuestion).
  const authorName = data.anonymous ? 'אנונימית' : ctx.name
  try {
    await Promise.allSettled([
      sendPushToAdmin({
        title: 'שאלה חדשה ממתינה לאישור',
        body: data.title.trim(),
        url: '/admin?view=community',
        tag: 'community-question-pending',
      }),
      sendTelegram(
        `📩 <b>שאלה חדשה ממתינה לאישור בקהילה</b>\n\n<b>${escapeHtml(data.title.trim())}</b>` +
        (data.body?.trim() ? `\n${escapeHtml(data.body.trim().slice(0, 200))}` : '') +
        `\n\nמאת: ${escapeHtml(authorName)}` +
        `\n\n<a href="${SITE_URL}/admin?view=community">לאישור בעמוד הניהול</a>`,
      ),
    ])
  } catch (err) {
    console.error('[postQuestion] notify failed:', err)
  }

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
