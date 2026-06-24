"use client"

import { put, uploadPresigned } from "@vercel/blob/client"
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
const MULTIPART_THRESHOLD_BYTES = 20 * 1024 * 1024

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

function resultFromPathname(pathname: string, url: string): UploadMediaResult {
  const name = pathname.replace(/^posts\//, "")
  return { url, name, kind: mediaKindFromFilename(name) }
}

async function uploadViaServer(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  onProgress?.({ loaded: 0, total: file.size, percentage: 15, status: "uploading" })

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
  return error instanceof PayloadTooLargeError || (
    error instanceof Error && isPayloadTooLargeMessage(error.message)
  )
}

async function fetchClientToken(
  pathname: string,
  multipart: boolean
): Promise<{ clientToken?: string; error?: string; usePresigned?: boolean }> {
  const res = await fetch("/api/upload/client-token", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pathname, multipart }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    clientToken?: string
    error?: string
  }

  if (res.ok && data.clientToken) {
    return { clientToken: data.clientToken }
  }

  return {
    error: data.error ?? `Could not prepare upload (${res.status})`,
    usePresigned: res.status === 503,
  }
}

async function uploadLargeVideo(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  const pathname = buildMediaPathname(file.name, true)
  const contentType = file.type || "video/mp4"
  const multipart = file.size > MULTIPART_THRESHOLD_BYTES

  onProgress?.({ loaded: 0, total: file.size, percentage: 5, status: "preparing" })

  const tokenPrep = await fetchClientToken(pathname, multipart)
  let lastError: unknown

  if (tokenPrep.clientToken) {
    try {
      const blob = await withTimeout(
        put(pathname, file, {
          access: "public",
          token: tokenPrep.clientToken,
          contentType,
          multipart,
          onUploadProgress: (p) => onProgress?.({ ...p, status: "uploading" }),
        }),
        UPLOAD_TIMEOUT_MS,
        "Upload timed out. Try again on a faster connection."
      )
      onProgress?.({ loaded: file.size, total: file.size, percentage: 100, status: "uploading" })
      return resultFromPathname(pathname, blob.url)
    } catch (err) {
      lastError = err
    }
  }

  // OIDC presigned upload — works with BLOB_STORE_ID (no read-write token required)
  try {
    const blob = await withTimeout(
      uploadPresigned(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/upload/presigned",
        contentType,
        multipart,
        onUploadProgress: (p) => onProgress?.({ ...p, status: "uploading" }),
      }),
      UPLOAD_TIMEOUT_MS,
      "Upload timed out. Try again on a faster connection."
    )
    onProgress?.({ loaded: file.size, total: file.size, percentage: 100, status: "uploading" })
    return resultFromPathname(pathname, blob.url)
  } catch (presignedErr) {
    const parts: string[] = []
    if (tokenPrep.error) parts.push(tokenPrep.error)
    if (lastError instanceof Error && lastError.message) parts.push(lastError.message)
    if (presignedErr instanceof Error && presignedErr.message) parts.push(presignedErr.message)
    const detail = [...new Set(parts.filter(Boolean))].join(" — ")
    throw new Error(detail || "Video upload failed. Try again or contact support.")
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
