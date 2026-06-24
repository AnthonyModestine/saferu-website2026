import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { prepareBlobDirectUpload } from "@/lib/blob-prepare-upload"

export async function POST(request: Request) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied

  try {
    const body = await request.json()
    const originalName =
      typeof body.filename === "string"
        ? body.filename
        : typeof body.originalName === "string"
          ? body.originalName
          : ""
    const size = Number(body.size)
    const contentType = typeof body.contentType === "string" ? body.contentType : ""
    const isVideo =
      body.isVideo === true ||
      originalName.toLowerCase().endsWith(".mp4") ||
      contentType === "video/mp4"

    if (!originalName.trim()) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 })
    }
    if (!Number.isFinite(size) || size < 1) {
      return NextResponse.json({ error: "Invalid file size" }, { status: 400 })
    }

    const prepared = await prepareBlobDirectUpload({
      originalName,
      contentType,
      size,
      isVideo,
    })

    return NextResponse.json(prepared)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare upload"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
