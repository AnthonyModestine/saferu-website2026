"use server"

import { cookies } from "next/headers"
import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import { LOCAL_PREVIEW_MEMBER } from "@/lib/local-preview"
import { isLocalPreviewServer } from "@/lib/local-preview-server"

const DATA_DIR = path.join(process.cwd(), "data")
const SESSIONS_FILE = path.join(DATA_DIR, "member-sessions.json")
const COOKIE_NAME = "saferu_member_session"
const MAX_AGE_DAYS = 14

export interface MemberSessionData {
  memberId: string
  email: string
  name?: string
  expiresAt: number
}

interface SessionsStore {
  [sessionId: string]: MemberSessionData
}

interface SessionRow {
  id: string
  member_id: string
  email: string
  name: string | null
  expires_at: string | number
}

function rowToSession(row: SessionRow): MemberSessionData {
  return {
    memberId: row.member_id,
    email: row.email,
    name: row.name ?? undefined,
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

export async function createMemberSession(params: {
  memberId: string
  email: string
  name?: string
}): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = Math.floor(Date.now() / 1000) + MAX_AGE_DAYS * 24 * 60 * 60
  const email = params.email.trim().toLowerCase()
  const name = params.name?.trim() || null

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`
      INSERT INTO member_sessions (id, member_id, email, name, expires_at)
      VALUES (${sessionId}, ${params.memberId}, ${email}, ${name}, ${expiresAt})
    `
  } else {
    const store = await readSessions()
    store[sessionId] = {
      memberId: params.memberId,
      email,
      name: name ?? undefined,
      expiresAt,
    }
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

export async function getMemberSession(): Promise<MemberSessionData | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  const now = Math.floor(Date.now() / 1000)

  if (cookie?.value) {
    if (isDatabaseConfigured()) {
      await ensureSchema()
      const rows = await getSql()`
        SELECT id, member_id, email, name, expires_at
        FROM member_sessions
        WHERE id = ${cookie.value}
        LIMIT 1
      `
      const row = (rows as SessionRow[])[0]
      if (row && Number(row.expires_at) >= now) return rowToSession(row)
    } else {
      const store = await readSessions()
      const data = store[cookie.value]
      if (data && data.expiresAt >= now) return data
    }
  }

  // Localhost Next.js alone: act as a logged-in subscribed PIO user for rebuilding UI.
  if (await isLocalPreviewServer()) {
    return {
      memberId: LOCAL_PREVIEW_MEMBER.memberId,
      email: LOCAL_PREVIEW_MEMBER.email,
      name: LOCAL_PREVIEW_MEMBER.name,
      expiresAt: now + 60 * 60 * 24 * 30,
    }
  }

  return null
}

export async function clearMemberSession(): Promise<void> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)

  if (cookie?.value) {
    if (isDatabaseConfigured()) {
      await ensureSchema()
      await getSql()`DELETE FROM member_sessions WHERE id = ${cookie.value}`
    } else {
      const store = await readSessions()
      delete store[cookie.value]
      await writeSessions(store)
    }
  }

  cookieStore.delete(COOKIE_NAME)
}

/** Invalidate all sessions for a member (e.g. after password change). Optionally keep current session. */
export async function clearMemberSessionsForUser(
  memberId: string,
  exceptSessionId?: string
): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    if (exceptSessionId) {
      await getSql()`
        DELETE FROM member_sessions
        WHERE member_id = ${memberId} AND id <> ${exceptSessionId}
      `
    } else {
      await getSql()`DELETE FROM member_sessions WHERE member_id = ${memberId}`
    }
    return
  }

  const store = await readSessions()
  for (const [sid, data] of Object.entries(store)) {
    if (data.memberId === memberId && sid !== exceptSessionId) {
      delete store[sid]
    }
  }
  await writeSessions(store)
}

export async function getCurrentMemberSessionId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value ?? null
}
