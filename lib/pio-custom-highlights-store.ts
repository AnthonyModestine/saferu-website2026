/**
 * User-saved custom event highlights (client localStorage).
 */

const STORAGE_KEY = "pio_custom_event_highlights"

function getStorage(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string" && s.trim()) : []
  } catch {
    return []
  }
}

function setStorage(items: string[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export function getCustomEventHighlights(): string[] {
  return getStorage().sort((a, b) => a.localeCompare(b))
}

export function saveCustomEventHighlight(label: string): string[] {
  const tag = label.trim()
  if (!tag) return getCustomEventHighlights()
  const all = getStorage()
  if (!all.some((h) => h.toLowerCase() === tag.toLowerCase())) {
    all.push(tag)
    setStorage(all)
  }
  return getCustomEventHighlights()
}

export function deleteCustomEventHighlight(label: string): string[] {
  setStorage(getStorage().filter((h) => h !== label))
  return getCustomEventHighlights()
}
