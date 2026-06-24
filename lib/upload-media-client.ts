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

const BLOB_SETUP_MESSAGE =
  "Video upload is not configured. In Vercel, connect SaferU-Images to saferu-backend, then redeploy."

const PREPARE_TIMEOUT_MS = 30_000
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000
const MULTIPART_THRESHOLD = 20 * 1024 * 1024

interface UploadCapabilities {
  blobStorage: boolean
  presignedUpload: boolean
  readWriteToken: boolean
}

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

async function getCapabilities(): Promise<UploadCapabilities> {
  const res = await withTimeout(
    fetch("/api/upload/capabilities", { credentials: "same-origin" }),
    PREPARE_TIMEOUT_MS,
    "Timed out checking upload configuration."
  )
  if (!res.ok) {
    return { blobStorage: false, presignedUpload: false, readWriteToken: false }
  }
  const data = (await res.json()) as Partial<UploadCapabilities & { clientUpload?: boolean }>
  const blobStorage = Boolean(data.blobStorage ?? data.clientUpload)
  return {
    blobStorage,
    presignedUpload: Boolean(data.presignedUpload ?? blobStorage),
    readWriteToken: Boolean(data.readWriteToken),
  }
}

async function uploadViaServer(file: File): Promise<UploadMediaResult> {
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
  return {
    url: data.url,
    name: data.name ?? file.name,
    kind: data.kind === "video" ? "video" : "image",
  }
}

async function uploadViaReadWriteToken(
  file: File,
  pathname: string,
  multipart: boolean,
  contentType: string,
  onProgress?: (progress: UploadProgress) => void
) {
  const tokenRes = await withTimeout(
    fetch("/api/upload/client-token", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pathname, multipart }),
    }),
    PREPARE_TIMEOUT_MS,
    "Timed out preparing upload."
  )
  const tokenData = (await tokenRes.json().catch(() => ({}))) as {
    clientToken?: string
    error?: string
  }
  if (!tokenRes.ok || !tokenData.clientToken) {
    throw new Error(tokenData.error ?? BLOB_SETUP_MESSAGE)
  }

  return withTimeout(
    put(pathname, file, {
      access: "public",
      token: tokenData.clientToken,
      multipart,
      contentType,
      onUploadProgress: (p) => onProgress?.({ ...p, status: "uploading" }),
    }),
    UPLOAD_TIMEOUT_MS,
    "Upload timed out."
  )
}

async function uploadViaPresignedSdk(
  file: File,
  pathname: string,
  multipart: boolean,
  contentType: string,
  onProgress?: (progress: UploadProgress) => void
) {
  return withTimeout(
    uploadPresigned(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/upload/presigned",
      multipart,
      contentType,
      onUploadProgress: (p) => onProgress?.({ ...p, status: "uploading" }),
    }),
    UPLOAD_TIMEOUT_MS,
    "Upload timed out."
  )
}

async function uploadViaBlobClient(
  file: File,
  caps: UploadCapabilities,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  const isVideo = isVideoFile(file)
  const pathname = buildMediaPathname(file.name, isVideo)
  const multipart = file.size > MULTIPART_THRESHOLD
  const contentType = file.type || (isVideo ? "video/mp4" : "application/octet-stream")

  onProgress?.({ loaded: 0, total: file.size, percentage: 2, status: "preparing" })

  let blob
  const errors: string[] = []

  if (caps.readWriteToken) {
    try {
      blob = await uploadViaReadWriteToken(file, pathname, multipart, contentType, onProgress)
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "read-write upload failed")
    }
  }

  if (!blob && caps.presignedUpload) {
    try {
      blob = await uploadViaPresignedSdk(file, pathname, multipart, contentType, onProgress)
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "presigned upload failed")
    }
  }

  if (!blob) {
    throw new Error(errors[0] ?? BLOB_SETUP_MESSAGE)
  }

  const name = pathname.replace(/^posts\//, "")
  onProgress?.({ loaded: file.size, total: file.size, percentage: 100, status: "uploading" })
  return { url: blob.url, name, kind: mediaKindFromFilename(name) }
}

/** Upload an image or MP4 from the admin UI. */
export async function uploadAdminMediaFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  const isVideo = isVideoFile(file)
  const caps = await getCapabilities()

  if (isVideo && !caps.presignedUpload && !caps.readWriteToken) {
    throw new Error(BLOB_SETUP_MESSAGE)
  }

  // Small videos (≤4MB): server-side OIDC put avoids browser→Blob CORS issues
  if (isVideo && file.size <= SERVER_UPLOAD_MAX_BYTES) {
    onProgress?.({ loaded: 0, total: file.size, percentage: 10, status: "uploading" })
    try {
      const result = await uploadViaServer(file)
      onProgress?.({ loaded: file.size, total: file.size, percentage: 100, status: "uploading" })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : ""
      if (!message.includes("too large") && !message.includes("413")) {
        throw err
      }
    }
  }

  if (isVideo || file.size > SERVER_UPLOAD_MAX_BYTES) {
    if (!caps.presignedUpload && !caps.readWriteToken) throw new Error(BLOB_SETUP_MESSAGE)
    return uploadViaBlobClient(file, caps, onProgress)
  }

  return uploadViaServer(file)
}
