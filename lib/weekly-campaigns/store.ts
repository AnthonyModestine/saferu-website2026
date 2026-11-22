import "server-only"

import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import type { WeeklyCampaignBatch } from "@/lib/weekly-campaigns/types"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "weekly-campaigns.json")
const MAX_BATCHES = 40

type FileStore = { batches: WeeklyCampaignBatch[] }

async function readFileStore(): Promise<FileStore> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as FileStore
    return Array.isArray(data.batches) ? data : { batches: [] }
  } catch {
    return { batches: [] }
  }
}

async function writeFileStore(store: FileStore): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf-8")
}

export async function listWeeklyCampaignBatches(): Promise<WeeklyCampaignBatch[]> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      SELECT payload FROM weekly_campaign_batches
      ORDER BY updated_at DESC
      LIMIT ${MAX_BATCHES}
    `
    return (rows as { payload: WeeklyCampaignBatch }[]).map((r) => r.payload)
  }
  const store = await readFileStore()
  return [...store.batches].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getWeeklyCampaignBatch(id: string): Promise<WeeklyCampaignBatch | null> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      SELECT payload FROM weekly_campaign_batches WHERE id = ${id} LIMIT 1
    `
    const row = (rows as { payload: WeeklyCampaignBatch }[])[0]
    return row?.payload ?? null
  }
  const store = await readFileStore()
  return store.batches.find((b) => b.id === id) ?? null
}

export async function saveWeeklyCampaignBatch(batch: WeeklyCampaignBatch): Promise<void> {
  const next = { ...batch, updatedAt: new Date().toISOString() }
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`
      INSERT INTO weekly_campaign_batches (id, payload, updated_at)
      VALUES (${next.id}, ${JSON.stringify(next)}::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_at = NOW()
    `
    return
  }
  const store = await readFileStore()
  const idx = store.batches.findIndex((b) => b.id === next.id)
  if (idx >= 0) store.batches[idx] = next
  else store.batches.unshift(next)
  store.batches = store.batches.slice(0, MAX_BATCHES)
  await writeFileStore(store)
}

export async function getLatestOpenBatch(): Promise<WeeklyCampaignBatch | null> {
  const batches = await listWeeklyCampaignBatches()
  return batches.find((b) => b.status === "open") ?? batches[0] ?? null
}
