/**
 * Server-only: load/save content visibility (published/unpublished) to data/content-visibility.json.
 * Do not import this from client components or from modules used in the client bundle.
 */

import { readFileSync, writeFile, mkdir } from "fs"
import path from "path"
import {
  setUnpublishedKeys,
  getUnpublishedArticleKeys,
} from "@/lib/content-visibility"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "content-visibility.json")

let loaded = false

/** Load visibility state from file into memory. Call from server layout or before mutations. */
export function loadVisibility(): void {
  if (loaded) return
  loaded = true
  try {
    const raw = readFileSync(FILE_PATH, "utf-8")
    const arr = JSON.parse(raw) as string[]
    if (Array.isArray(arr)) {
      setUnpublishedKeys(arr)
    }
  } catch {
    // No file or invalid: keep default empty
  }
}

/** Persist unpublished keys to disk. Call from API after setArticlePublished. */
export function persistVisibility(): Promise<void> {
  loadVisibility()
  const arr = getUnpublishedArticleKeys()
  return mkdir(DATA_DIR, { recursive: true }).then(() =>
    writeFile(FILE_PATH, JSON.stringify(arr, null, 2), "utf-8")
  )
}
