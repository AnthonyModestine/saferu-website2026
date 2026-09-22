/**
 * Disabled members by email (admin-only).
 * Neon when POSTGRES_URL / DATABASE_URL is set; otherwise data/disabled-members.json for local dev.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "disabled-members.json")

interface Store {
  emails: string[]
}

async function readFileStore(): Promise<Store> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as Store
    return Array.isArray(data.emails) ? data : { emails: [] }
  } catch {
    return { emails: [] }
  }
}

async function writeFileStore(store: Store): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

/** One-time import of local JSON into Neon when the table is empty. */
async function maybeMigrateFileToDb(): Promise<void> {
  const rows = await getSql()`SELECT email FROM disabled_members LIMIT 1`
  if ((rows as unknown[]).length > 0) return
  const store = await readFileStore()
  if (store.emails.length === 0) return
  const now = Math.floor(Date.now() / 1000)
  for (const email of store.emails) {
    const key = String(email).trim().toLowerCase()
    if (!key) continue
    await getSql()`
      INSERT INTO disabled_members (email, disabled_at)
      VALUES (${key}, ${now})
      ON CONFLICT (email) DO NOTHING
    `
  }
}

/** Set of disabled emails (lowercase). */
export async function getDisabledEmails(): Promise<Set<string>> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await maybeMigrateFileToDb()
    const rows = await getSql()`SELECT email FROM disabled_members`
    return new Set((rows as { email: string }[]).map((r) => r.email.toLowerCase()))
  }
  const store = await readFileStore()
  return new Set(store.emails.map((e) => String(e).toLowerCase()))
}

/** True if this email is disabled. */
export async function isDisabled(email: string): Promise<boolean> {
  const key = email?.trim()?.toLowerCase()
  if (!key) return false

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await maybeMigrateFileToDb()
    const rows = await getSql()`
      SELECT 1 AS ok FROM disabled_members WHERE email = ${key} LIMIT 1
    `
    return (rows as unknown[]).length > 0
  }

  const set = await getDisabledEmails()
  return set.has(key)
}

/** Enable or disable a member by email. Returns success. */
export async function setMemberDisabled(email: string, disabled: boolean): Promise<boolean> {
  const key = email?.trim()?.toLowerCase()
  if (!key) return false

  if (isDatabaseConfigured()) {
    await ensureSchema()
    if (disabled) {
      const now = Math.floor(Date.now() / 1000)
      await getSql()`
        INSERT INTO disabled_members (email, disabled_at)
        VALUES (${key}, ${now})
        ON CONFLICT (email) DO UPDATE SET disabled_at = EXCLUDED.disabled_at
      `
    } else {
      await getSql()`DELETE FROM disabled_members WHERE email = ${key}`
    }
    return true
  }

  const store = await readFileStore()
  const has = store.emails.some((e) => e.toLowerCase() === key)
  if (disabled && !has) {
    store.emails.push(key)
    await writeFileStore(store)
    return true
  }
  if (!disabled && has) {
    store.emails = store.emails.filter((e) => e.toLowerCase() !== key)
    await writeFileStore(store)
    return true
  }
  return true
}
