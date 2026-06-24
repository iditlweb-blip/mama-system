'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  target: number
  duration?: number   // ms
  suffix?: string     // e.g. "+"
}

export default function CounterUp({ target, duration = 1800, suffix = '' }: Props) {
  const [count, setCount] = useState(0)
  const elRef   = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const startTime = performance.now()
          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1)
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          observer.disconnect()
        }
      },
      { threshold: 0.6 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration])

  return (
    <span ref={elRef}>
      {count}{suffix}
    </span>
  )
}
