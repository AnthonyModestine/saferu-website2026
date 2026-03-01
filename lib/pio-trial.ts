/**
 * PIO Tool free trial by email. Stored in data/pio-trials.json.
 * Keyed by email (lowercase). Trial end is Unix seconds.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "pio-trials.json")

interface TrialsStore {
  [email: string]: number // trialEndAt Unix seconds
}

async function readStore(): Promise<TrialsStore> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as TrialsStore
    return typeof data === "object" && data !== null ? data : {}
  } catch {
    return {}
  }
}

async function writeStore(store: TrialsStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

/** Grant PIO trial for N days from now. Returns new trial end timestamp. */
export async function setTrial(email: string, days: number): Promise<number> {
  const key = email.trim().toLowerCase()
  if (!key || days < 1) return 0
  const store = await readStore()
  const now = Math.floor(Date.now() / 1000)
  const trialEndAt = now + days * 24 * 60 * 60
  store[key] = trialEndAt
  await writeStore(store)
  return trialEndAt
}

/** Get trial end timestamp for email, or null if none. */
export async function getTrialEnd(email: string): Promise<number | null> {
  const key = email?.trim()?.toLowerCase()
  if (!key) return null
  const store = await readStore()
  const end = store[key]
  return typeof end === "number" ? end : null
}

/** True if email has an active trial (trial end in the future). */
export async function isOnActiveTrial(email: string): Promise<boolean> {
  const end = await getTrialEnd(email)
  if (end == null) return false
  return end > Math.floor(Date.now() / 1000)
}
