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

let fileLoadPromise: Promise<void> | null = null

function parseKeys(raw: unknown): string[] {
  let value = raw
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return []
    }
  }
  return Array.isArray(value) ? value.filter((k): k is string => typeof k === "string") : []
}

async function dbLoad(): Promise<string[]> {
  await ensureSchema()
  const db = getSql()
  const rows = await db`SELECT unpublished_keys FROM content_visibility WHERE id = 'singleton'`
  if (rows.length === 0) return []
  return parseKeys(rows[0].unpublished_keys)
}

async function dbSave(arr: string[]): Promise<void> {
  await ensureSchema()
  const db = getSql()
  await db`
    INSERT INTO content_visibility (id, unpublished_keys) VALUES ('singleton', ${arr})
    ON CONFLICT (id) DO UPDATE SET unpublished_keys = EXCLUDED.unpublished_keys
  `
}

function fileLoad(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require("fs").readFileSync(FILE_PATH, "utf-8")
    const arr = JSON.parse(raw) as string[]
    if (Array.isArray(arr)) {
      setUnpublishedKeys(arr)
      return
    }
  } catch {
    // No file or invalid: keep default empty
  }
  setUnpublishedKeys([])
}

async function fileSave(arr: string[]): Promise<void> {
  const { mkdir, writeFile } = await import("fs/promises")
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(arr, null, 2), "utf-8")
}

/** Load visibility state into memory. Postgres: always fresh from DB. */
export async function loadVisibility(): Promise<void> {
  if (isDatabaseConfigured()) {
    setUnpublishedKeys(await dbLoad())
    return
  }

  if (!fileLoadPromise) {
    fileLoadPromise = Promise.resolve().then(() => fileLoad())
  }
  await fileLoadPromise
}

/** Persist unpublished keys. */
export async function persistVisibility(): Promise<void> {
  const arr = getUnpublishedArticleKeys()
  if (isDatabaseConfigured()) {
    await dbSave(arr)
    setUnpublishedKeys(await dbLoad())
    return
  }
  await fileSave(arr)
  fileLoadPromise = null
}
