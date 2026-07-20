'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Contraction } from '@/types/database'

// A contraction timer for pregnancy mode. It mirrors the sleep-timer UX (tap
// Start when a contraction begins, Stop when it ends) but is intentionally
// simpler: a contraction lasts under two minutes, so the running state lives
// only in localStorage (fast, survives refresh/navigation, syncs across tabs
// in the same browser). There's no cross-device DB mirror because — unlike the
// sleep timer — nothing external (e.g. the WhatsApp bot) drives it.
const KEY = 'mama_contraction_timer_start'
const EVT = 'mama-contraction-timer-change'
// Broadcast when stop()/addManual() records a contraction, so a screen that's
// mounted (the contraction page) can add it to its list immediately even when
// the timer was stopped from the always-mounted global bar.
export const CONTRACTION_ADDED_EVT = 'mama-contraction-added'

function readStart(): number | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(KEY)
  if (!v) return null
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? null : n
}

export function formatClock(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function useContractionTimer(userId: string) {
  const supabase = createClient()
  const [startMs, setStartMs] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [stopping, setStopping] = useState(false)

  // Write the local cache + notify every mounted hook instance in this tab.
  const writeLocal = useCallback((start: number | null) => {
    if (start == null) window.localStorage.removeItem(KEY)
    else window.localStorage.setItem(KEY, String(start))
    window.dispatchEvent(new Event(EVT))
    setStartMs(start)
  }, [])

  // Hydrate from localStorage on mount + keep in sync across tabs/instances.
  useEffect(() => {
    setStartMs(readStart())
    const sync = () => setStartMs(readStart())
    window.addEventListener(EVT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EVT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Tick every second while running.
  useEffect(() => {
    if (startMs == null) { setElapsed(0); return }
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startMs])

  const start = useCallback(() => {
    writeLocal(Date.now())
  }, [writeLocal])

  // Discard the running contraction without recording it.
  const cancel = useCallback(() => {
    writeLocal(null)
  }, [writeLocal])

  // Persist a completed contraction and broadcast it. Shared by stop() and
  // the manual-entry form so both paths record identically.
  const record = useCallback(async (startMs: number, endMs: number): Promise<Contraction | null> => {
    const durationSec = Math.max(1, Math.round((endMs - startMs) / 1000))
    const { data, error } = await supabase
      .from('contractions')
      .insert({
        user_id: userId,
        start_time: new Date(startMs).toISOString(),
        end_time: new Date(endMs).toISOString(),
        duration_sec: durationSec,
      })
      .select()
      .single()
    if (error || !data) {
      console.error('[contraction-timer] failed to record contraction:', error)
      return null
    }
    window.dispatchEvent(new CustomEvent(CONTRACTION_ADDED_EVT, { detail: data }))
    return data as Contraction
  }, [supabase, userId])

  // Stop the running timer and persist the contraction. The running timer is
  // only cleared once the row is safely written, so a failed insert keeps the
  // timer visible for a retry instead of silently losing the contraction.
  const stop = useCallback(async (): Promise<Contraction | null> => {
    const s = readStart()
    if (s == null) return null
    setStopping(true)
    const saved = await record(s, Date.now())
    setStopping(false)
    if (saved) writeLocal(null)
    return saved
  }, [record, writeLocal])

  // Manually add a contraction from typed start/end times.
  const addManual = useCallback(async (startISO: string, endISO: string): Promise<Contraction | null> => {
    const s = new Date(startISO).getTime()
    const e = new Date(endISO).getTime()
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) return null
    return record(s, e)
  }, [record])

  return {
    active: startMs != null,
    startMs,
    elapsed,
    stopping,
    start,
    stop,
    cancel,
    addManual,
    formatClock,
  }
}
