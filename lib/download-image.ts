/** Trigger a file download for an image URL (works with cross-origin Blob/CDN URLs). */

function toAbsoluteUrl(imageSrc: string): string {
  if (imageSrc.startsWith("http://") || imageSrc.startsWith("https://")) {
    return imageSrc
  }
  if (typeof window === "undefined") return imageSrc
  return new URL(imageSrc, window.location.origin).href
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
  return cleaned.slice(0, 120) || "image"
}

function extensionFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const match = pathname.match(/\.(jpe?g|png|webp|gif)$/i)
    return match ? match[1]!.toLowerCase().replace("jpeg", "jpg") : null
  } catch {
    return null
  }
}

function extensionFromMime(mime: string | null): string {
  if (!mime) return "jpg"
  if (mime.includes("png")) return "png"
  if (mime.includes("webp")) return "webp"
  if (mime.includes("gif")) return "gif"
  return "jpg"
}

function ensureExtension(baseName: string, imageUrl: string, mime?: string | null): string {
  const base = safeFilename(baseName)
  if (/\.(jpe?g|png|webp|gif)$/i.test(base)) return base
  const ext = extensionFromUrl(imageUrl) ?? extensionFromMime(mime ?? null)
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

export async function downloadImageFile(
  imageSrc: string,
  baseFilename: string
): Promise<void> {
  const absoluteUrl = toAbsoluteUrl(imageSrc)
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
    throw new Error(data.error || "Could not download image")
  }
  const blob = await proxyRes.blob()
  filename = ensureExtension(baseFilename, absoluteUrl, blob.type || proxyRes.headers.get("content-type"))
  saveBlob(blob, filename)
}
