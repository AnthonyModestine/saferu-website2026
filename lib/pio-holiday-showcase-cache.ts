/**
 * Persist AI holiday showcase graphics across client navigations.
 * Uses an in-memory module cache (same tab SPA) + IndexedDB (reload / return).
 * localStorage is intentionally avoided — 15 × data-URL PNGs blow the ~5MB quota.
 */

import type { PostOpportunity } from "@/lib/post-generator/types"

const DB_NAME = "saferu-holiday-showcase"
const DB_VERSION = 1
const STORE = "showcases"
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type HolidayShowcaseCacheEntry = {
  key: string
  agencyName: string
  logoUrl: string
  savedAt: string
  opportunities: PostOpportunity[]
  aiReady: boolean
}

let memoryCache: HolidayShowcaseCacheEntry | null = null

export function holidayShowcaseCacheKey(agencyName: string, logoUrl?: string | null): string {
  return `${(agencyName || "").trim().toLowerCase()}|${(logoUrl || "").trim()}`
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error("Failed to open holiday cache DB"))
  })
}

function idbGet(key: string): Promise<HolidayShowcaseCacheEntry | null> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly")
        const req = tx.objectStore(STORE).get(key)
        req.onsuccess = () => resolve((req.result as HolidayShowcaseCacheEntry | undefined) ?? null)
        req.onerror = () => reject(req.error ?? new Error("Failed to read holiday cache"))
        tx.oncomplete = () => db.close()
      })
  )
}

function idbPut(entry: HolidayShowcaseCacheEntry): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite")
        tx.objectStore(STORE).put(entry)
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error ?? new Error("Failed to write holiday cache"))
      })
  )
}

function idbDelete(key: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite")
        tx.objectStore(STORE).delete(key)
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error ?? new Error("Failed to delete holiday cache"))
      })
  )
}

function isFresh(entry: HolidayShowcaseCacheEntry): boolean {
  const savedAt = new Date(entry.savedAt).getTime()
  if (Number.isNaN(savedAt)) return false
  return Date.now() - savedAt < CACHE_TTL_MS
}

function hasUsableGraphics(opportunities: PostOpportunity[]): boolean {
  if (!opportunities.length) return false
  const withGraphics = opportunities.filter((o) => o.graphicUrl?.startsWith("data:"))
  // Require most cards to have graphics so a partial/failed run isn't sticky.
  return withGraphics.length >= Math.ceil(opportunities.length * 0.6)
}

export async function loadHolidayShowcaseCache(
  agencyName: string,
  logoUrl?: string | null
): Promise<HolidayShowcaseCacheEntry | null> {
  const key = holidayShowcaseCacheKey(agencyName, logoUrl)

  if (
    memoryCache &&
    memoryCache.key === key &&
    isFresh(memoryCache) &&
    hasUsableGraphics(memoryCache.opportunities)
  ) {
    return memoryCache
  }

  try {
    const entry = await idbGet(key)
    if (!entry || !isFresh(entry) || !hasUsableGraphics(entry.opportunities)) {
      return null
    }
    memoryCache = entry
    return entry
  } catch (err) {
    console.warn("[holiday-showcase-cache] load failed:", err)
    return null
  }
}

export async function saveHolidayShowcaseCache(opts: {
  agencyName: string
  logoUrl?: string | null
  opportunities: PostOpportunity[]
  aiReady: boolean
}): Promise<void> {
  const key = holidayShowcaseCacheKey(opts.agencyName, opts.logoUrl)
  const entry: HolidayShowcaseCacheEntry = {
    key,
    agencyName: opts.agencyName,
    logoUrl: opts.logoUrl || "",
    savedAt: new Date().toISOString(),
    opportunities: opts.opportunities.map((o) => ({ ...o })),
    aiReady: opts.aiReady,
  }
  memoryCache = entry
  try {
    await idbPut(entry)
  } catch (err) {
    console.warn("[holiday-showcase-cache] save failed:", err)
  }
}

export async function clearHolidayShowcaseCache(
  agencyName: string,
  logoUrl?: string | null
): Promise<void> {
  const key = holidayShowcaseCacheKey(agencyName, logoUrl)
  if (memoryCache?.key === key) memoryCache = null
  try {
    await idbDelete(key)
  } catch (err) {
    console.warn("[holiday-showcase-cache] clear failed:", err)
  }
}
