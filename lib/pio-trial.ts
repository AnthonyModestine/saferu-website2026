/**
 * PIO Tool free trial by email.
 * Uses Neon Postgres when POSTGRES_URL / DATABASE_URL is set (production),
 * otherwise falls back to data/pio-trials.json (local dev).
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "pio-trials.json")

interface TrialsStore {
  [email: string]: number // trialEndAt Unix seconds
}

async function readFileStore(): Promise<TrialsStore> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as TrialsStore
    return typeof data === "object" && data !== null ? data : {}
  } catch {
    return {}
  }
}

async function writeFileStore(store: TrialsStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

async function dbGetTrialEnd(email: string): Promise<number | null> {
  await ensureSchema()
  const db = getSql()
  const rows = await db`
    SELECT trial_end_at FROM pio_trials WHERE email = ${email}
  `
  if (rows.length === 0) return null
  const end = rows[0].trial_end_at
  return typeof end === "number" || typeof end === "string" ? Number(end) : null
}

async function dbSetTrial(email: string, trialEndAt: number): Promise<void> {
  await ensureSchema()
  const db = getSql()
  await db`
    INSERT INTO pio_trials (email, trial_end_at)
    VALUES (${email}, ${trialEndAt})
    ON CONFLICT (email) DO UPDATE SET trial_end_at = EXCLUDED.trial_end_at
  `
}

/** Grant PIO trial for N days from now. Returns new trial end timestamp. */
export async function setTrial(email: string, days: number): Promise<number> {
  const key = email.trim().toLowerCase()
  if (!key || days < 1) return 0
  const now = Math.floor(Date.now() / 1000)
  const trialEndAt = now + days * 24 * 60 * 60

  if (isDatabaseConfigured()) {
    await dbSetTrial(key, trialEndAt)
    return trialEndAt
  }

  const store = await readFileStore()
  store[key] = trialEndAt
  await writeFileStore(store)
  return trialEndAt
}

/** Get trial end timestamp for email, or null if none. */
export async function getTrialEnd(email: string): Promise<number | null> {
  const key = email?.trim()?.toLowerCase()
  if (!key) return null

  if (isDatabaseConfigured()) {
    return dbGetTrialEnd(key)
  }

  const store = await readFileStore()
  const end = store[key]
  return typeof end === "number" ? end : null
}

/** True if email has an active trial (trial end in the future). */
export async function isOnActiveTrial(email: string): Promise<boolean> {
  const end = await getTrialEnd(email)
  if (end == null) return false
  return end > Math.floor(Date.now() / 1000)
}
