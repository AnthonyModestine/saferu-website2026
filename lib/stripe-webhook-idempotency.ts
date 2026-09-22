/**
 * Idempotent Stripe webhook processing.
 * Claims an event id before side effects; duplicate deliveries no-op.
 */

import { readFile, writeFile, mkdir } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "stripe-processed-events.json")

interface FileStore {
  events: Record<string, { eventType: string; processedAt: number }>
}

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as FileStore
    return data?.events && typeof data.events === "object" ? data : { events: {} }
  } catch {
    return { events: {} }
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

/** Returns true if this is the first successful claim (caller should process). */
export async function claimStripeEvent(eventId: string, eventType: string): Promise<boolean> {
  const id = eventId?.trim()
  if (!id) return false
  const now = Math.floor(Date.now() / 1000)

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      INSERT INTO stripe_processed_events (event_id, event_type, processed_at)
      VALUES (${id}, ${eventType}, ${now})
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id
    `
    return (rows as { event_id: string }[]).length > 0
  }

  const store = await readFileStore()
  if (store.events[id]) return false
  store.events[id] = { eventType, processedAt: now }
  await writeFileStore(store)
  return true
}

/** Remove claim so Stripe retries can re-process after a handler failure. */
export async function releaseStripeEventClaim(eventId: string): Promise<void> {
  const id = eventId?.trim()
  if (!id) return

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM stripe_processed_events WHERE event_id = ${id}`
    return
  }

  const store = await readFileStore()
  if (store.events[id]) {
    delete store.events[id]
    await writeFileStore(store)
  }
}
