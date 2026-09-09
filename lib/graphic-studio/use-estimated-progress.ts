"use client"

import { useEffect, useState } from "react"

/**
 * Fills 0→~92% over expectedMs (ease-out), then slowly crawls toward 97%
 * until the caller turns active off. Used for OpenAI image waits where we
 * can't stream real progress.
 */
export function useEstimatedProgress(active: boolean, expectedMs: number): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!active) {
      setProgress(0)
      return
    }

    setProgress(2)
    const startedAt = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startedAt
      if (elapsed <= expectedMs) {
        const t = elapsed / expectedMs
        // Ease-out so early movement feels responsive, then slows near the end.
        setProgress(Math.max(2, 92 * (1 - (1 - t) * (1 - t))))
        return
      }
      const over = elapsed - expectedMs
      setProgress(Math.min(97, 92 + (over / 45_000) * 5))
    }

    tick()
    const id = window.setInterval(tick, 120)
    return () => window.clearInterval(id)
  }, [active, expectedMs])

  return progress
}

/** Typical wait for high-quality 16:9 OpenAI image create (with logo). */
export const GRAPHIC_GENERATE_EXPECTED_MS = 95_000

/** Typical wait for surgical image revise. */
export const GRAPHIC_REVISE_EXPECTED_MS = 80_000
