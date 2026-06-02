/**
 * PIO Tool history: press releases and video requests.
 * Stored in localStorage (key: pio_history). Client-only.
 * Items older than 30 days are excluded and removed on load.
 */

const STORAGE_KEY = "pio_history"
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000

export type PioHistoryItem = {
  id: string
  title: string
  type: string
  format: "Press Release" | "Video Request"
  date: string
  lastModified: string
  content: string
}

function getStorage(): PioHistoryItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PioHistoryItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function setStorage(items: PioHistoryItem[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

function isWithin30Days(dateStr: string): boolean {
  const t = new Date(dateStr).getTime()
  return Number.isFinite(t) && Date.now() - t <= ONE_MONTH_MS
}

/** Returns items from the last 30 days and removes older ones from storage. */
export function getPioHistoryItems(): PioHistoryItem[] {
  const all = getStorage()
  const kept = all.filter((item) => isWithin30Days(item.date))
  if (kept.length !== all.length) {
    setStorage(kept)
  }
  return kept.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/** Add an item to history. Automatically removes entries older than 30 days. */
export function addPioHistoryItem(params: {
  title: string
  type: string
  format: "Press Release" | "Video Request"
  content: string
}): PioHistoryItem {
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const lastModified = now.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
  const item: PioHistoryItem = {
    id: crypto.randomUUID(),
    title: params.title,
    type: params.type,
    format: params.format,
    date: dateStr,
    lastModified,
    content: params.content,
  }
  const all = getStorage()
  const kept = all.filter((i) => isWithin30Days(i.date))
  kept.unshift(item)
  setStorage(kept)
  return item
}

/** Remove an item by id. */
export function deletePioHistoryItem(id: string): void {
  const all = getStorage()
  const filtered = all.filter((item) => item.id !== id)
  setStorage(filtered)
}
