'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Records how long the user spends on each page.
 * Mount once in the (app) layout — it auto-tracks on every navigation.
 */
export default function PageTimeTracker() {
  const pathname   = usePathname()
  const startRef   = useRef<number>(Date.now())
  const pageRef    = useRef<string>(pathname)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Flush the current page's time to the DB
  async function flush(page: string, startMs: number) {
    const duration = Math.round((Date.now() - startMs) / 1000)
    if (duration < 3) return // ignore very short visits
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_analytics').insert({
      user_id: duration > 0 ? user.id : user.id,
      page,
      duration_seconds: duration,
    })
  }

  // On page change — flush old page
  useEffect(() => {
    const prevPage  = pageRef.current
    const prevStart = startRef.current

    if (prevPage !== pathname) {
      flush(prevPage, prevStart)
      pageRef.current  = pathname
      startRef.current = Date.now()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // On tab close / navigate away
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flush(pageRef.current, startRef.current)
        startRef.current = Date.now() // reset so we don't double-count on return
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      flush(pageRef.current, startRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
