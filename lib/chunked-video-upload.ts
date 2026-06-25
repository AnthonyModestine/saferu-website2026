/**
 * Server-side chunked video upload (avoids browser → Blob direct upload).
 * Each chunk stays under Vercel's ~4.5 MB request limit; server assembles and put()s to Blob.
 */

import { mkdir, readFile, readdir, rm, writeFile } from "fs/promises"
import path from "path"
import { put } from "@vercel/blob"
import { ensureSchema, getSql, isDatabaseConfigured } from "@/lib/db"
import { buildMediaPathname, BLOB_PREFIX } from "@/lib/media-filename"
import { isMp4Buffer } from "@/lib/image-validation"
import {
  isBlobStorageConfigured,
  MAX_VIDEO_SIZE,
} from "@/lib/media-storage"

export const VIDEO_CHUNK_BYTES = 3 * 1024 * 1024 // 3 MB — safe under Vercel body limit
const SESSION_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours
const FILE_UPLOAD_ROOT = path.join(process.cwd(), "data", "media-upload-sessions")

export interface VideoUploadSession {
  uploadId: string
  pathname: string
  filename: string
  totalSize: number
  expectedParts: number
}

export function partsForSize(totalSize: number): number {
  return Math.ceil(totalSize / VIDEO_CHUNK_BYTES)
}

export async function createVideoUploadSession(params: {
  originalName: string
  totalSize: number
}): Promise<VideoUploadSession> {
  if (!isBlobStorageConfigured()) {
    throw new Error("Blob storage is not configured for this project.")
  }
  if (params.totalSize > MAX_VIDEO_SIZE) {
    throw new Error("Video too large (max 100MB)")
  }
  if (params.totalSize <= VIDEO_CHUNK_BYTES) {
    throw new Error("Use standard upload for small videos")
  }

  const uploadId = crypto.randomUUID()
  const pathname = buildMediaPathname(params.originalName, true)
  const filename = pathname.replace(BLOB_PREFIX, "")
  const expectedParts = partsForSize(params.totalSize)
  const now = Date.now()
  const expiresAt = now + SESSION_TTL_MS

  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`
      INSERT INTO media_upload_sessions (
        id, pathname, filename, total_size, expected_parts, received_parts, created_at, expires_at
      ) VALUES (
        ${uploadId}, ${pathname}, ${filename}, ${params.totalSize}, ${expectedParts}, 0, ${now}, ${expiresAt}
      )
    `
  } else {
    const dir = path.join(FILE_UPLOAD_ROOT, uploadId)
    await mkdir(dir, { recursive: true })
    await writeFile(
      path.join(dir, "meta.json"),
      JSON.stringify({
        pathname,
        filename,
        totalSize: params.totalSize,
        expectedParts,
        receivedParts: 0,
        expiresAt,
      }),
      "utf-8"
    )
  }

  return { uploadId, pathname, filename, totalSize: params.totalSize, expectedParts }
}

