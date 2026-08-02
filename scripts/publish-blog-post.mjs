#!/usr/bin/env node
// Publishes a blog post as a DRAFT to Supabase, from a payload the weekly
// automation writes to content/next-post.json.
//
// It uploads the cover image to the `blog-images` storage bucket and inserts a
// row into `blog_posts` with status='draft' (so it stays hidden from the public
// blog until the owner approves it in the admin panel). Uses the service-role
// key, which bypasses RLS.
//
// Usage:  node scripts/publish-blog-post.mjs
// Reads:  content/next-post.json  { title, slug, excerpt, category, body, imagePath }
// Needs:  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
//
// Prints a JSON line with the created draft's id/slug/title on success.

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Load .env.local (Node doesn't do this automatically) ─────────────────────
function loadEnv() {
  const p = join(ROOT, '.env.local')
  if (!existsSync(p)) return
  for (const raw of readFileSync(p, 'utf8').split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).replace(/^export\s+/, '').trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}
loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function fail(msg) { console.error(`\n[publish-blog-post] ${msg}\n`); process.exit(1) }

if (!SUPABASE_URL) fail('חסר NEXT_PUBLIC_SUPABASE_URL ב-.env.local')
if (!SERVICE_KEY) fail('חסר SUPABASE_SERVICE_ROLE_KEY ב-.env.local - הוסיפי אותו (יש לך אותו בהגדרות הפרויקט בוורסל / ב-Supabase Settings > API).')

// Keeps Hebrew letters and digits, turns everything else into single hyphens.
function slugify(input) {
  return String(input).trim().toLowerCase()
    .replace(/['"״׳]/g, '')
    .replace(/[^a-z0-9֐-׿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Read the payload the automation produced ─────────────────────────────────
const payloadPath = join(ROOT, 'content', 'next-post.json')
if (!existsSync(payloadPath)) fail(`לא נמצא ${payloadPath} - צרי אותו לפני ההרצה.`)
let post
try { post = JSON.parse(readFileSync(payloadPath, 'utf8')) }
catch (e) { fail(`content/next-post.json לא תקין: ${e.message}`) }

for (const f of ['title', 'body']) {
  if (!post[f] || !String(post[f]).trim()) fail(`חסר שדה חובה: ${f}`)
}

// ── Ensure a unique slug ─────────────────────────────────────────────────────
let baseSlug = slugify(post.slug || post.title) || `post-${Date.now()}`
let slug = baseSlug
for (let i = 2; i < 50; i++) {
  const { data } = await admin.from('blog_posts').select('id').eq('slug', slug).maybeSingle()
  if (!data) break
  slug = `${baseSlug}-${i}`
}

// ── Upload the cover image (optional) ────────────────────────────────────────
let coverUrl = null
if (post.imagePath) {
  const imgPath = resolve(ROOT, post.imagePath)
  if (!existsSync(imgPath)) fail(`תמונה לא נמצאה: ${imgPath}`)
  const bytes = readFileSync(imgPath)
  const ext = (imgPath.split('.').pop() || 'jpg').toLowerCase()
  const storagePath = `generated/${slug}-${Date.now()}.${ext}`
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'
  const { error: upErr } = await admin.storage.from('blog-images')
    .upload(storagePath, bytes, { upsert: true, contentType })
  if (upErr) fail(`העלאת התמונה נכשלה: ${upErr.message} (ודאי שהרצת את מיגרציה 026_blog_images.sql)`)
  const { data: pub } = admin.storage.from('blog-images').getPublicUrl(storagePath)
  coverUrl = pub.publicUrl
}

// ── Insert the DRAFT row ─────────────────────────────────────────────────────
const { data: row, error } = await admin.from('blog_posts').insert({
  slug,
  title: String(post.title).trim(),
  excerpt: post.excerpt ? String(post.excerpt).trim() : null,
  body: String(post.body),
  category: post.category ? String(post.category).trim() : null,
  cover_image_url: coverUrl,
  status: 'draft',
}).select('id, slug, title').single()

if (error) fail(`הכנסת הטיוטה נכשלה: ${error.message}`)

console.log(JSON.stringify({ ok: true, ...row, cover_image_url: coverUrl }))
