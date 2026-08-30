import "server-only"

import { readFile } from "fs/promises"
import path from "path"
import { getSharp } from "@/lib/graphic-studio/sharp"

export type LogoAsset = {
  buffer: Buffer
  width: number
  height: number
  mimeType: string
}

export async function loadLogoAsset(logoUrl: string | null | undefined): Promise<LogoAsset | null> {
  if (!logoUrl?.trim()) return null
  try {
    let buffer: Buffer
    let mimeType = "image/png"

    if (logoUrl.startsWith("data:")) {
      const match = logoUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) return null
      mimeType = match[1] || "image/png"
      buffer = Buffer.from(match[2], "base64")
    } else if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
      const res = await fetch(logoUrl)
      if (!res.ok) return null
      mimeType = res.headers.get("content-type") || "image/png"
      buffer = Buffer.from(await res.arrayBuffer())
    } else if (logoUrl.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", logoUrl.replace(/^\//, ""))
      buffer = await readFile(filePath)
      const ext = path.extname(filePath).toLowerCase()
      if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg"
      else if (ext === ".webp") mimeType = "image/webp"
    } else {
      return null
    }

    const sharp = await getSharp()
    const meta = await sharp(buffer).metadata()
    return {
      buffer,
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      mimeType,
    }
  } catch {
    return null
  }
}

export async function createBlankCanvasBuffer(): Promise<Buffer> {
  const sharp = await getSharp()
  return sharp({
    create: {
      width: 2048,
      height: 1152,
      channels: 3,
      background: { r: 236, g: 240, b: 245 },
    },
  })
    .png()
    .toBuffer()
}

export function bufferToDataUrl(buffer: Buffer, mimeType = "image/png"): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`
}

export function dataUrlToBuffer(dataUrl: string): Buffer | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  return Buffer.from(match[2], "base64")
}
