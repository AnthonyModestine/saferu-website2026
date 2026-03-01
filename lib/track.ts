"use client"

import type { TrackEvent } from "@/lib/metrics"

export function track(
  event: TrackEvent,
  payload?: { path?: string; name?: string; postId?: string; postTitle?: string; source?: string; [key: string]: unknown }
): void {
  if (typeof window === "undefined") return
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, ...payload }),
  }).catch(() => {})
}
