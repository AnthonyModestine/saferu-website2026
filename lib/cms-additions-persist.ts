/**
 * Server-only: load/save CMS additions to data/cms-additions.json.
 * Do not import this from client components or from modules used in the client bundle.
 */

import { readFileSync, writeFile, mkdir } from "fs"
import path from "path"
import { getAdditions, setAdditions, type CmsAdditions } from "@/lib/cms-additions"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "cms-additions.json")

let loaded = false

/** Load additions from file into memory. Call from server layout or before mutations. */
export function loadCmsAdditions(): void {
  if (loaded) return
  loaded = true
  try {
    const raw = readFileSync(FILE_PATH, "utf-8")
    const data = JSON.parse(raw) as CmsAdditions
    if (data && Array.isArray(data.subcategories) && Array.isArray(data.articles) && Array.isArray(data.posts)) {
      setAdditions({
        subcategories: data.subcategories,
        articles: data.articles,
        posts: data.posts,
      })
    }
  } catch {
    // No file or invalid: keep default empty
  }
}

/** Persist current additions to disk. Call after addArticle / addPost / addSubcategory. */
export function persistAdditions(): Promise<void> {
  loadCmsAdditions()
  const data = getAdditions()
  return mkdir(DATA_DIR, { recursive: true }).then(() =>
    writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf-8")
  )
}
