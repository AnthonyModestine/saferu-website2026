/**
 * Tracks AI generation usage per member.
 * Monthly quota resets automatically. Purchased packs carry over.
 *
 * Uses Neon Postgres when POSTGRES_URL / DATABASE_URL is set (production),
 * otherwise falls back to data/pio-generations.json (local dev).
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "pio-generations.json")
const MONTHLY_QUOTA = 30

interface MemberRecord {
  [monthKey: string]: number // "YYYY-MM" → used count
  packs: number
}

interface GenerationsStore {
  [email: string]: MemberRecord
}

function currentMonthKey(): string {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
}

function ensureRecord(store: GenerationsStore, email: string): MemberRecord {
  if (!store[email]) store[email] = { packs: 0 }
  if (typeof store[email].packs !== "number") store[email].packs = 0
  return store[email]
}

async function readFileStore(): Promise<GenerationsStore> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as GenerationsStore
    return typeof data === "object" && data !== null ? data : {}
  } catch {
    return {}
  }
}

async function writeFileStore(store: GenerationsStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

async function dbReadRecord(email: string): Promise<MemberRecord> {
  await ensureSchema()
  const db = getSql()
  const rows = await db`SELECT data FROM pio_generations WHERE email = ${email}`
  if (rows.length === 0) return { packs: 0 }
  const data = rows[0].data
  if (typeof data === "string") {
    try {
      return { packs: 0, ...JSON.parse(data) }
    } catch {
      return { packs: 0 }
    }
  }
  if (data && typeof data === "object") {
    return { packs: 0, ...(data as MemberRecord) }
  }
  return { packs: 0 }
}

async function dbWriteRecord(email: string, record: MemberRecord): Promise<void> {
  await ensureSchema()
  const db = getSql()
  await db`
    INSERT INTO pio_generations (email, data)
    VALUES (${email}, ${JSON.stringify(record)}::jsonb)
    ON CONFLICT (email) DO UPDATE SET data = EXCLUDED.data
  `
}

async function readRecord(email: string): Promise<MemberRecord> {
  const key = email.trim().toLowerCase()
  if (isDatabaseConfigured()) {
    return dbReadRecord(key)
  }
  const store = await readFileStore()
  return ensureRecord(store, key)
}

async function writeRecord(email: string, record: MemberRecord): Promise<void> {
  const key = email.trim().toLowerCase()
  if (isDatabaseConfigured()) {
    await dbWriteRecord(key, record)
    return
  }
  const store = await readFileStore()
  store[key] = record
  await writeFileStore(store)
}

/** Returns { used, quota, packs, remaining } for the current month. */
export async function getGenerationStatus(email: string): Promise<{
  used: number
  quota: number
  packs: number
  remaining: number
}> {
  const record = await readRecord(email)
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
  const record = await readRecord(email)
  const month = currentMonthKey()
  const used = typeof record[month] === "number" ? record[month] : 0
  const monthlyRemaining = MONTHLY_QUOTA - used
  const packs = record.packs

  if (monthlyRemaining > 0) {
    record[month] = used + 1
    await writeRecord(email, record)
    return true
  }

  if (packs > 0) {
    record.packs = packs - 1
    await writeRecord(email, record)
    return true
  }

  return false
}

/** Add purchased generation pack credits to a member's account. */
export async function addGenerationPack(email: string, count: number): Promise<void> {
  const record = await readRecord(email)
  record.packs = (record.packs || 0) + count
  await writeRecord(email, record)
}

/** Batch lookup for admin member list. */
export async function getGenerationStatuses(
  emails: string[]
): Promise<Map<string, Awaited<ReturnType<typeof getGenerationStatus>>>> {
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))]
  const entries = await Promise.all(
    unique.map(async (email) => [email, await getGenerationStatus(email)] as const)
  )
  return new Map(entries)
}
