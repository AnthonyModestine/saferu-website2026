import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { createVideoUploadSession, VIDEO_CHUNK_BYTES } from "@/lib/chunked-video-upload"

export const maxDuration = 30

export async function POST(request: Request) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied

  try {
    const body = await request.json()
    const originalName = typeof body.filename === "string" ? body.filename.trim() : ""
    const totalSize = Number(body.size)

    if (!originalName) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 })
    }
    if (!Number.isFinite(totalSize) || totalSize < 1) {
      return NextResponse.json({ error: "Invalid file size" }, { status: 400 })
    }

    const session = await createVideoUploadSession({ originalName, totalSize })
    return NextResponse.json({
      uploadId: session.uploadId,
      totalParts: session.expectedParts,
      chunkSize: VIDEO_CHUNK_BYTES,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start upload"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
