"use server"

import { cookies } from "next/headers"
import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"

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
  const store = await readSessions()
  store[sessionId] = {
    memberId: params.memberId,
    email: params.email.trim().toLowerCase(),
    name: params.name?.trim(),
    expiresAt,
  }
  await writeSessions(store)
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
  if (!cookie?.value) return null
  const store = await readSessions()
  const data = store[cookie.value]
  if (!data || data.expiresAt < Math.floor(Date.now() / 1000)) return null
  return data
}

export async function clearMemberSession(): Promise<void> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(COOKIE_NAME)
  if (cookie?.value) {
    const store = await readSessions()
    delete store[cookie.value]
    await writeSessions(store)
  }
  cookieStore.delete(COOKIE_NAME)
}
