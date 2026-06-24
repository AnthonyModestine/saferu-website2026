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
}

const BLOB_SETUP_MESSAGE =
  "Video upload is not configured. In Vercel, connect SaferU-Images to saferu-backend, then redeploy."

const UPLOAD_TIMEOUT_MS = 15 * 60 * 1000

interface PreparedUpload {
  uploadUrl: string
  publicUrl: string
  name: string
  contentType: string
  kind: "image" | "video"
}

async function blobStorageAvailable(): Promise<boolean> {
  try {
    const res = await fetch("/api/upload/capabilities", { credentials: "same-origin" })
    if (!res.ok) return false
    const data = (await res.json()) as { blobStorage?: boolean; clientUpload?: boolean }
    return Boolean(data.blobStorage ?? data.clientUpload)
  } catch {
    return false
  }
}

async function prepareBlobUpload(file: File): Promise<PreparedUpload> {
  const res = await fetch("/api/upload/prepare", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      size: file.size,
      contentType: file.type,
      isVideo: isVideoFile(file),
    }),
  })
  const data = (await res.json().catch(() => ({}))) as PreparedUpload & { error?: string }
  if (!res.ok || !data.uploadUrl) {
    throw new Error(data.error ?? BLOB_SETUP_MESSAGE)
  }
  return data
}

function putFileWithProgress(
  file: File,
  uploadUrl: string,
  contentType: string,
  fallbackUrl: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl)
    xhr.setRequestHeader("Content-Type", contentType)

    const timer = window.setTimeout(() => {
      xhr.abort()
      reject(new Error("Upload timed out. Try again or use a smaller file."))
    }, UPLOAD_TIMEOUT_MS)

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percentage: Math.min(99, Math.round((event.loaded / event.total) * 100)),
      })
    }

    xhr.onload = () => {
      window.clearTimeout(timer)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as { url?: string }
          if (data.url) {
            resolve({ url: data.url })
            return
          }
        } catch {
          // Blob sometimes returns empty body on success — use prepared public URL
        }
        resolve({ url: fallbackUrl })
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
      reject(new Error(message))
    }

    xhr.onerror = () => {
      window.clearTimeout(timer)
      reject(new Error("Network error while uploading to storage. Check your connection and try again."))
    }

    xhr.onabort = () => {
      window.clearTimeout(timer)
      reject(new Error("Upload was cancelled or timed out."))
    }

    xhr.send(file)
  })
}

async function uploadViaBlobDirect(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  onProgress?.({ loaded: 0, total: file.size, percentage: 0 })

  const prepared = await prepareBlobUpload(file)
  const contentType =
    prepared.contentType || file.type || (prepared.kind === "video" ? "video/mp4" : "application/octet-stream")

  const result = await putFileWithProgress(
    file,
    prepared.uploadUrl,
    contentType,
    prepared.publicUrl,
    onProgress
  )

  onProgress?.({ loaded: file.size, total: file.size, percentage: 100 })

  return {
    url: result.url,
    name: prepared.name,
    kind: prepared.kind,
  }
}

async function uploadViaServer(file: File): Promise<UploadMediaResult> {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch("/api/upload", { method: "POST", credentials: "same-origin", body: form })
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
