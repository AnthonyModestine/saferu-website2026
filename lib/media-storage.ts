/**
 * Server-only media storage (images + MP4 videos).
 * Uses Vercel Blob in production (BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID + OIDC on Vercel).
 * Local dev without Blob env falls back to public/images/posts.
 */

import { writeFile, mkdir, readdir, stat, unlink } from "fs/promises"
import path from "path"
import { put, list, del } from "@vercel/blob"

const UPLOAD_DIR = "public/images/posts"
const BLOB_PREFIX = "posts/"
const MEDIA_FILE_PATTERN = /\.(jpe?g|png|webp|gif|mp4)$/i

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
export const ALLOWED_VIDEO_TYPES = ["video/mp4"]

export interface StoredImage {
  name: string
  url: string
  size: number
  uploadedAt: string
  kind: "image" | "video"
}

export function isBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)
}

function sanitizeFilename(originalName: string, fallbackExt = ".jpg"): string {
  let ext = path.extname(originalName)
  if (!ext) ext = fallbackExt
  const base = path.basename(originalName, ext).replace(/[^a-z0-9-_]/gi, "-").slice(0, 40)
  return `${base}-${Date.now()}${ext.toLowerCase()}`
}

function mediaKindFromName(name: string): "image" | "video" {
  return /\.mp4$/i.test(name) ? "video" : "image"
}

export async function storeImage(file: File): Promise<StoredImage> {
  return storeMediaFile(file)
}

export async function storeMediaFile(file: File): Promise<StoredImage> {
  const fallbackExt =
    file.type === "video/mp4" || file.name.toLowerCase().endsWith(".mp4") ? ".mp4" : ".jpg"
  const filename = sanitizeFilename(file.name, fallbackExt)
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const uploadedAt = new Date().toISOString()
  const kind = mediaKindFromName(filename)
  const contentType =
    file.type ||
    (kind === "video" ? "video/mp4" : "application/octet-stream")

  if (isBlobStorageConfigured()) {
    const blob = await put(`${BLOB_PREFIX}${filename}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    })
    return {
      name: filename,
      url: blob.url,
      size: file.size,
      uploadedAt,
      kind,
    }
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Media storage is not linked to this site. In Vercel: open SaferU-Images → Projects tab → Connect to Project (your website). Then redeploy."
    )
  }

  const dir = path.join(process.cwd(), UPLOAD_DIR)
  await mkdir(dir, { recursive: true })
  const filepath = path.join(dir, filename)
  await writeFile(filepath, buffer)

  return {
    name: filename,
    url: `/images/posts/${filename}`,
    size: file.size,
    uploadedAt,
    kind,
  }
}

export async function listImages(): Promise<StoredImage[]> {
  if (isBlobStorageConfigured()) {
    const { blobs } = await list({ prefix: BLOB_PREFIX })
    return blobs
      .filter((blob) => MEDIA_FILE_PATTERN.test(blob.pathname))
      .map((blob) => {
        const name = blob.pathname.replace(BLOB_PREFIX, "")
        return {
          name,
          url: blob.url,
          size: blob.size,
          uploadedAt: blob.uploadedAt.toISOString(),
          kind: mediaKindFromName(name),
        }
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  }

  const dir = path.join(process.cwd(), UPLOAD_DIR)
  try {
    const files = await readdir(dir)
    const items = await Promise.all(
      files
        .filter((f) => MEDIA_FILE_PATTERN.test(f))
        .map(async (f) => {
          const info = await stat(path.join(dir, f))
          return {
            name: f,
            url: `/images/posts/${f}`,
            size: info.size,
            uploadedAt: info.mtime.toISOString(),
            kind: mediaKindFromName(f),
          }
        })
    )
    return items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  } catch {
    return []
  }
}

export async function deleteImage(filename: string): Promise<void> {
  if (!filename || /[/\\]/.test(filename)) {
    throw new Error("Invalid filename")
  }

  if (isBlobStorageConfigured()) {
    const { blobs } = await list({ prefix: `${BLOB_PREFIX}${filename}` })
    const match = blobs.find((b) => b.pathname === `${BLOB_PREFIX}${filename}`)
    if (match) {
      await del(match.url)
    }
    return
  }

  await unlink(path.join(process.cwd(), UPLOAD_DIR, filename))
}
