'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { BabyLog } from '@/types/database'

// A sleep timer whose running state is persisted BOTH in localStorage (a
// fast local cache that survives refresh/navigation and syncs instantly
// across tabs) AND in the `active_sleep_timers` DB table (the cross-device
// source of truth, so the WhatsApp bot can start/stop the same timer). On
// mount and periodically we reconcile against the DB, so a timer started
// from WhatsApp appears in the app and vice-versa.
const KEY = 'mama_sleep_timer_start'
const NIGHT_KEY = 'mama_sleep_timer_night'
const EVT = 'mama-sleep-timer-change'
// Broadcast when stop() records a new sleep log, so any mounted screen
// (tracker, dashboard) can add it to its list immediately — even when the
// timer was stopped from the always-mounted global bar, not that screen.
export const LOG_ADDED_EVT = 'mama-baby-log-added'
const DB_POLL_MS = 15000

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

  // Write the local cache + notify every mounted hook instance in this tab.
  const writeLocal = useCallback((start: number | null, night: boolean) => {
    if (start == null) {
      window.localStorage.removeItem(KEY)
      window.localStorage.removeItem(NIGHT_KEY)
    } else {
      window.localStorage.setItem(KEY, String(start))
      window.localStorage.setItem(NIGHT_KEY, night ? '1' : '0')
    }
    window.dispatchEvent(new Event(EVT))
    setStartMs(start)
    setIsNight(night)
  }, [])

  // Reconcile against the DB (the cross-device source of truth). Picks up a
  // timer the WhatsApp bot started, or clears one the bot stopped.
  const syncFromDb = useCallback(async () => {
    const { data } = await supabase
      .from('active_sleep_timers')
      .select('start_time, is_night')
      .eq('user_id', userId)
      .maybeSingle()
    if (data?.start_time) {
      const ms = new Date(data.start_time).getTime()
      if (ms !== readStart() || !!data.is_night !== readNight()) {
        writeLocal(ms, !!data.is_night)
      }
    } else if (readStart() != null) {
      // Only clear the local cache from the DB when we're confident the DB
      // has caught up — the row is written synchronously on start() below.
      writeLocal(null, false)
    }
  }, [supabase, userId, writeLocal])

  // Hydrate from localStorage on mount + subscribe to changes, then confirm
  // against the DB and keep polling it while mounted.
  useEffect(() => {
    setStartMs(readStart())
    setIsNight(readNight())
    const sync = () => { setStartMs(readStart()); setIsNight(readNight()) }
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', sync)
    syncFromDb()
    const onFocus = () => syncFromDb()
    window.addEventListener('focus', onFocus)
    const id = setInterval(syncFromDb, DB_POLL_MS)
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', onFocus)
      clearInterval(id)
    }
  }, [syncFromDb])

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
    const night = !!opts?.night
    writeLocal(now, night)
    // Mirror to the DB so the WhatsApp bot sees the same running timer.
    supabase.from('active_sleep_timers').upsert({
      user_id: userId,
      start_time: new Date(now).toISOString(),
      is_night: night,
      source: 'app',
    }).then(() => {})
  }, [supabase, userId, writeLocal])

  // Discard the running timer without recording a log.
  const cancel = useCallback(() => {
    writeLocal(null, false)
    supabase.from('active_sleep_timers').delete().eq('user_id', userId).then(() => {})
  }, [supabase, userId, writeLocal])

  // Stop the timer and persist a sleep log spanning the elapsed time.
  const stop = useCallback(async (): Promise<BabyLog | null> => {
    const s = readStart()
    if (s == null) return null
    const night = readNight()
    setStopping(true)
    const endMs = Date.now()
    const durationMin = Math.max(1, Math.floor((endMs - s) / 60000))
    writeLocal(null, false)
    await supabase.from('active_sleep_timers').delete().eq('user_id', userId)
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
    if (data) {
      // Notify every mounted screen in this tab so the new log appears
      // instantly, regardless of which component triggered the stop.
      window.dispatchEvent(new CustomEvent(LOG_ADDED_EVT, { detail: data }))
    }
    return (data as BabyLog) ?? null
  }, [supabase, userId, writeLocal])

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
