/**
 * Tracks AI token usage per member (Press Center allowance).
 * Monthly quota resets automatically. Purchased token packs carry over.
 *
 * Uses Neon Postgres when POSTGRES_URL / DATABASE_URL is set (production),
 * otherwise falls back to data/pio-generations.json (local dev).
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "pio-generations.json")

/** Included AI tokens per subscription month (matches pricing). */
export const MONTHLY_TOKEN_QUOTA = 100_000

export const OUT_OF_TOKENS_MESSAGE =
  "You have used all your AI tokens for this month. Purchase a token pack to continue."

interface MemberRecord {
  packs: number
  /** Set after one-time conversion from generation-count units to tokens. */
  migratedToTokens?: boolean
  [monthKey: string]: number | boolean | undefined
}

interface GenerationsStore {
  [email: string]: MemberRecord
}

/** ~3,333 tokens per legacy “generation” (100,000 / 30). */
const LEGACY_TOKENS_PER_GENERATION = Math.round(MONTHLY_TOKEN_QUOTA / 30)

function migrateLegacyGenerationUnits(record: MemberRecord): MemberRecord {
  if (record.migratedToTokens) return record
  const month = currentMonthKey()
  const used = typeof record[month] === "number" ? (record[month] as number) : 0
  const packs = typeof record.packs === "number" ? record.packs : 0
  // Legacy generation-scale values are small; token-scale values are large.
  if (used <= 200 && packs <= 500) {
    if (used > 0) record[month] = used * LEGACY_TOKENS_PER_GENERATION
    if (packs > 0) record.packs = packs * LEGACY_TOKENS_PER_GENERATION
  }
  record.migratedToTokens = true
  return record
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
      const parsed = JSON.parse(data) as MemberRecord
      return {
        ...parsed,
        packs: typeof parsed.packs === "number" ? parsed.packs : 0,
      }
    } catch {
      return { packs: 0 }
    }
  }
  if (data && typeof data === "object") {
    const parsed = data as MemberRecord
    return {
      ...parsed,
      packs: typeof parsed.packs === "number" ? parsed.packs : 0,
    }
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
  let record: MemberRecord
  if (isDatabaseConfigured()) {
    record = await dbReadRecord(key)
  } else {
    const store = await readFileStore()
    record = ensureRecord(store, key)
  }
  if (!record.migratedToTokens) {
    const before = JSON.stringify(record)
    migrateLegacyGenerationUnits(record)
    if (JSON.stringify(record) !== before) {
      await writeRecord(email, record)
    } else {
      record.migratedToTokens = true
      await writeRecord(email, record)
    }
  }
  return record
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

export type TokenStatus = {
  used: number
  quota: number
  packs: number
  remaining: number
}

/** Returns { used, quota, packs, remaining } for the current month (all in tokens). */
export async function getTokenStatus(email: string): Promise<TokenStatus> {
  const record = await readRecord(email)
  const month = currentMonthKey()
  const used = typeof record[month] === "number" ? record[month] : 0
  const packs = record.packs
  const remaining = Math.max(0, MONTHLY_TOKEN_QUOTA - used) + packs
  return { used, quota: MONTHLY_TOKEN_QUOTA, packs, remaining }
}

/** @deprecated Prefer getTokenStatus — same shape, token units. */
export const getGenerationStatus = getTokenStatus

/**
 * Debit tokens from monthly allowance first, then purchased packs.
 * Returns true if the full amount was consumed.
 */
export async function consumeTokens(email: string, amount: number): Promise<boolean> {
  const tokens = Math.max(0, Math.floor(amount))
  if (tokens <= 0) return true

  const record = await readRecord(email)
  const month = currentMonthKey()
  const used = typeof record[month] === "number" ? record[month] : 0
  let monthlyRemaining = Math.max(0, MONTHLY_TOKEN_QUOTA - used)
  let packs = record.packs
  let left = tokens

  if (monthlyRemaining + packs < left) {
    return false
  }

  if (monthlyRemaining > 0) {
    const fromMonthly = Math.min(monthlyRemaining, left)
    record[month] = used + fromMonthly
    left -= fromMonthly
    monthlyRemaining -= fromMonthly
  }

  if (left > 0) {
    record.packs = packs - left
  }

  await writeRecord(email, record)
  return true
}

/** @deprecated Prefer consumeTokens(email, amount). */
export async function consumeGeneration(email: string, amount = 1): Promise<boolean> {
  return consumeTokens(email, amount)
}

/** Add purchased token pack credits to a member's account. */
export async function addTokenPack(email: string, count: number): Promise<void> {
  const tokens = Math.max(0, Math.floor(count))
  if (tokens <= 0) return
  const record = await readRecord(email)
  record.packs = (record.packs || 0) + tokens
  await writeRecord(email, record)
}

/** @deprecated Prefer addTokenPack. */
export const addGenerationPack = addTokenPack

/** Batch lookup for admin member list. */
export async function getTokenStatuses(
  emails: string[]
): Promise<Map<string, TokenStatus>> {
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))]
  const entries = await Promise.all(
    unique.map(async (email) => [email, await getTokenStatus(email)] as const)
  )
  return new Map(entries)
}

/** @deprecated Prefer getTokenStatuses. */
export const getGenerationStatuses = getTokenStatuses
