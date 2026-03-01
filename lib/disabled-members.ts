/**
 * Disabled members by email (admin-only). Stored in data/disabled-members.json.
 * Disabled users cannot sign in; session returns null for them.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "disabled-members.json")

interface Store {
  emails: string[] // lowercase emails
}

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as Store
    return Array.isArray(data.emails) ? data : { emails: [] }
  } catch {
    return { emails: [] }
  }
}

async function writeStore(store: Store): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

/** Set of disabled emails (lowercase). */
export async function getDisabledEmails(): Promise<Set<string>> {
  const store = await readStore()
  return new Set(store.emails.map((e) => String(e).toLowerCase()))
}

/** True if this email is disabled. */
export async function isDisabled(email: string): Promise<boolean> {
  const key = email?.trim()?.toLowerCase()
  if (!key) return false
  const set = await getDisabledEmails()
  return set.has(key)
}

/** Enable or disable a member by email. Returns success. */
export async function setMemberDisabled(email: string, disabled: boolean): Promise<boolean> {
  const key = email?.trim()?.toLowerCase()
  if (!key) return false
  const store = await readStore()
  const has = store.emails.some((e) => e.toLowerCase() === key)
  if (disabled && !has) {
    store.emails.push(key)
    await writeStore(store)
    return true
  }
  if (!disabled && has) {
    store.emails = store.emails.filter((e) => e.toLowerCase() !== key)
    await writeStore(store)
    return true
  }
  return true // already in desired state
}
