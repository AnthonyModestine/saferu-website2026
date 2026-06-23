import { NextRequest, NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, storeImage } from "@/lib/media-storage"
import { isAllowedImageBuffer } from "@/lib/image-validation"

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (!isAllowedImageBuffer(buffer, ALLOWED_IMAGE_TYPES)) {
      return NextResponse.json({ error: "Invalid type. Use JPEG, PNG, WebP, or GIF." }, { status: 400 })
    }

    const stored = await storeImage(file)
    return NextResponse.json({ url: stored.url, name: stored.name })
  } catch (e) {
    console.error("Upload error:", e)
    const message = e instanceof Error ? e.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
