import { readFileSync } from 'fs'
import { join } from 'path'

// Serve the standalone landing page HTML at the root URL.
// The file is pre-built with all assets embedded (fonts, images, JS) as base64 —
// no external dependencies needed.

let cachedHtml: string | null = null

function getLandingHtml(): string {
  if (!cachedHtml) {
    cachedHtml = readFileSync(join(process.cwd(), 'public', 'landing.html'), 'utf-8')
  }
  return cachedHtml
}

export async function GET() {
  return new Response(getLandingHtml(), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
