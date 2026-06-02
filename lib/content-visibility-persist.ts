/**
 * Server-only: load/save content visibility (published/unpublished).
 * Uses Neon Postgres when DATABASE_URL / POSTGRES_URL is set (production),
 * otherwise falls back to data/content-visibility.json (local dev).
 */

import path from "path"
import { setUnpublishedKeys, getUnpublishedArticleKeys } from "@/lib/content-visibility"
import { isDatabaseConfigured, getSql, ensureSchema } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "content-visibility.json")

let loaded = false

// ── Database helpers ─────────────────────────────────────────────────────────

async function dbLoad(): Promise<void> {
  await ensureSchema()
  const db = getSql()
  const rows = await db`SELECT unpublished_keys FROM content_visibility WHERE id = 'singleton'`
  if (rows.length > 0) {
    const arr = rows[0].unpublished_keys as string[]
    if (Array.isArray(arr)) setUnpublishedKeys(arr)
  }
}

async function dbSave(arr: string[]): Promise<void> {
  await ensureSchema()
  const db = getSql()
  await db`
    INSERT INTO content_visibility (id, unpublished_keys) VALUES ('singleton', ${JSON.stringify(arr)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET unpublished_keys = EXCLUDED.unpublished_keys
  `
}

// ── File helpers ─────────────────────────────────────────────────────────────

function fileLoad(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require("fs").readFileSync(FILE_PATH, "utf-8")
    const arr = JSON.parse(raw) as string[]
    if (Array.isArray(arr)) setUnpublishedKeys(arr)
  } catch {
    // No file or invalid: keep default empty
  }
}

async function fileSave(arr: string[]): Promise<void> {
  const { mkdir, writeFile } = await import("fs/promises")
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(arr, null, 2), "utf-8")
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Load visibility state into memory. Call from server layout or before mutations. */
export async function loadVisibility(): Promise<void> {
  if (loaded) return
  loaded = true
  if (isDatabaseConfigured()) {
    await dbLoad()
  } else {
    fileLoad()
  }
}

/** Persist unpublished keys. Call from API after setArticlePublished. */
export async function persistVisibility(): Promise<void> {
  const arr = getUnpublishedArticleKeys()
  if (isDatabaseConfigured()) {
    await dbSave(arr)
  } else {
    await fileSave(arr)
  }
}