export async function saveVideoUploadPart(params: {
  uploadId: string
  partIndex: number
  chunk: Buffer
}): Promise<{ receivedParts: number; expectedParts: number }> {
  if (params.chunk.length === 0) {
    throw new Error("Empty chunk")
  }
  if (params.chunk.length > VIDEO_CHUNK_BYTES) {
    throw new Error("Chunk too large")
  }

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      SELECT expected_parts, received_parts, expires_at
      FROM media_upload_sessions
      WHERE id = ${params.uploadId}
      LIMIT 1
    `
    const session = (rows as { expected_parts: number; received_parts: number; expires_at: string | number }[])[0]
    if (!session) throw new Error("Upload session not found")
    if (Number(session.expires_at) < Date.now()) throw new Error("Upload session expired")
    if (params.partIndex < 0 || params.partIndex >= session.expected_parts) {
      throw new Error("Invalid part index")
    }

    await getSql()`
      INSERT INTO media_upload_parts (upload_id, part_index, data)
      VALUES (${params.uploadId}, ${params.partIndex}, ${params.chunk})
      ON CONFLICT (upload_id, part_index) DO UPDATE SET data = EXCLUDED.data
    `

    const countRows = await getSql()`
      SELECT COUNT(*)::int AS count FROM media_upload_parts WHERE upload_id = ${params.uploadId}
    `
    const receivedParts = Number((countRows as { count: number }[])[0]?.count ?? 0)
    await getSql()`
      UPDATE media_upload_sessions SET received_parts = ${receivedParts} WHERE id = ${params.uploadId}
    `

    return { receivedParts, expectedParts: session.expected_parts }
  }

  const dir = path.join(FILE_UPLOAD_ROOT, params.uploadId)
  const metaPath = path.join(dir, "meta.json")
  let meta: {
    expectedParts: number
    receivedParts: number
    expiresAt: number
  }
  try {
    meta = JSON.parse(await readFile(metaPath, "utf-8")) as typeof meta
  } catch {
    throw new Error("Upload session not found")
  }
  if (meta.expiresAt < Date.now()) throw new Error("Upload session expired")
  if (params.partIndex < 0 || params.partIndex >= meta.expectedParts) {
    throw new Error("Invalid part index")
  }

  await writeFile(path.join(dir, `part-${params.partIndex}`), params.chunk)
  const files = await readdir(dir)
  const receivedParts = files.filter((f) => f.startsWith("part-")).length
  meta.receivedParts = receivedParts
  await writeFile(metaPath, JSON.stringify(meta), "utf-8")

  return { receivedParts, expectedParts: meta.expectedParts }
}

export async function completeVideoUpload(uploadId: string): Promise<{
  url: string
  name: string
  kind: "video"
}> {
  let pathname: string
  let filename: string
  let totalSize: number
  let expectedParts: number
  let buffers: Buffer[]

  if (isDatabaseConfigured()) {
    await ensureSchema()
    const rows = await getSql()`
      SELECT pathname, filename, total_size, expected_parts, expires_at
      FROM media_upload_sessions
      WHERE id = ${uploadId}
      LIMIT 1
    `
    const session = (rows as {
      pathname: string
      filename: string
      total_size: string | number
      expected_parts: number
      expires_at: string | number
    }[])[0]
    if (!session) throw new Error("Upload session not found")
    if (Number(session.expires_at) < Date.now()) throw new Error("Upload session expired")

    pathname = session.pathname
    filename = session.filename
    totalSize = Number(session.total_size)
    expectedParts = session.expected_parts

    const partRows = await getSql()`
      SELECT part_index, data
      FROM media_upload_parts
      WHERE upload_id = ${uploadId}
      ORDER BY part_index ASC
    `
    const parts = partRows as { part_index: number; data: Buffer }[]
    if (parts.length !== expectedParts) {
      throw new Error(`Missing parts (${parts.length}/${expectedParts})`)
    }
    buffers = parts.map((p) => Buffer.from(p.data))
  } else {
    const dir = path.join(FILE_UPLOAD_ROOT, uploadId)
    const meta = JSON.parse(await readFile(path.join(dir, "meta.json"), "utf-8")) as {
      pathname: string
      filename: string
      totalSize: number
      expectedParts: number
      expiresAt: number
    }
    if (meta.expiresAt < Date.now()) throw new Error("Upload session expired")

    pathname = meta.pathname
    filename = meta.filename
    totalSize = meta.totalSize
    expectedParts = meta.expectedParts

    buffers = []
    for (let i = 0; i < expectedParts; i++) {
      buffers.push(await readFile(path.join(dir, `part-${i}`)))
    }
  }

  const fileBuffer = Buffer.concat(buffers)
  if (fileBuffer.length !== totalSize) {
    throw new Error("Assembled file size mismatch")
  }
  if (!isMp4Buffer(fileBuffer)) {
    throw new Error("Invalid video. Use MP4 format.")
  }

  const blob = await put(pathname, fileBuffer, {
    access: "public",
    contentType: "video/mp4",
    addRandomSuffix: false,
  })

  await deleteVideoUploadSession(uploadId)

  return { url: blob.url, name: filename, kind: "video" }
}

async function deleteVideoUploadSession(uploadId: string): Promise<void> {
  if (isDatabaseConfigured()) {
    await ensureSchema()
    await getSql()`DELETE FROM media_upload_parts WHERE upload_id = ${uploadId}`
    await getSql()`DELETE FROM media_upload_sessions WHERE id = ${uploadId}`
    return
  }
  await rm(path.join(FILE_UPLOAD_ROOT, uploadId), { recursive: true, force: true })
}
