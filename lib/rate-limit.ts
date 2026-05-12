/**
 * Simple in-memory rate limiter.
 * Works per-serverless-instance; good enough to stop casual abuse.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Returns true if the request is allowed, false if rate limit exceeded.
 * @param key      Unique key (e.g. IP + route)
 * @param limit    Max requests in the window
 * @param windowMs Window size in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}

export function getClientIp(request: Request): string {
  const headers = request.headers as Headers & { get(name: string): string | null }
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  )
}
