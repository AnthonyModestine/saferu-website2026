"use client"

const SESSION_KEY = "saferu_visitor_session"

/** Stable anonymous session id for journey analytics (per browser tab). */
export function getVisitorSessionId(): string {
  if (typeof window === "undefined") return ""
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return ""
  }
}
