"use server"

import { cookies } from "next/headers"
import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const SESSIONS_FILE = path.join(DATA_DIR, "admin-sessions.json")
const COOKIE_NAME = "saferu_admin_session"
const MAX_AGE_DAYS = 7

export interface AdminSessionData {
  adminId: string
  email: string
  expiresAt: number
}

interface SessionsStore {
  [sessionId: string]: AdminSessionData
}

interface SessionRow {
  id: string
  admin_id: string
  email: string
  expires_at: string | number
}

function rowToSession(row: SessionRow): AdminSessionData {
  return {
    adminId: row.admin_id,
    email: row.email,
    expiresAt: Number(row.expires_at),
  }
}

async function readSessions(): Promise<SessionsStore> {
  try {
    const raw = await readFile(SESSIONS_FILE, "utf-8")
    const data = JSON.parse(raw) as SessionsStore
    return typeof data === "object" && data !== null ? data : {}
  } catch {
    return {}
  }
}

async function writeSessions(store: SessionsStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(SESSIONS_FILE, JSON.stringify(store, null, 2), "utf-8")
}

export async function createAdminSession(params: {
  adminId: string
  email: string
}): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = Math.floor(Date.now() / 1000) + MAX_AGE_DAYS * 24 * 60 * 60
  const email = params.email.trim().toLowerCase()

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`
      INSERT INTO admin_sessions (id, admin_id, email, expires_at)
      VALUES (${sessionId}, ${params.adminId}, ${email}, ${expiresAt})
    `
  } else {
    const store = await readSessions()
    store[sessionId] = { adminId: params.adminId, email, expiresAt }
    await writeSessions(store)
  }

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
    path: "/",
  })
  return sessionId
}

export async function getAdminSession(): Promise<AdminSessionData | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (!cookie?.value) return null

  const now = Math.floor(Date.now() / 1000)

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      SELECT id, admin_id, email, expires_at
      FROM admin_sessions
      WHERE id = ${cookie.value}
      LIMIT 1
    `
    const row = (rows as SessionRow[])[0]
    if (!row || Number(row.expires_at) < now) return null
    return rowToSession(row)
  }

  const store = await readSessions()
  const data = store[cookie.value]
  if (!data || data.expiresAt < now) return null
  return data
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)

  if (cookie?.value) {
    if (isDatabaseConfigured()) {
      await ensureSchema()
      await getSql()`DELETE FROM admin_sessions WHERE id = ${cookie.value}`
    } else {
      const store = await readSessions()
      delete store[cookie.value]
      await writeSessions(store)
    }
  }

  cookieStore.delete(COOKIE_NAME)
}
