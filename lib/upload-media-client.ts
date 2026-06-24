"use client"

import { put } from "@vercel/blob/client"
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

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

const BLOB_SETUP_MESSAGE =
  "Video upload is not configured. Add BLOB_READ_WRITE_TOKEN to saferu-backend in Vercel, then redeploy."

/** Use multipart only above this size (single PUT is faster and more reliable for smaller videos). */
const MULTIPART_THRESHOLD_BYTES = 8 * 1024 * 1024

const UPLOAD_TIMEOUT_MS = 15 * 60 * 1000

let clientUploadAvailable: boolean | null = null

async function canUseClientUpload(): Promise<boolean> {
  if (clientUploadAvailable !== null) return clientUploadAvailable
  try {
    const res = await fetch("/api/upload/capabilities", { credentials: "same-origin" })
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

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

async function uploadViaServer(file: File): Promise<UploadMediaResult> {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch("/api/upload", { method: "POST", credentials: "same-origin", body: form })
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

async function uploadViaBlobClient(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  const isVideo = isVideoFile(file)
  const pathname = buildMediaPathname(file.name, isVideo)
  const multipart = file.size > MULTIPART_THRESHOLD_BYTES

  const tokenRes = await fetch("/api/upload/client-token", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pathname, multipart }),
  })
  const tokenData = (await tokenRes.json().catch(() => ({}))) as {
    clientToken?: string
    error?: string
  }
  if (!tokenRes.ok || !tokenData.clientToken) {
    throw new Error(tokenData.error ?? BLOB_SETUP_MESSAGE)
  }

  const contentType = file.type || (isVideo ? "video/mp4" : "application/octet-stream")

  const blob = await withTimeout(
    put(pathname, file, {
      access: "public",
      token: tokenData.clientToken,
      multipart,
      contentType,
      onUploadProgress: onProgress,
    }),
    UPLOAD_TIMEOUT_MS,
    "Upload timed out. Check your connection and try again, or use a smaller file."
  )

  const name = pathname.replace(/^posts\//, "")
  return {
    url: blob.url,
    name,
    kind: mediaKindFromFilename(name),
  }
}

/** Upload an image or MP4 from the admin UI. Uses direct Blob upload for videos and large files on Vercel. */
export async function uploadAdminMediaFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  const isVideo = isVideoFile(file)
  const blobConfigured = await canUseClientUpload()

  if (isVideo && !blobConfigured) {
    throw new Error(BLOB_SETUP_MESSAGE)
  }

  if (shouldUseClientUpload(file, blobConfigured)) {
    return uploadViaBlobClient(file, onProgress)
  }

  return uploadViaServer(file)
}
