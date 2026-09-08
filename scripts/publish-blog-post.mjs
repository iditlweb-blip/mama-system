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
// Reads:  content/next-post.json
//   { title, slug, excerpt, category, body, imagePath,
//     inlineImages?: [{ path: "content/.tmp-inline-1.png", token: "IMG1" }] }
// Needs:  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
//
// Body placeholders resolved before insert (see also blog-topics content rules):
//   cid:<token>                                 -> public URL of inlineImages[token]
//   <!--WHATSAPP_CTA_START-->...<!--WHATSAPP_CTA_END-->
//     kept (with {{WHATSAPP_GROUP_URL}} filled in) only if app_settings.whatsapp_group.visible
//     is true; stripped entirely otherwise so the article never shows a dead CTA.
//   <!--PRODUCTS_PROMO_START-->...<!--PRODUCTS_PROMO_END-->
//     kept only if app_settings.products_enabled is true; stripped otherwise.
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

// ── Upload inline in-body images (optional) ──────────────────────────────────
let body = String(post.body)
for (const img of post.inlineImages || []) {
  if (!img?.path || !img?.token) fail('כל inlineImages צריך path ו-token')
  const imgPath = resolve(ROOT, img.path)
  if (!existsSync(imgPath)) fail(`תמונה פנימית לא נמצאה: ${imgPath}`)
  const bytes = readFileSync(imgPath)
  const ext = (imgPath.split('.').pop() || 'jpg').toLowerCase()
  const storagePath = `generated/${slug}-inline-${img.token}-${Date.now()}.${ext}`
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'
  const { error: upErr } = await admin.storage.from('blog-images')
    .upload(storagePath, bytes, { upsert: true, contentType })
  if (upErr) fail(`העלאת תמונה פנימית (${img.token}) נכשלה: ${upErr.message}`)
  const { data: pub } = admin.storage.from('blog-images').getPublicUrl(storagePath)
  body = body.replaceAll(`cid:${img.token}`, pub.publicUrl)
}

// ── Resolve dynamic CTA blocks against live app settings ─────────────────────
// Never publish a WhatsApp/products CTA that points at something turned off.
const { data: settingsRows } = await admin.from('app_settings')
  .select('key, value').in('key', ['whatsapp_group', 'products_enabled'])
const settings = Object.fromEntries((settingsRows || []).map((r) => [r.key, r.value]))
const waUrl = settings.whatsapp_group?.visible ? settings.whatsapp_group.url : null
const productsOn = settings.products_enabled === true

body = body.replace(/<!--WHATSAPP_CTA_START-->([\s\S]*?)<!--WHATSAPP_CTA_END-->/g, (_, inner) =>
  waUrl ? inner.replaceAll('{{WHATSAPP_GROUP_URL}}', waUrl) : ''
)
// Stray token with no wrapping block: fall back to the community page rather than a dead link.
body = body.replaceAll('{{WHATSAPP_GROUP_URL}}', waUrl || '/community')

body = body.replace(/<!--PRODUCTS_PROMO_START-->([\s\S]*?)<!--PRODUCTS_PROMO_END-->/g, (_, inner) =>
  productsOn ? inner : ''
)
body = body.trim()

// ── Insert the DRAFT row ─────────────────────────────────────────────────────
const { data: row, error } = await admin.from('blog_posts').insert({
  slug,
  title: String(post.title).trim(),
  excerpt: post.excerpt ? String(post.excerpt).trim() : null,
  body,
  category: post.category ? String(post.category).trim() : null,
  cover_image_url: coverUrl,
  status: 'draft',
}).select('id, slug, title').single()

if (error) fail(`הכנסת הטיוטה נכשלה: ${error.message}`)

console.log(JSON.stringify({ ok: true, ...row, cover_image_url: coverUrl }))
