import "server-only"

import { mkdir, writeFile } from "fs/promises"
import path from "path"
import { put } from "@vercel/blob"
import { isBlobStorageConfigured } from "@/lib/media-storage"

const LOCAL_DIR = path.join(process.cwd(), "public", "images", "graphic-studio")

/**
 * Persist a Graphic Studio image from a data URL.
 * Uses Vercel Blob when configured; otherwise writes under public/images/graphic-studio.
 */
export async function storeGraphicStudioImageFromDataUrl(
  graphicId: string,
  dataUrl: string
): Promise<{ url: string; bytes: number }> {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl.trim())
  if (!match) {
    throw new Error("Invalid graphic image data.")
  }

  const mime = match[1].toLowerCase()
  const buffer = Buffer.from(match[2].replace(/\s+/g, ""), "base64")
  if (buffer.length < 256) throw new Error("Graphic image is too small.")
  if (buffer.length > 8 * 1024 * 1024) throw new Error("Graphic image is too large to save.")

  const ext = mime.includes("png")
    ? "png"
    : mime.includes("webp")
      ? "webp"
      : mime.includes("gif")
        ? "gif"
        : "jpg"
  const filename = `gs-${graphicId.slice(0, 36)}.${ext}`
  const contentType = mime.startsWith("image/") ? mime : `image/${ext === "jpg" ? "jpeg" : ext}`

  if (isBlobStorageConfigured()) {
    const blob = await put(`graphic-studio/${filename}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    })
    return { url: blob.url, bytes: buffer.length }
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Image storage is not linked. Connect SaferU Blob storage in Vercel, then redeploy."
    )
  }

  await mkdir(LOCAL_DIR, { recursive: true })
  const filepath = path.join(LOCAL_DIR, filename)
  await writeFile(filepath, buffer)
  return { url: `/images/graphic-studio/${filename}`, bytes: buffer.length }
}
