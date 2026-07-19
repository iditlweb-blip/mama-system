'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BabyLog } from '@/types/database'

// A sleep timer whose running state is persisted in localStorage, so it
// survives page refreshes and navigation between screens. All components
// that mount this hook stay in sync via a custom window event (same tab)
// and the native `storage` event (other tabs).
const KEY = 'mama_sleep_timer_start'
const NIGHT_KEY = 'mama_sleep_timer_night'
const EVT = 'mama-sleep-timer-change'

function readStart(): number | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(KEY)
  if (!v) return null
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? null : n
}

function readNight(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(NIGHT_KEY) === '1'
}

export function formatTimer(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function useSleepTimer(userId: string) {
  const supabase = createClient()
  const [startMs, setStartMs] = useState<number | null>(null)
  const [isNight, setIsNight] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [stopping, setStopping] = useState(false)

  // Hydrate from localStorage on mount + subscribe to changes.
  useEffect(() => {
    setStartMs(readStart())
    setIsNight(readNight())
    const sync = () => { setStartMs(readStart()); setIsNight(readNight()) }
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Tick every second while running.
  useEffect(() => {
    if (startMs == null) {
      setElapsed(0)
      return
    }
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startMs])

  // Start the timer. Pass `night: true` for a "night timer" (good for
  // newborns) — the resulting sleep log is tagged `is_night` so it's
  // excluded from the daily nap count and doesn't drive next-nap predictions.
  const start = useCallback((opts?: { night?: boolean }) => {
    const now = Date.now()
    window.localStorage.setItem(KEY, String(now))
    window.localStorage.setItem(NIGHT_KEY, opts?.night ? '1' : '0')
    window.dispatchEvent(new Event(EVT))
    setStartMs(now)
    setIsNight(!!opts?.night)
  }, [])

  // Discard the running timer without recording a log.
  const cancel = useCallback(() => {
    window.localStorage.removeItem(KEY)
    window.localStorage.removeItem(NIGHT_KEY)
    window.dispatchEvent(new Event(EVT))
    setStartMs(null)
    setIsNight(false)
  }, [])

  // Stop the timer and persist a sleep log spanning the elapsed time.
  const stop = useCallback(async (): Promise<BabyLog | null> => {
    const s = readStart()
    if (s == null) return null
    const night = readNight()
    setStopping(true)
    const endMs = Date.now()
    const durationMin = Math.max(1, Math.floor((endMs - s) / 60000))
    window.localStorage.removeItem(KEY)
    window.localStorage.removeItem(NIGHT_KEY)
    window.dispatchEvent(new Event(EVT))
    setStartMs(null)
    setIsNight(false)
    const { data } = await supabase
      .from('baby_logs')
      .insert({
        user_id: userId,
        type: 'sleep',
        start_time: new Date(s).toISOString(),
        end_time: new Date(endMs).toISOString(),
        duration_min: durationMin,
        is_night: night,
      })
      .select()
      .single()
    setStopping(false)
    return (data as BabyLog) ?? null
  }, [supabase, userId])

  return {
    active: startMs != null,
    startMs,
    isNight,
    elapsed,
    stopping,
    start,
    stop,
    cancel,
    formatTimer,
  }
}
