import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { completeVideoUpload } from "@/lib/chunked-video-upload"

export const maxDuration = 120

export async function POST(request: Request) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied

  try {
    const body = await request.json()
    const uploadId = typeof body.uploadId === "string" ? body.uploadId.trim() : ""

    if (!uploadId) {
      return NextResponse.json({ error: "uploadId is required" }, { status: 400 })
    }

    const result = await completeVideoUpload(uploadId)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete upload"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
