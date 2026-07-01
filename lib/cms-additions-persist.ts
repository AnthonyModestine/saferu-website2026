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

const EMPTY: CmsAdditions = {
  subcategories: [],
  articles: [],
  posts: [],
  deletedPosts: [],
  deletedArticles: [],
  subcategoryOverrides: [],
  deletedSubcategories: [],
}

let fileLoadPromise: Promise<void> | null = null

function parseCmsData(raw: unknown): CmsAdditions {
  let value = raw
  if (typeof value === "string") {
    try {
      value = JSON.parse(value)
    } catch {
      return { ...EMPTY }
    }
  }
  if (!value || typeof value !== "object") {
    return { ...EMPTY }
  }
  const data = value as Partial<CmsAdditions>
  return {
    subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],
    articles: dedupeCmsArticles(Array.isArray(data.articles) ? data.articles : []),
    posts: Array.isArray(data.posts) ? data.posts : [],
    deletedPosts: Array.isArray(data.deletedPosts) ? data.deletedPosts : [],
    deletedArticles: Array.isArray(data.deletedArticles) ? data.deletedArticles : [],
    subcategoryOverrides: Array.isArray(data.subcategoryOverrides) ? data.subcategoryOverrides : [],
    deletedSubcategories: Array.isArray(data.deletedSubcategories) ? data.deletedSubcategories : [],
  }
}

function dedupeCmsArticles(
  articles: CmsAdditions["articles"]
): CmsAdditions["articles"] {
  const byKey = new Map<string, CmsAdditions["articles"][number]>()
  for (const art of articles) {
    byKey.set(`${art.categoryId}::${art.subcategoryId}::${art.id}`, art)
  }
  return Array.from(byKey.values())
}

async function dbLoad(): Promise<CmsAdditions> {
  await ensureSchema()
  const db = getSql()
  const rows = await db`SELECT data FROM cms_additions WHERE id = 'singleton'`
  if (rows.length === 0) return { ...EMPTY }
  return parseCmsData(rows[0].data)
}

async function dbSave(data: CmsAdditions): Promise<void> {
  await ensureSchema()
  const db = getSql()
  await db`
    INSERT INTO cms_additions (id, data) VALUES ('singleton', ${data})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `
}

function fileLoad(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require("fs").readFileSync(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as CmsAdditions
    if (data && Array.isArray(data.subcategories) && Array.isArray(data.articles) && Array.isArray(data.posts)) {
      setAdditions(data)
      return
    }
  } catch {
    // No file or invalid: keep default empty
  }
  setAdditions({ ...EMPTY })
}

async function fileSave(data: CmsAdditions): Promise<void> {
  const { mkdir, writeFile } = await import("fs/promises")
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf-8")
}

/**
 * Load additions into memory.
 * With Postgres: always reads fresh from DB (no stale serverless cache).
 * Without Postgres: loads from file once per process.
 * Concurrent callers within the same request share one in-flight load.
 */
let inFlightLoad: Promise<void> | null = null

async function loadFromSource(): Promise<void> {
  if (isDatabaseConfigured()) {
    setAdditions(await dbLoad())
    return
  }

  if (!fileLoadPromise) {
    fileLoadPromise = Promise.resolve().then(() => fileLoad())
  }
  await fileLoadPromise
}

export async function loadCmsAdditions(): Promise<void> {
  if (inFlightLoad) {
    await inFlightLoad
    return
  }

  inFlightLoad = loadFromSource().finally(() => {
    inFlightLoad = null
  })
  await inFlightLoad
}

/** Force a fresh load from DB/file. */
export async function reloadCmsAdditions(): Promise<void> {
  inFlightLoad = null
  fileLoadPromise = null
  await loadCmsAdditions()
}

/** Persist current in-memory additions. Verifies DB round-trip when configured. */
export async function persistAdditions(): Promise<void> {
  const data = getAdditions()
  if (isDatabaseConfigured()) {
    await dbSave(data)
    const saved = await dbLoad()
    if (saved.articles.length < data.articles.length) {
      throw new Error("CMS save verification failed: article count mismatch after persist")
    }
    setAdditions(saved)
    return
  }
  await fileSave(data)
  fileLoadPromise = null
}
