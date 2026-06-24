/** Trigger a file download for a post image or MP4 video URL. */

function toAbsoluteUrl(mediaSrc: string): string {
  if (mediaSrc.startsWith("http://") || mediaSrc.startsWith("https://")) {
    return mediaSrc
  }
  if (typeof window === "undefined") return mediaSrc
  return new URL(mediaSrc, window.location.origin).href
}

function isSameOrigin(url: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return new URL(url).origin === window.location.origin
  } catch {
    return false
  }
}

function safeFilename(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
  return cleaned.slice(0, 120) || "download"
}

function extensionFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const match = pathname.match(/\.(jpe?g|png|webp|gif|mp4|m4v)$/i)
    if (!match) return null
    const ext = match[1]!.toLowerCase()
    return ext === "jpeg" ? "jpg" : ext
  } catch {
    return null
  }
}

function extensionFromMime(mime: string | null): string {
  if (!mime) return "jpg"
  if (mime.includes("mp4")) return "mp4"
  if (mime.includes("png")) return "png"
  if (mime.includes("webp")) return "webp"
  if (mime.includes("gif")) return "gif"
  return "jpg"
}

function ensureExtension(baseName: string, mediaUrl: string, mime?: string | null): string {
  const base = safeFilename(baseName)
  if (/\.(jpe?g|png|webp|gif|mp4|m4v)$/i.test(base)) return base
  const ext = extensionFromUrl(mediaUrl) ?? extensionFromMime(mime ?? null)
  return `${base}.${ext}`
}

function saveBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = filename
  link.rel = "noopener"
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

export async function downloadMediaFile(
  mediaSrc: string,
  baseFilename: string
): Promise<void> {
  const absoluteUrl = toAbsoluteUrl(mediaSrc)
  let filename = ensureExtension(baseFilename, absoluteUrl)

  if (isSameOrigin(absoluteUrl)) {
    try {
      const res = await fetch(absoluteUrl)
      if (!res.ok) throw new Error("fetch failed")
      const blob = await res.blob()
      filename = ensureExtension(baseFilename, absoluteUrl, blob.type)
      saveBlob(blob, filename)
      return
    } catch {
      // fall through to proxy
    }
  }

  const proxyRes = await fetch(
    `/api/download-image?url=${encodeURIComponent(absoluteUrl)}&filename=${encodeURIComponent(filename)}`
  )
  if (!proxyRes.ok) {
    const data = (await proxyRes.json().catch(() => ({}))) as { error?: string }
    throw new Error(data.error || "Could not download file")
  }
  const blob = await proxyRes.blob()
  filename = ensureExtension(baseFilename, absoluteUrl, blob.type || proxyRes.headers.get("content-type"))
  saveBlob(blob, filename)
}

/** @deprecated Use downloadMediaFile */
export const downloadImageFile = downloadMediaFile
