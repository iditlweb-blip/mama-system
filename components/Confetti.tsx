'use client'

import { useEffect, useRef } from 'react'

// A short burst of confetti for the app's one genuinely big moment - the
// mother marking that she has given birth. Hand-rolled on a canvas rather than
// pulled from a library: it is a few dozen lines, it uses the brand palette,
// and it keeps the bundle as it is.
//
// The canvas sits above everything and ignores pointer events, so the form
// underneath stays usable while the pieces are still falling.

const COLORS = ['#7F5268', '#C4A0B4', '#F2E6DC', '#5C7A6A', '#D9A441', '#E8B4C8']
const PIECES = 140
const GRAVITY = 0.14
const DRAG = 0.995
// Long enough to feel celebratory, short enough not to be in the way.
const DURATION_MS = 3800
const FADE_FROM_MS = 2600

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  color: string
  /** Current rotation and how fast it tumbles, in radians. */
  angle: number
  spin: number
}

export default function Confetti({ onDone }: { onDone?: () => void } = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Kept in a ref so the effect below never restarts the animation when the
  // parent re-renders and passes a fresh callback.
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Anyone who has asked for less motion gets no animation at all - a
    // full-screen burst of moving pieces is exactly what that setting is for.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      onDoneRef.current?.()
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = window.innerWidth
    let height = window.innerHeight

    function size() {
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    size()
    window.addEventListener('resize', size)

    // Two launchers, one from each bottom corner, angled inward - the pieces
    // arc up across the middle of the screen and then rain back down.
    const pieces: Piece[] = Array.from({ length: PIECES }, (_, i) => {
      const fromLeft = i % 2 === 0
      const spread = (Math.random() - 0.5) * 0.9
      const speed = 11 + Math.random() * 9
      const angle = (fromLeft ? -Math.PI / 3 : -(Math.PI * 2) / 3) + spread
      return {
        x: fromLeft ? -10 : width + 10,
        y: height * (0.75 + Math.random() * 0.2),
        vx: Math.cos(angle) * speed * (fromLeft ? -1 : -1),
        vy: Math.sin(angle) * speed,
        w: 6 + Math.random() * 6,
        h: 9 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.3,
      }
    })
    // Mirror the left launcher's horizontal push so both fire inward.
    for (let i = 0; i < pieces.length; i++) {
      if (i % 2 === 0) pieces[i].vx = Math.abs(pieces[i].vx)
      else pieces[i].vx = -Math.abs(pieces[i].vx)
    }

    const start = performance.now()
    let raf = 0

    function frame(now: number) {
      const elapsed = now - start
      ctx!.clearRect(0, 0, width, height)

      // Fade the whole burst out at the end rather than letting pieces vanish.
      const alpha = elapsed < FADE_FROM_MS
        ? 1
        : Math.max(0, 1 - (elapsed - FADE_FROM_MS) / (DURATION_MS - FADE_FROM_MS))
      ctx!.globalAlpha = alpha

      for (const p of pieces) {
        p.vy += GRAVITY
        p.vx *= DRAG
        p.vy *= DRAG
        p.x += p.vx
        p.y += p.vy
        p.angle += p.spin

        ctx!.save()
        ctx!.translate(p.x, p.y)
        ctx!.rotate(p.angle)
        ctx!.fillStyle = p.color
        // Squashing the height by the tumble angle reads as a flat paper
        // rectangle turning over, without needing a 3D transform.
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.angle)))
        ctx!.restore()
      }

      if (elapsed < DURATION_MS) {
        raf = requestAnimationFrame(frame)
      } else {
        ctx!.clearRect(0, 0, width, height)
        onDoneRef.current?.()
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', size)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        pointerEvents: 'none',
      }}
    />
  )
}
