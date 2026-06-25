"use client"

import {
  isVideoFile,
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

const CHUNK_SIZE = 3 * 1024 * 1024
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

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? `Upload failed (${res.status})`)
  }

  onProgress?.({ loaded: file.size, total: file.size, percentage: 100, status: "uploading" })
  return {
    url: data.url,
    name: data.name ?? file.name,
    kind: data.kind === "video" ? "video" : "image",
  }
}

/** Large MP4: chunked upload through our API (each chunk < 4 MB), server writes to Blob. */
async function uploadLargeVideoChunked(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  onProgress?.({ loaded: 0, total: file.size, percentage: 2, status: "preparing" })

  const initRes = await withTimeout(
    fetch("/api/upload/video/init", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
      }),
    }),
    60_000,
    "Could not start video upload."
  )
  const initData = (await initRes.json().catch(() => ({}))) as {
    uploadId?: string
    totalParts?: number
    error?: string
  }
  if (!initRes.ok || !initData.uploadId || !initData.totalParts) {
    throw new Error(initData.error ?? `Could not start upload (${initRes.status})`)
  }

  const { uploadId, totalParts } = initData
  let uploaded = 0

  for (let partIndex = 0; partIndex < totalParts; partIndex++) {
    const start = partIndex * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, file.size)
    const chunk = file.slice(start, end)

    const form = new FormData()
    form.append("uploadId", uploadId)
    form.append("partIndex", String(partIndex))
    form.append("chunk", chunk, `part-${partIndex}`)

    const partRes = await withTimeout(
      fetch("/api/upload/video/part", {
        method: "POST",
        credentials: "same-origin",
        body: form,
      }),
      UPLOAD_TIMEOUT_MS,
      `Upload timed out on part ${partIndex + 1} of ${totalParts}.`
    )
    const partData = (await partRes.json().catch(() => ({}))) as { error?: string }
    if (!partRes.ok) {
      throw new Error(partData.error ?? `Chunk ${partIndex + 1} failed (${partRes.status})`)
    }

    uploaded += chunk.size
    const percentage = Math.max(5, Math.round((uploaded / file.size) * 95))
    onProgress?.({ loaded: uploaded, total: file.size, percentage, status: "uploading" })
  }

  onProgress?.({ loaded: file.size, total: file.size, percentage: 97, status: "uploading" })

  const completeRes = await withTimeout(
    fetch("/api/upload/video/complete", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadId }),
    }),
    UPLOAD_TIMEOUT_MS,
    "Finalizing upload timed out."
  )
  const result = (await completeRes.json().catch(() => ({}))) as UploadMediaResult & { error?: string }
  if (!completeRes.ok || !result.url) {
    throw new Error(result.error ?? `Could not finalize upload (${completeRes.status})`)
  }

  onProgress?.({ loaded: file.size, total: file.size, percentage: 100, status: "uploading" })
  return { url: result.url, name: result.name, kind: "video" }
}

/** Upload an image or MP4 from the admin UI. */
export async function uploadAdminMediaFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  const isVideo = isVideoFile(file)

  if (isVideo && file.size > SERVER_UPLOAD_MAX_BYTES) {
    return uploadLargeVideoChunked(file, onProgress)
  }

  return uploadViaServer(file, onProgress)
}
