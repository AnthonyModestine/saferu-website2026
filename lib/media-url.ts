/** Detect whether a post media URL points to a video (MP4) or image. */

export type PostMediaKind = "image" | "video" | "unknown"

export function getPostMediaKind(url: string | null | undefined): PostMediaKind {
  if (!url?.trim()) return "unknown"
  const lower = url.split("?")[0]!.toLowerCase()
  if (/\.(mp4|m4v)$/.test(lower)) return "video"
  if (/\.(jpe?g|png|webp|gif|svg)$/.test(lower)) return "image"
  return "unknown"
}

export function isVideoMediaUrl(url: string | null | undefined): boolean {
  return getPostMediaKind(url) === "video"
}

export function isImageMediaUrl(url: string | null | undefined): boolean {
  return getPostMediaKind(url) === "image"
}
