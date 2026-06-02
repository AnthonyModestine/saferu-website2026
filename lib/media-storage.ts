/**
 * Server-only image storage.
 * Uses Vercel Blob in production (BLOB_READ_WRITE_TOKEN), local public/images/posts in dev.
 */

import { writeFile, mkdir, readdir, stat, unlink } from "fs/promises"
import path from "path"
import { put, list, del } from "@vercel/blob"

const UPLOAD_DIR = "public/images/posts"
const BLOB_PREFIX = "posts/"
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export interface StoredImage {
  name: string
  url: string
  size: number
  uploadedAt: string
}

export function isBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName) || ".jpg"
  const base = path.basename(originalName, ext).replace(/[^a-z0-9-_]/gi, "-").slice(0, 40)
  return `${base}-${Date.now()}${ext.toLowerCase()}`
}

export async function storeImage(file: File): Promise<StoredImage> {
  const filename = sanitizeFilename(file.name)
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const uploadedAt = new Date().toISOString()

  if (isBlobStorageConfigured()) {
    const blob = await put(`${BLOB_PREFIX}${filename}`, buffer, {
      access: "public",
      contentType: file.type || "application/octet-stream",
      addRandomSuffix: false,
    })
    return {
      name: filename,
      url: blob.url,
      size: file.size,
      uploadedAt,
    }
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Image storage is not configured. In Vercel, go to Storage → Create Blob store and connect it to this project."
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
  }
}

export async function listImages(): Promise<StoredImage[]> {
  if (isBlobStorageConfigured()) {
    const { blobs } = await list({ prefix: BLOB_PREFIX })
    return blobs
      .map((blob) => ({
        name: blob.pathname.replace(BLOB_PREFIX, ""),
        url: blob.url,
        size: blob.size,
        uploadedAt: blob.uploadedAt.toISOString(),
      }))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
  }

  const dir = path.join(process.cwd(), UPLOAD_DIR)
  try {
    const files = await readdir(dir)
    const items = await Promise.all(
      files
        .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
        .map(async (f) => {
          const info = await stat(path.join(dir, f))
          return {
            name: f,
            url: `/images/posts/${f}`,
            size: info.size,
            uploadedAt: info.mtime.toISOString(),
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
