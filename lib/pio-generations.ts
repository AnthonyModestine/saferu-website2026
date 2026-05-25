/**
 * Tracks AI generation usage per member.
 * Monthly quota resets automatically. Purchased packs carry over.
 *
 * Storage format (data/pio-generations.json):
 * {
 *   "user@agency.gov": {
 *     "2026-05": 12,   // generations used in that month
 *     "packs": 5       // additional purchased generations (carry-over)
 *   }
 * }
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "pio-generations.json")
const MONTHLY_QUOTA = 30

interface MemberRecord {
  [monthKey: string]: number // "YYYY-MM" → used count
  packs: number              // purchased extra generations (carry-over)
}

interface GenerationsStore {
  [email: string]: MemberRecord
}

function currentMonthKey(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

async function readStore(): Promise<GenerationsStore> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as GenerationsStore
    return typeof data === "object" && data !== null ? data : {}
  } catch {
    return {}
  }
}

async function writeStore(store: GenerationsStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

function ensureRecord(store: GenerationsStore, email: string): MemberRecord {
  if (!store[email]) store[email] = { packs: 0 }
  if (typeof store[email].packs !== "number") store[email].packs = 0
  return store[email]
}

/** Returns { used, quota, packs, remaining } for the current month. */
export async function getGenerationStatus(email: string): Promise<{
  used: number
  quota: number
  packs: number
  remaining: number
}> {
  const key = email.trim().toLowerCase()
  const store = await readStore()
  const record = ensureRecord(store, key)
  const month = currentMonthKey()
  const used = typeof record[month] === "number" ? record[month] : 0
  const packs = record.packs
  const remaining = Math.max(0, MONTHLY_QUOTA - used) + packs
  return { used, quota: MONTHLY_QUOTA, packs, remaining }
}

/**
 * Attempts to consume one generation.
 * Returns true if allowed and decremented, false if no generations left.
 */
export async function consumeGeneration(email: string): Promise<boolean> {
  const key = email.trim().toLowerCase()
  const store = await readStore()
  const record = ensureRecord(store, key)
  const month = currentMonthKey()
  const used = typeof record[month] === "number" ? record[month] : 0
  const monthlyRemaining = MONTHLY_QUOTA - used
  const packs = record.packs

  if (monthlyRemaining > 0) {
    record[month] = used + 1
    await writeStore(store)
    return true
  }

  if (packs > 0) {
    record.packs = packs - 1
    await writeStore(store)
    return true
  }

  return false
}

/** Add purchased generation pack credits to a member's account. */
export async function addGenerationPack(email: string, count: number): Promise<void> {
  const key = email.trim().toLowerCase()
  const store = await readStore()
  const record = ensureRecord(store, key)
  record.packs = (record.packs || 0) + count
  await writeStore(store)
}
