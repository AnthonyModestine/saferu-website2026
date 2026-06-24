/**
 * Admin session check for API route handlers (no "use server" — safe in Route Handlers).
 */

import { cookies } from "next/headers"
import { readFile } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const COOKIE_NAME = "saferu_admin_session"
const SESSIONS_FILE = path.join(process.cwd(), "data", "admin-sessions.json")

export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(COOKIE_NAME)?.value
  if (!sessionId) return false

  const now = Math.floor(Date.now() / 1000)

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      SELECT expires_at FROM admin_sessions WHERE id = ${sessionId} LIMIT 1
    `
    const row = (rows as { expires_at: string | number }[])[0]
    if (!row || Number(row.expires_at) < now) return false
    return true
  }

  try {
    const raw = await readFile(SESSIONS_FILE, "utf-8")
    const store = JSON.parse(raw) as Record<string, { expiresAt: number }>
    const data = store[sessionId]
    if (!data || data.expiresAt < now) return false
    return true
  } catch {
    return false
  }
}
