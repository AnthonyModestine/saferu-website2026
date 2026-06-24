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
}

const BLOB_SETUP_MESSAGE =
  "Video upload is not configured. In Vercel, connect SaferU-Images to saferu-backend (Production + Preview), then redeploy."

const MULTIPART_THRESHOLD_BYTES = 20 * 1024 * 1024
const UPLOAD_TIMEOUT_MS = 15 * 60 * 1000

interface UploadCapabilities {
  clientUpload: boolean
  presignedUpload: boolean
  readWriteToken: boolean
}

let cachedCapabilities: UploadCapabilities | null = null

async function getUploadCapabilities(): Promise<UploadCapabilities> {
  if (cachedCapabilities) return cachedCapabilities
  try {
    const res = await fetch("/api/upload/capabilities", { credentials: "same-origin" })
    if (!res.ok) {
      cachedCapabilities = { clientUpload: false, presignedUpload: false, readWriteToken: false }
      return cachedCapabilities
    }
    const data = (await res.json()) as Partial<UploadCapabilities>
    cachedCapabilities = {
      clientUpload: Boolean(data.clientUpload),
      presignedUpload: Boolean(data.presignedUpload),
      readWriteToken: Boolean(data.readWriteToken),
    }
    return cachedCapabilities
  } catch {
    cachedCapabilities = { clientUpload: false, presignedUpload: false, readWriteToken: false }
    return cachedCapabilities
  }
}

function shouldUseDirectBlobUpload(file: File, caps: UploadCapabilities): boolean {
  if (!caps.clientUpload) return false
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

async function uploadViaPresigned(
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
      onUploadProgress: onProgress,
    }),
    UPLOAD_TIMEOUT_MS,
    "Upload timed out. Try again or use a smaller file."
  )
}

async function uploadViaReadWriteToken(
  file: File,
  pathname: string,
  multipart: boolean,
  contentType: string,
  onProgress?: (progress: UploadProgress) => void
) {
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

  return withTimeout(
    put(pathname, file, {
      access: "public",
      token: tokenData.clientToken,
      multipart,
      contentType,
      onUploadProgress: onProgress,
    }),
    UPLOAD_TIMEOUT_MS,
    "Upload timed out. Try again or use a smaller file."
  )
}

async function uploadViaBlobClient(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  const isVideo = isVideoFile(file)
  const pathname = buildMediaPathname(file.name, isVideo)
  const multipart = file.size > MULTIPART_THRESHOLD_BYTES
  const contentType = file.type || (isVideo ? "video/mp4" : "application/octet-stream")
  const caps = await getUploadCapabilities()

  let blob
  try {
    if (caps.presignedUpload) {
      blob = await uploadViaPresigned(file, pathname, multipart, contentType, onProgress)
    } else if (caps.readWriteToken) {
      blob = await uploadViaReadWriteToken(file, pathname, multipart, contentType, onProgress)
    } else {
      throw new Error(BLOB_SETUP_MESSAGE)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    if (
      caps.presignedUpload &&
      caps.readWriteToken &&
      (message.includes("Failed to retrieve") || message.includes("presigned"))
    ) {
      blob = await uploadViaReadWriteToken(file, pathname, multipart, contentType, onProgress)
    } else {
      throw err
    }
  }

  const name = pathname.replace(/^posts\//, "")
  return {
    url: blob.url,
    name,
    kind: mediaKindFromFilename(name),
  }
}

/** Upload an image or MP4 from the admin UI. */
export async function uploadAdminMediaFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadMediaResult> {
  cachedCapabilities = null
  const caps = await getUploadCapabilities()
  const isVideo = isVideoFile(file)

  if (isVideo && !caps.clientUpload) {
    throw new Error(BLOB_SETUP_MESSAGE)
  }

  if (shouldUseDirectBlobUpload(file, caps)) {
    return uploadViaBlobClient(file, onProgress)
  }

  return uploadViaServer(file)
}
