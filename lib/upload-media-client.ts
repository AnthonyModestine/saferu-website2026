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

const BLOB_SETUP_MESSAGE =
  "Video upload is not configured. In Vercel: Storage → your Blob store → Connect to saferu-backend (Production + Preview), then redeploy so BLOB_READ_WRITE_TOKEN is added."

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

async function fetchBlobUploadError(pathname: string, multipart: boolean): Promise<string | null> {
  try {
    const res = await fetch("/api/upload/blob", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: { pathname, clientPayload: null, multipart },
      }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    return data.error ?? null
  } catch {
    return null
  }
}

async function uploadViaBlobClient(file: File): Promise<UploadMediaResult> {
  const isVideo = isVideoFile(file)
  const pathname = buildMediaPathname(file.name, isVideo)
  const multipart = isVideo || file.size > 10 * 1024 * 1024

  try {
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: "/api/upload/blob",
      multipart,
      contentType: file.type || (isVideo ? "video/mp4" : undefined),
    })
    const name = pathname.replace(/^posts\//, "")
    return {
      url: blob.url,
      name,
      kind: mediaKindFromFilename(name),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : ""
    if (message.includes("Failed to retrieve the client token")) {
      const serverError = await fetchBlobUploadError(pathname, multipart)
      throw new Error(serverError ?? BLOB_SETUP_MESSAGE)
    }
    throw err
  }
}

/** Upload an image or MP4 from the admin UI. Uses direct Blob upload for videos and large files on Vercel. */
export async function uploadAdminMediaFile(file: File): Promise<UploadMediaResult> {
  const isVideo = isVideoFile(file)
  const blobConfigured = await canUseClientUpload()

  if (isVideo && !blobConfigured) {
    throw new Error(BLOB_SETUP_MESSAGE)
  }

  if (shouldUseClientUpload(file, blobConfigured)) {
    return uploadViaBlobClient(file)
  }

  return uploadViaServer(file)
}
