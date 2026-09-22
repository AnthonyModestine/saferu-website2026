/**
 * Durable rate limiting for auth endpoints.
 * Neon when configured; in-memory fallback for local dev without DB.
 */

import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

interface MemoryEntry {
  count: number
  resetAt: number
}

const memoryStore = new Map<string, MemoryEntry>()

let lastCleanupAt = 0

async function maybeCleanupExpired(now: number): Promise<void> {
  if (now - lastCleanupAt < 60_000) return
  lastCleanupAt = now
  if (!isDatabaseConfigured()) {
    for (const [key, entry] of memoryStore) {
      if (now > entry.resetAt) memoryStore.delete(key)
    }
    return
  }
  try {
    await ensureSchema()
    await getSql()`DELETE FROM rate_limit_buckets WHERE reset_at < ${now}`
  } catch {
    // non-fatal
  }
}

/**
 * Atomic auth rate limit across Vercel instances (Neon) or local memory.
 * Returns true if allowed, false if rate limited.
 */
export async function checkAuthRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = Date.now()
  await maybeCleanupExpired(now)
  const bucketKey = key.slice(0, 200)
  const resetAt = now + windowMs

  if (!isDatabaseConfigured()) {
    const entry = memoryStore.get(bucketKey)
    if (!entry || now > entry.resetAt) {
      memoryStore.set(bucketKey, { count: 1, resetAt })
      return true
    }
    if (entry.count >= limit) return false
    entry.count++
    return true
  }

  await ensureSchema()

  await getSql()`
    INSERT INTO rate_limit_buckets (bucket_key, count, reset_at)
    VALUES (${bucketKey}, 0, ${resetAt})
    ON CONFLICT (bucket_key) DO UPDATE SET
      count = CASE WHEN rate_limit_buckets.reset_at < ${now} THEN 0 ELSE rate_limit_buckets.count END,
      reset_at = CASE WHEN rate_limit_buckets.reset_at < ${now} THEN ${resetAt} ELSE rate_limit_buckets.reset_at END
  `

  const rows = await getSql()`
    UPDATE rate_limit_buckets
    SET count = count + 1
    WHERE bucket_key = ${bucketKey}
      AND count < ${limit}
    RETURNING count
  `

  return (rows as unknown[]).length > 0
}

export { getClientIp } from "@/lib/rate-limit"
