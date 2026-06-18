/**
 * One-time tokens for password reset.
 * Uses Neon Postgres when configured; otherwise data/password-reset-tokens.json (local dev).
 * Tokens expire after 1 hour. Never expose raw tokens in admin or logs.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "password-reset-tokens.json")
const EXPIRY_SECONDS = 60 * 60 // 1 hour

interface TokenEntry {
  token: string
  email: string
  expiresAt: number
}

interface Store {
  tokens: TokenEntry[]
}

async function ensureFile(): Promise<Store> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as Store
    return Array.isArray(data.tokens) ? data : { tokens: [] }
  } catch {
    return { tokens: [] }
  }
}

async function writeStore(store: Store): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

function randomToken(): string {
  return crypto.randomUUID() + "-" + crypto.randomUUID().replace(/-/g, "")
}

async function dbCreateToken(email: string): Promise<string> {
  await ensureSchema()
  const db = getSql()
  const normalized = email.trim().toLowerCase()
  const token = randomToken()
  const expiresAt = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS
  const now = Math.floor(Date.now() / 1000)

  await db`DELETE FROM password_reset_tokens WHERE email = ${normalized}`
  await db`DELETE FROM password_reset_tokens WHERE expires_at <= ${now}`
  await db`
    INSERT INTO password_reset_tokens (token, email, expires_at)
    VALUES (${token}, ${normalized}, ${expiresAt})
  `
  return token
}

async function dbConsumeToken(token: string): Promise<string | null> {
  await ensureSchema()
  const db = getSql()
  const now = Math.floor(Date.now() / 1000)
  const rows = await db`
    DELETE FROM password_reset_tokens
    WHERE token = ${token} AND expires_at > ${now}
    RETURNING email
  `
  const row = rows[0] as { email: string } | undefined
  return row?.email ?? null
}

/** Create a reset token for the given email. Returns the token (use only in reset link). */
export async function createResetToken(email: string): Promise<string> {
  const normalized = email.trim().toLowerCase()
  if (isDatabaseConfigured()) {
    return dbCreateToken(normalized)
  }

  const store = await ensureFile()
  const token = randomToken()
  const expiresAt = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS
  store.tokens = store.tokens.filter((t) => t.email.toLowerCase() !== normalized)
  store.tokens.push({ token, email: normalized, expiresAt })
  await writeStore(store)
  return token
}

/** Consume token: return email if valid and not expired, then remove token. */
export async function consumeResetToken(token: string): Promise<string | null> {
  if (isDatabaseConfigured()) {
    return dbConsumeToken(token)
  }

  const store = await ensureFile()
  const now = Math.floor(Date.now() / 1000)
  const index = store.tokens.findIndex((t) => t.token === token && t.expiresAt > now)
  if (index === -1) return null
  const entry = store.tokens[index]
  store.tokens.splice(index, 1)
  await writeStore(store)
  return entry.email
}
