/**
 * Server-only: load/save content meta to Neon or local JSON.
 */

import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import {
  getContentMeta,
  setContentMeta,
  type ContentMeta,
} from "@/lib/content-meta-store"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "content-meta.json")

let loadPromise: Promise<void> | null = null

async function dbLoad(): Promise<ContentMeta> {
  await ensureSchema()
  const rows = await getSql()`SELECT data FROM content_meta WHERE id = 'singleton'`
  if (rows.length === 0) {
    return {
      subcategoryOrder: {},
      articleOrder: {},
      postOrder: {},
      imageOverrides: {},
      messageOverrides: {},
    }
  }
  const raw = (rows[0] as { data: unknown }).data
  return typeof raw === "object" && raw !== null ? (raw as ContentMeta) : getContentMeta()
}

async function dbSave(data: ContentMeta): Promise<void> {
  await ensureSchema()
  await getSql()`
    INSERT INTO content_meta (id, data) VALUES ('singleton', ${data})
    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
  `
}

async function fileLoad(): Promise<ContentMeta> {
  try {
    const raw = await readFile(FILE_PATH, "utf-8")
    return JSON.parse(raw) as ContentMeta
  } catch {
    return {
      subcategoryOrder: {},
      articleOrder: {},
      postOrder: {},
      imageOverrides: {},
      messageOverrides: {},
    }
  }
}

async function fileSave(data: ContentMeta): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  await writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf-8")
}

export async function loadContentMeta(): Promise<void> {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    const loaded = isDatabaseConfigured() ? await dbLoad() : await fileLoad()
    setContentMeta(loaded)
  })()
  return loadPromise
}

export async function persistContentMeta(): Promise<void> {
  const snapshot = { ...getContentMeta() }
  if (isDatabaseConfigured()) {
    await dbSave(snapshot)
  } else {
    await fileSave(snapshot)
  }
}

export async function reloadContentMeta(): Promise<void> {
  loadPromise = null
  await loadContentMeta()
}
