/**
 * Server-only: load/save CMS additions.
 * Uses Neon Postgres when DATABASE_URL / POSTGRES_URL is set (production),
 * otherwise falls back to data/cms-additions.json (local dev).
 */

import path from "path"
import { getAdditions, setAdditions, type CmsAdditions } from "@/lib/cms-additions"
import { isDatabaseConfigured, getSql, ensureSchema } from "@/lib/db"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "cms-additions.json")

const EMPTY: CmsAdditions = { subcategories: [], articles: [], posts: [] }

let loaded = false

// ── Database helpers ────────────────────────────────────────────────────────

async function dbLoad(): Promise<void> {
  await ensureSchema()
  const db = getSql()
  const rows = await db`SELECT data FROM cms_additions WHERE id = 'singleton'`
  if (rows.length > 0) {
    const data = rows[0].data as CmsAdditions
    setAdditions({
      subcategories: data.subcategories || [],
      articles: data.articles || [],
      posts: data.posts || [],
    })
  }
}

async function dbSave(data: CmsAdditions): Promise<void> {
  await ensureSchema()
  const db = getSql()
  await db`
    INSERT INTO cms_additions (id, data) VALUES ('singleton', ${JSON.stringify(data)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `
}

// ── File helpers ─────────────────────────────────────────────────────────────

function fileLoad(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require("fs").readFileSync(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as CmsAdditions
    if (data && Array.isArray(data.subcategories) && Array.isArray(data.articles) && Array.isArray(data.posts)) {
      setAdditions(data)
    }
  } catch {
    // No file or invalid: keep default empty
  }
}

async function fileSave(data: CmsAdditions): Promise<void> {
  const { mkdir, writeFile } = await import("fs/promises")
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf-8")
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Load additions into memory. Async when using DB, sync fallback for file.
 * Call before any read or mutation.
 */
export async function loadCmsAdditions(): Promise<void> {
  if (loaded) return
  loaded = true
  setAdditions({ ...EMPTY })
  if (isDatabaseConfigured()) {
    await dbLoad()
  } else {
    fileLoad()
  }
}

/** Persist current in-memory additions. Call after addArticle / addPost / addSubcategory. */
export async function persistAdditions(): Promise<void> {
  const data = getAdditions()
  if (isDatabaseConfigured()) {
    await dbSave(data)
  } else {
    await fileSave(data)
  }
}
