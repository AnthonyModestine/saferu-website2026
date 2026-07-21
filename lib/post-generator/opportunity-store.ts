"use client"

import type { PostOpportunity } from "./types"

const STORAGE_KEY = "saferu_post_opportunity_history"

export type OpportunityHistory = {
  dismissedIds: string[]
  usedContentIds: string[]
  savedIds: string[]
  savedOpportunities: PostOpportunity[]
  /** Opportunity ids / fingerprints already marked posted — suppress until meaningfully updated. */
  postedFingerprints: string[]
  /** Recent topic keys (e.g. extreme_heat) for near-duplicate avoidance across days. */
  recentTopicKeys: string[]
  lastResult?: {
    generatedAt: string
    opportunities: PostOpportunity[]
  }
}

function emptyHistory(): OpportunityHistory {
  return {
    dismissedIds: [],
    usedContentIds: [],
    savedIds: [],
    savedOpportunities: [],
    postedFingerprints: [],
    recentTopicKeys: [],
  }
}

export function loadOpportunityHistory(): OpportunityHistory {
  if (typeof window === "undefined") return emptyHistory()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyHistory()
    const parsed = JSON.parse(raw) as OpportunityHistory
    return {
      dismissedIds: parsed.dismissedIds ?? [],
      usedContentIds: parsed.usedContentIds ?? [],
      savedIds: parsed.savedIds ?? [],
      savedOpportunities: parsed.savedOpportunities ?? [],
      postedFingerprints: parsed.postedFingerprints ?? [],
      recentTopicKeys: parsed.recentTopicKeys ?? [],
      lastResult: parsed.lastResult,
    }
  } catch {
    return emptyHistory()
  }
}

export function isResultFromToday(generatedAt?: string): boolean {
  if (!generatedAt) return false
  const generated = new Date(generatedAt)
  if (Number.isNaN(generated.getTime())) return false
  return generated.toDateString() === new Date().toDateString()
}

/** New day = a fresh briefing; long-term used-content history remains. */
export function loadDailyOpportunityHistory(): OpportunityHistory {
  const history = loadOpportunityHistory()
  if (!isResultFromToday(history.lastResult?.generatedAt)) {
    history.dismissedIds = []
    history.lastResult = undefined
    saveOpportunityHistory(history)
  }
  return history
}

/**
 * Drop canvas data-URLs before persisting. They are regenerated on the review
 * screen and easily exceed localStorage quota (~5MB) when many alerts are cached.
 */
function stripHeavyFields(opp: PostOpportunity): PostOpportunity {
  const next = { ...opp }
  if (next.graphicUrl?.startsWith("data:")) delete next.graphicUrl
  if (next.graphicThumbnailUrl?.startsWith("data:")) delete next.graphicThumbnailUrl
  return next
}

function slimHistory(history: OpportunityHistory): OpportunityHistory {
  return {
    ...history,
    savedOpportunities: history.savedOpportunities.map(stripHeavyFields),
    lastResult: history.lastResult
      ? {
          ...history.lastResult,
          opportunities: history.lastResult.opportunities.map(stripHeavyFields),
        }
      : undefined,
  }
}

export function saveOpportunityHistory(history: OpportunityHistory): void {
  if (typeof window === "undefined") return
  const slim = slimHistory(history)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
  } catch {
    // Quota exceeded or storage blocked — keep in-memory UX working; drop cache.
    try {
      const minimal: OpportunityHistory = {
        dismissedIds: slim.dismissedIds,
        usedContentIds: slim.usedContentIds,
        savedIds: slim.savedIds,
        savedOpportunities: [],
        postedFingerprints: slim.postedFingerprints,
        recentTopicKeys: slim.recentTopicKeys,
        lastResult: slim.lastResult
          ? { generatedAt: slim.lastResult.generatedAt, opportunities: [] }
          : undefined,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal))
    } catch {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }
  }
}

export function dismissOpportunity(id: string): void {
  const h = loadOpportunityHistory()
  if (!h.dismissedIds.includes(id)) h.dismissedIds.push(id)
  saveOpportunityHistory(h)
}

export function saveOpportunityForLater(opp: PostOpportunity): void {
  const h = loadOpportunityHistory()
  if (!h.savedIds.includes(opp.id)) {
    h.savedIds.push(opp.id)
    h.savedOpportunities = [opp, ...h.savedOpportunities.filter((o) => o.id !== opp.id)].slice(0, 20)
  }
  saveOpportunityHistory(h)
}

