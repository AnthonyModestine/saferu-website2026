/** Shared media path helpers (safe for client and server). */

export const BLOB_PREFIX = "posts/"

/** Vercel serverless functions reject request bodies larger than ~4.5 MB. */
export const SERVER_UPLOAD_MAX_BYTES = 4 * 1024 * 1024

export function isVideoFile(file: File): boolean {
  return file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4")
}

export function sanitizeMediaFilename(originalName: string, fallbackExt = ".jpg"): string {
  const dot = originalName.lastIndexOf(".")
  let ext = dot >= 0 ? originalName.slice(dot) : fallbackExt
  if (!ext) ext = fallbackExt
  const baseName = dot >= 0 ? originalName.slice(0, dot) : originalName
  const base = baseName.replace(/[^a-z0-9-_]/gi, "-").slice(0, 40)
  return `${base}-${Date.now()}${ext.toLowerCase()}`
}

export function buildMediaPathname(originalName: string, isVideo: boolean): string {
  const fallbackExt = isVideo ? ".mp4" : ".jpg"
  return `${BLOB_PREFIX}${sanitizeMediaFilename(originalName, fallbackExt)}`
}

export function mediaKindFromFilename(name: string): "image" | "video" {
  return /\.mp4$/i.test(name) ? "video" : "image"
}
