/** Shared localhost preview helpers (safe for client + server). */

/** Only used on localhost during development. */
export const LOCAL_PREVIEW_MEMBER = {
  memberId: "local-preview",
  email: "local.dev@saferu.com",
  name: "Anthony M.",
} as const

const GUEST_PREVIEW_KEY = "saferu_local_guest_preview"

export function isLocalHostname(hostHeader: string | null | undefined): boolean {
  const host = (hostHeader || "").split(":")[0].toLowerCase()
  return host === "localhost" || host === "127.0.0.1"
}

/** Client: true when browser is on localhost and not in guest preview. */
export function isLocalPreviewClient(): boolean {
  if (typeof window === "undefined") return false
  if (!isLocalHostname(window.location.hostname)) return false
  return !isLocalGuestPreviewClient()
}

/**
 * Client: true when localhost guest preview is on (?guest=1 or sessionStorage flag).
 * Lets you preview the logged-out / unpaid experience on localhost.
 */
export function isLocalGuestPreviewClient(): boolean {
  if (typeof window === "undefined") return false
  if (!isLocalHostname(window.location.hostname)) return false
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get("guest") === "1") {
      sessionStorage.setItem(GUEST_PREVIEW_KEY, "1")
      return true
    }
    if (params.get("guest") === "0") {
      sessionStorage.removeItem(GUEST_PREVIEW_KEY)
      return false
    }
    return sessionStorage.getItem(GUEST_PREVIEW_KEY) === "1"
  } catch {
    return false
  }
}
