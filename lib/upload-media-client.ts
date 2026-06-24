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

const BLOB_SETUP_MESSAGE =
  "Video upload is not configured. In Vercel, connect SaferU-Images to saferu-backend, then redeploy."

const PREPARE_TIMEOUT_MS = 30_000
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000
const STALL_TIMEOUT_MS = 45_000

interface PreparedUpload {
  uploadUrl: string
  publicUrl: string
  name: string
  contentType: string
  kind: "image" | "video"
  uploadHeaders: Record<string, string>
}

function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  timeoutMessage: string
): Promise<Response> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  return fetch(input, { ...init, signal: controller.signal })
    .finally(() => window.clearTimeout(timer))
    .catch((err) => {
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(timeoutMessage)
      }
      throw err
    })
}

async function blobStorageAvailable(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      "/api/upload/capabilities",
      { credentials: "same-origin" },
      PREPARE_TIMEOUT_MS,
      "Timed out checking upload configuration."
    )
    if (!res.ok) return false
    const data = (await res.json()) as { blobStorage?: boolean; clientUpload?: boolean }
    return Boolean(data.blobStorage ?? data.clientUpload)
  } catch {
    return false
  }
}

async function prepareBlobUpload(file: File): Promise<PreparedUpload> {
  const res = await fetchWithTimeout(
    "/api/upload/prepare",
    {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        size: file.size,
        contentType: file.type,
        isVideo: isVideoFile(file),
      }),
    },
    PREPARE_TIMEOUT_MS,
    "Timed out preparing upload. Try again — if this keeps happening, check Vercel Blob is connected to saferu-backend."
  )
  const data = (await res.json().catch(() => ({}))) as PreparedUpload & { error?: string }
  if (!res.ok || !data.uploadUrl || !data.uploadHeaders) {
    throw new Error(data.error ?? BLOB_SETUP_MESSAGE)
  }
  return data
}

function putFileWithProgress(
  file: File,
  uploadUrl: string,
  uploadHeaders: Record<string, string>,
  fallbackUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl)

    for (const [key, value] of Object.entries(uploadHeaders)) {
      xhr.setRequestHeader(key, value)
    }

    let lastProgressAt = Date.now()
    let settled = false

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(uploadTimer)
      window.clearInterval(stallTimer)
      fn()
    }

    const uploadTimer = window.setTimeout(() => {
      xhr.abort()
      finish(() => reject(new Error("Upload timed out. Try again or use a smaller file.")))
    }, UPLOAD_TIMEOUT_MS)

    const stallTimer = window.setInterval(() => {
      if (Date.now() - lastProgressAt > STALL_TIMEOUT_MS) {
        xhr.abort()
        finish(() =>
          reject(
            new Error(
              "Upload stalled. Check your connection, then try again."
            )
          )
        )
      }
    }, 5000)

    xhr.upload.onprogress = (event) => {
      lastProgressAt = Date.now()
      if (!event.lengthComputable || !onProgress) return
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percentage: Math.min(99, Math.round((event.loaded / event.total) * 100)),
        status: "uploading",
      })
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { url?: string }
          if (data.url) {
            finish(() => resolve({ url: data.url }))
            return
          }
        } catch {
          // Empty success body — use prepared public URL
        }
        finish(() => resolve({ url: fallbackUrl }))
        return
      }

      let message = `Upload failed (HTTP ${xhr.status})`
      try {
        const data = JSON.parse(xhr.responseText) as { error?: string; message?: string }
        message = data.error ?? data.message ?? message
      } catch {
        if (xhr.responseText) {
          message = xhr.responseText.slice(0, 200)
        }
      }
      finish(() => reject(new Error(message)))
    }

    xhr.onerror = () => {
      finish(() =>
        reject(new Error("Could not reach storage. Check your connection and try again."))
      )
    }

    xhr.onabort = () => {
      finish(() => reject(new Error("Upload was cancelled or timed out.")))
    }

    onProgress?.({ loaded: 0, total: file.size, percentage: 2, status: "uploading" })
    xhr.send(file)
  })
}

async function uploadViaBlobDirect(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  onProgress?.({ loaded: 0, total: file.size, percentage: 1, status: "preparing" })

  const prepared = await prepareBlobUpload(file)

  onProgress?.({ loaded: 0, total: file.size, percentage: 3, status: "uploading" })

  const result = await putFileWithProgress(
    file,
    prepared.uploadUrl,
    prepared.uploadHeaders,
    prepared.publicUrl,
    onProgress
  )

  onProgress?.({ loaded: file.size, total: file.size, percentage: 100, status: "uploading" })

  return {
    url: result.url,
    name: prepared.name,
    kind: prepared.kind,
  }
}

async function uploadViaServer(file: File): Promise<UploadMediaResult> {
  const form = new FormData()
  form.append("file", file)
  const res = await fetchWithTimeout(
    "/api/upload",
    { method: "POST", credentials: "same-origin", body: form },
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
  return {
    url: data.url,
    name: data.name ?? file.name,
    kind: data.kind === "video" ? "video" : "image",
  }
}

/** Upload an image or MP4 from the admin UI. */
export async function uploadAdminMediaFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  const isVideo = isVideoFile(file)
  const blobOk = await blobStorageAvailable()

  if (isVideo) {
    if (!blobOk) throw new Error(BLOB_SETUP_MESSAGE)
    return uploadViaBlobDirect(file, onProgress)
  }

  if (file.size > SERVER_UPLOAD_MAX_BYTES) {
    if (!blobOk) throw new Error(BLOB_SETUP_MESSAGE)
    return uploadViaBlobDirect(file, onProgress)
  }

  return uploadViaServer(file)
}
