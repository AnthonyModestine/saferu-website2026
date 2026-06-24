"use client"

import { upload } from "@vercel/blob/client"
import {
  buildMediaPathname,
  isVideoFile,
  mediaKindFromFilename,
  SERVER_UPLOAD_MAX_BYTES,
} from "@/lib/media-filename"

export interface UploadMediaResult {
  url: string
  name: string
  kind: "image" | "video"
}

let clientUploadAvailable: boolean | null = null

async function canUseClientUpload(): Promise<boolean> {
  if (clientUploadAvailable !== null) return clientUploadAvailable
  try {
    const res = await fetch("/api/upload/capabilities")
    if (!res.ok) {
      clientUploadAvailable = false
      return false
    }
    const data = (await res.json()) as { clientUpload?: boolean }
    clientUploadAvailable = Boolean(data.clientUpload)
    return clientUploadAvailable
  } catch {
    clientUploadAvailable = false
    return false
  }
}

function shouldUseClientUpload(file: File, blobConfigured: boolean): boolean {
  if (!blobConfigured) return false
  return isVideoFile(file) || file.size > SERVER_UPLOAD_MAX_BYTES
}

async function uploadViaServer(file: File): Promise<UploadMediaResult> {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch("/api/upload", { method: "POST", body: form })
  const data = (await res.json().catch(() => ({}))) as { url?: string; name?: string; kind?: string; error?: string }
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? `Upload failed (${res.status})`)
  }
  return {
    url: data.url,
    name: data.name ?? file.name,
    kind: data.kind === "video" ? "video" : "image",
  }
}

async function uploadViaBlobClient(file: File): Promise<UploadMediaResult> {
  const isVideo = isVideoFile(file)
  const pathname = buildMediaPathname(file.name, isVideo)
  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/upload/blob",
    multipart: isVideo || file.size > 10 * 1024 * 1024,
    contentType: file.type || (isVideo ? "video/mp4" : undefined),
  })
  const name = pathname.replace(/^posts\//, "")
  return {
    url: blob.url,
    name,
    kind: mediaKindFromFilename(name),
  }
}

/** Upload an image or MP4 from the admin UI. Uses direct Blob upload for videos and large files on Vercel. */
export async function uploadAdminMediaFile(file: File): Promise<UploadMediaResult> {
  const blobConfigured = await canUseClientUpload()

  if (shouldUseClientUpload(file, blobConfigured)) {
    return uploadViaBlobClient(file)
  }

  return uploadViaServer(file)
}
