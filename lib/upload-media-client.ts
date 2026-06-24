"use client"

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

interface PreparedUpload {
  uploadUrl: string
  publicUrl: string
  name: string
  kind: "image" | "video"
  uploadHeaders: Record<string, string>
}

const PREPARE_TIMEOUT_MS = 45_000
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

async function prepareDirectUpload(file: File, isVideo: boolean): Promise<PreparedUpload> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), PREPARE_TIMEOUT_MS)

  try {
    const res = await fetch("/api/upload/prepare", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
        contentType: file.type || (isVideo ? "video/mp4" : "application/octet-stream"),
        isVideo,
      }),
      signal: controller.signal,
    })

    const data = (await res.json().catch(() => ({}))) as PreparedUpload & { error?: string }
    if (!res.ok || !data.uploadUrl || !data.publicUrl) {
      throw new Error(data.error ?? `Could not prepare upload (${res.status})`)
    }

    return data
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Preparing upload timed out. Refresh the page and try again.")
    }
    throw err
  } finally {
    window.clearTimeout(timer)
  }
}

function xhrPutToBlob(
  file: File,
  prepared: PreparedUpload,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const timeout = window.setTimeout(() => {
      xhr.abort()
      reject(new Error("Upload timed out. Try again on a faster connection."))
    }, UPLOAD_TIMEOUT_MS)

    xhr.open("PUT", prepared.uploadUrl, true)
    for (const [key, value] of Object.entries(prepared.uploadHeaders)) {
      xhr.setRequestHeader(key, value)
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      const percentage = Math.max(5, Math.round((event.loaded / event.total) * 100))
      onProgress?.({
        loaded: event.loaded,
        total: event.total,
        percentage,
        status: "uploading",
      })
    }

    xhr.onload = () => {
      window.clearTimeout(timeout)
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      const detail = xhr.responseText?.trim()
      reject(
        new Error(
          detail
            ? `Storage rejected upload (${xhr.status}): ${detail.slice(0, 200)}`
            : `Storage rejected upload (${xhr.status})`
        )
      )
    }

    xhr.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error("Network error while uploading to storage. Check your connection and try again."))
    }

    xhr.onabort = () => {
      window.clearTimeout(timeout)
      reject(new Error("Upload cancelled."))
    }

    onProgress?.({ loaded: 0, total: file.size, percentage: 5, status: "uploading" })
    xhr.send(file)
  })
}

async function uploadLargeVideo(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  onProgress?.({ loaded: 0, total: file.size, percentage: 2, status: "preparing" })

  const prepared = await prepareDirectUpload(file, true)

  onProgress?.({ loaded: 0, total: file.size, percentage: 8, status: "uploading" })
  await xhrPutToBlob(file, prepared, onProgress)

  onProgress?.({ loaded: file.size, total: file.size, percentage: 100, status: "uploading" })
  return {
    url: prepared.publicUrl,
    name: prepared.name,
    kind: prepared.kind,
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
