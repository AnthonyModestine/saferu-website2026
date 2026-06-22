"use client"

import type { TrackEvent } from "@/lib/metrics"
import { getVisitorSessionId } from "@/lib/visitor-session"

export function track(
  event: TrackEvent,
  payload?: { path?: string; name?: string; postId?: string; postTitle?: string; source?: string; [key: string]: unknown }
): void {
  if (typeof window === "undefined") return
  const sessionId = getVisitorSessionId()
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, sessionId, ...payload }),
  }).catch(() => {})
}
