import { NextRequest, NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  storeMediaFile,
} from "@/lib/media-storage"
import { isAllowedImageBuffer, isMp4Buffer } from "@/lib/image-validation"

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const isVideo =
      file.type === "video/mp4" ||
      file.name.toLowerCase().endsWith(".mp4") ||
      isMp4Buffer(buffer)

    if (isVideo) {
      if (file.size > MAX_VIDEO_SIZE) {
        return NextResponse.json({ error: "Video too large (max 100MB)" }, { status: 400 })
      }
      if (!isMp4Buffer(buffer)) {
        return NextResponse.json({ error: "Invalid video. Use MP4 format." }, { status: 400 })
      }
    } else {
      if (file.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
      }
      if (!isAllowedImageBuffer(buffer, ALLOWED_IMAGE_TYPES)) {
        return NextResponse.json({ error: "Invalid type. Use JPEG, PNG, WebP, GIF, or MP4." }, { status: 400 })
      }
    }

    const stored = await storeMediaFile(file)
    return NextResponse.json({
      url: stored.url,
      name: stored.name,
      kind: stored.kind,
    })
  } catch (e) {
    console.error("Upload error:", e)
    const message = e instanceof Error ? e.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