export function markContentUsed(contentId: string): void {
  const h = loadOpportunityHistory()
  if (!h.usedContentIds.includes(contentId)) h.usedContentIds.push(contentId)
  saveOpportunityHistory(h)
}

/** Mark any opportunity posted so it disappears and does not return without a meaningful update. */
export function markOpportunityPosted(opts: {
  opportunityId: string
  fingerprint?: string
  topicKey?: string
  contentId?: string
}): void {
  const h = loadOpportunityHistory()
  const prints = [opts.opportunityId, opts.fingerprint].filter(Boolean) as string[]
  for (const print of prints) {
    if (!h.postedFingerprints.includes(print)) h.postedFingerprints.push(print)
  }
  h.postedFingerprints = h.postedFingerprints.slice(-80)
  if (opts.contentId && !h.usedContentIds.includes(opts.contentId)) {
    h.usedContentIds.push(opts.contentId)
  }
  if (opts.topicKey) {
    h.recentTopicKeys = [opts.topicKey, ...h.recentTopicKeys.filter((k) => k !== opts.topicKey)].slice(
      0,
      24
    )
  }
  saveOpportunityHistory(h)
}

export const BRIEFING_CACHE_EVENT = "saferu-briefing-cache-updated"

export function cacheOpportunityResult(opportunities: PostOpportunity[], generatedAt: string): void {
  const h = loadOpportunityHistory()
  h.lastResult = { generatedAt, opportunities }
  saveOpportunityHistory(h)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BRIEFING_CACHE_EVENT))
  }
}

export function findCachedOpportunity(id: string): PostOpportunity | undefined {
  const h = loadOpportunityHistory()
  return h.lastResult?.opportunities.find((o) => o.id === id) ?? h.savedOpportunities.find((o) => o.id === id)
}

export function stashOpportunityForUse(opp: PostOpportunity): void {
  if (typeof window === "undefined") return
  const graphicUrl = opp.graphicUrl
  const graphicThumbnailUrl = opp.graphicThumbnailUrl
  // Keep a slim copy in sessionStorage; heavy data-URLs go to IndexedDB.
  const slim: PostOpportunity = { ...opp }
  if (slim.graphicUrl?.startsWith("data:")) delete slim.graphicUrl
  if (slim.graphicThumbnailUrl?.startsWith("data:")) delete slim.graphicThumbnailUrl
  try {
    sessionStorage.setItem("saferu_use_opportunity", JSON.stringify(slim))
  } catch {
    try {
      sessionStorage.setItem(
        "saferu_use_opportunity",
        JSON.stringify({ ...slim, graphicUrl: undefined, graphicThumbnailUrl: undefined })
      )
    } catch {
      /* ignore */
    }
  }
  if (graphicUrl?.startsWith("data:") || graphicThumbnailUrl?.startsWith("data:")) {
    void stashOpportunityGraphic(opp.id, graphicUrl || graphicThumbnailUrl || "")
  }
}

export async function loadStashedOpportunity(): Promise<PostOpportunity | null> {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem("saferu_use_opportunity")
    if (!raw) return null
    const opp = JSON.parse(raw) as PostOpportunity
    if (!opp.graphicUrl?.startsWith("data:")) {
      const graphic = await loadStashedOpportunityGraphic(opp.id)
      if (graphic) {
        opp.graphicUrl = graphic
        opp.graphicThumbnailUrl = graphic
      }
    }
    return opp
  } catch {
    return null
  }
}

const GRAPHIC_DB = "saferu-opportunity-graphics"
const GRAPHIC_STORE = "graphics"

function openGraphicDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(GRAPHIC_DB, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(GRAPHIC_STORE)) {
        db.createObjectStore(GRAPHIC_STORE, { keyPath: "id" })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error("graphic db open failed"))
  })
}

async function stashOpportunityGraphic(id: string, graphicUrl: string): Promise<void> {
  try {
    const db = await openGraphicDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(GRAPHIC_STORE, "readwrite")
      tx.objectStore(GRAPHIC_STORE).put({ id, graphicUrl, savedAt: Date.now() })
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.warn("[opportunity-store] graphic stash failed:", err)
  }
}

async function loadStashedOpportunityGraphic(id: string): Promise<string | null> {
  try {
    const db = await openGraphicDb()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(GRAPHIC_STORE, "readonly")
      const req = tx.objectStore(GRAPHIC_STORE).get(id)
      req.onsuccess = () => {
        const row = req.result as { graphicUrl?: string } | undefined
        resolve(row?.graphicUrl ?? null)
      }
      req.onerror = () => reject(req.error)
      tx.oncomplete = () => db.close()
    })
  } catch {
    return null
  }
}
