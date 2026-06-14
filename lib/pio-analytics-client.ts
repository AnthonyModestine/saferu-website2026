"use client"

import type { GenerationActionType } from "@/lib/pio-analytics"

export function trackPioAction(
  generationSessionId: string | null | undefined,
  actionType: GenerationActionType
): void {
  if (!generationSessionId || typeof window === "undefined") return
  fetch("/api/pio/analytics/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ generationSessionId, actionType }),
  }).catch(() => {})
}

export function submitPioFeedback(params: {
  generationSessionId: string
  rating: "positive" | "negative"
  reason?: string
  comment?: string
}): Promise<boolean> {
  return fetch("/api/pio/analytics/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  })
    .then((r) => r.ok)
    .catch(() => false)
}
