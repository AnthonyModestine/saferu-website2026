/**
 * Per-member last login timestamps (Unix seconds).
 * Recorded when a member session is created (email/password sign-in).
 */

import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const STORE_PATH = path.join(DATA_DIR, "member-last-logins.json")

type FileStore = Record<string, number>

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf-8")
    const parsed = JSON.parse(raw) as FileStore
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

/** Record a successful login for this email (Unix seconds). */
export async function recordMemberLogin(email: string): Promise<void> {
  const key = normalizeEmail(email)
  if (!key) return
  const at = Math.floor(Date.now() / 1000)

  try {
    if (isDatabaseConfigured()) {
      await ensureSchema()
      const db = getSql()
      await db`
        INSERT INTO member_last_logins (email, last_login_at)
        VALUES (${key}, ${at})
        ON CONFLICT (email) DO UPDATE SET last_login_at = EXCLUDED.last_login_at
      `
      return
    }

    const store = await readFileStore()
    store[key] = at
    await writeFileStore(store)
  } catch (err) {
    console.warn(
      "[member-last-login] Could not record login:",
      err instanceof Error ? err.message : err
    )
  }
}

/** Batch lookup of last login times by email. */
export async function getLastLoginsByEmails(
  emails: string[]
): Promise<Map<string, number>> {
  const result = new Map<string, number>()
  const unique = [
    ...new Set(emails.map((e) => normalizeEmail(e)).filter(Boolean)),
  ]
  if (unique.length === 0) return result

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const db = getSql()
    await Promise.all(
      unique.map(async (email) => {
        const rows = await db`
          SELECT last_login_at
          FROM member_last_logins
          WHERE email = ${email}
          LIMIT 1
        `
        const row = (rows as Array<{ last_login_at: number | string }>)[0]
        const at = row ? Number(row.last_login_at) : 0
        if (Number.isFinite(at) && at > 0) result.set(email, at)
      })
    )
    return result
  }

  const store = await readFileStore()
  for (const email of unique) {
    const at = store[email]
    if (typeof at === "number" && at > 0) result.set(email, at)
  }
  return result
}
