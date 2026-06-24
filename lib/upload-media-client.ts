"use client"

import { upload, uploadPresigned } from "@vercel/blob/client"
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
  status?: "preparing" | "uploading"
}

const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms)
    promise
      .then((v) => {
        window.clearTimeout(timer)
        resolve(v)
      })
      .catch((e) => {
        window.clearTimeout(timer)
        reject(e)
      })
  })
}

async function uploadViaServer(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  onProgress?.({ loaded: 0, total: file.size, percentage: 10, status: "uploading" })

  const form = new FormData()
  form.append("file", file)
  const res = await withTimeout(
    fetch("/api/upload", { method: "POST", credentials: "same-origin", body: form }),
    UPLOAD_TIMEOUT_MS,
    "Upload timed out."
  )
  const data = (await res.json().catch(() => ({}))) as {
    url?: string
    name?: string
    kind?: string
    error?: string
  }

  if (res.status === 413) {
    throw new PayloadTooLargeError()
  }
  if (!res.ok || !data.url) {
    const err = data.error ?? `Upload failed (${res.status})`
    if (isPayloadTooLargeMessage(err)) {
      throw new PayloadTooLargeError()
    }
    throw new Error(err)
  }

  onProgress?.({ loaded: file.size, total: file.size, percentage: 100, status: "uploading" })
  return {
    url: data.url,
    name: data.name ?? file.name,
    kind: data.kind === "video" ? "video" : "image",
  }
}

class PayloadTooLargeError extends Error {
  constructor() {
    super("PAYLOAD_TOO_LARGE")
    this.name = "PayloadTooLargeError"
  }
}

function isPayloadTooLargeMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    lower.includes("413") ||
    lower.includes("too large") ||
    lower.includes("entity too large") ||
    lower.includes("body exceeded")
  )
}

function isPayloadTooLarge(error: unknown): boolean {
  return (
    error instanceof PayloadTooLargeError ||
    (error instanceof Error && isPayloadTooLargeMessage(error.message))
  )
}

function resultFromPathname(pathname: string, url: string): UploadMediaResult {
  const name = pathname.replace(/^posts\//, "")
  return { url, name, kind: mediaKindFromFilename(name) }
}

async function uploadLargeVideo(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  const pathname = buildMediaPathname(file.name, true)
  const contentType = file.type || "video/mp4"
  const multipart = file.size > 20 * 1024 * 1024

  onProgress?.({ loaded: 0, total: file.size, percentage: 3, status: "preparing" })

  const uploadOptions = {
    access: "public" as const,
    contentType,
    multipart,
    onUploadProgress: (p: { loaded: number; total: number; percentage: number }) => {
      onProgress?.({
        ...p,
        percentage: Math.max(5, p.percentage),
        status: "uploading",
      })
    },
  }

  let lastError: unknown

  try {
    const blob = await withTimeout(
      uploadPresigned(pathname, file, {
        ...uploadOptions,
        handleUploadUrl: "/api/upload/presigned",
      }),
      UPLOAD_TIMEOUT_MS,
      "Upload timed out. Try again on a faster connection."
    )
    onProgress?.({ loaded: file.size, total: file.size, percentage: 100, status: "uploading" })
    return resultFromPathname(pathname, blob.url)
  } catch (err) {
    lastError = err
  }

  try {
    const blob = await withTimeout(
      upload(pathname, file, {
        ...uploadOptions,
        handleUploadUrl: "/api/upload/blob",
      }),
      UPLOAD_TIMEOUT_MS,
      "Upload timed out. Try again on a faster connection."
    )
    onProgress?.({ loaded: file.size, total: file.size, percentage: 100, status: "uploading" })
    return resultFromPathname(pathname, blob.url)
  } catch (err) {
    const parts: string[] = []
    if (lastError instanceof Error && lastError.message) parts.push(lastError.message)
    if (err instanceof Error && err.message) parts.push(err.message)
    throw new Error(parts.join(" — ") || "Video upload failed")
  }
}

/** Upload an image or MP4 from the admin UI. */
export async function uploadAdminMediaFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  const isVideo = isVideoFile(file)

  if (!isVideo || file.size <= SERVER_UPLOAD_MAX_BYTES) {
    try {
      return await uploadViaServer(file, onProgress)
    } catch (err) {
      if (!isVideo || !isPayloadTooLarge(err)) {
        throw err
      }
    }
  }

  return uploadLargeVideo(file, onProgress)
}
