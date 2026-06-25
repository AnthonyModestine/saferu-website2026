import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { saveVideoUploadPart } from "@/lib/chunked-video-upload"

export const maxDuration = 60

export async function POST(request: Request) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied

  try {
    const form = await request.formData()
    const uploadId = String(form.get("uploadId") ?? "").trim()
    const partIndex = Number(form.get("partIndex"))
    const chunk = form.get("chunk")

    if (!uploadId) {
      return NextResponse.json({ error: "uploadId is required" }, { status: 400 })
    }
    if (!Number.isInteger(partIndex) || partIndex < 0) {
      return NextResponse.json({ error: "Invalid partIndex" }, { status: 400 })
    }
    if (!(chunk instanceof File) || chunk.size === 0) {
      return NextResponse.json({ error: "chunk file is required" }, { status: 400 })
    }

    const buffer = Buffer.from(await chunk.arrayBuffer())
    const progress = await saveVideoUploadPart({ uploadId, partIndex, chunk: buffer })

    return NextResponse.json(progress)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save chunk"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
