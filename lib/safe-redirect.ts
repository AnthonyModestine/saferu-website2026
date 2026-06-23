/**
 * Prevent open redirects after sign-in. Only same-site relative paths are allowed.
 */
export function sanitizeReturnUrl(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || typeof raw !== "string") return fallback
  const trimmed = raw.trim()
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback
  }
  if (trimmed.includes("://") || trimmed.includes("@")) return fallback
  return trimmed
}
