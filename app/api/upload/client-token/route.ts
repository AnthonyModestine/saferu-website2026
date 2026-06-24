import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  isClientBlobUploadAvailable,
} from "@/lib/media-storage"

const VIDEO_CONTENT_TYPES = ["video/mp4", "application/octet-stream"]
const BLOB_SETUP_MESSAGE =
  "Video upload is not configured. Add BLOB_READ_WRITE_TOKEN to saferu-backend in Vercel, then redeploy."

export async function POST(request: Request) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied

  const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  if (!isClientBlobUploadAvailable() || !readWriteToken) {
    return NextResponse.json({ error: BLOB_SETUP_MESSAGE }, { status: 503 })
  }

  try {
    const body = await request.json()
    const pathname = typeof body.pathname === "string" ? body.pathname.trim() : ""
    const multipart = Boolean(body.multipart)

    if (!pathname.startsWith("posts/")) {
      return NextResponse.json({ error: "Invalid upload path" }, { status: 400 })
    }

    const isVideo = /\.mp4$/i.test(pathname)
    const clientToken = await generateClientTokenFromReadWriteToken({
      token: readWriteToken,
      pathname,
      allowedContentTypes: isVideo ? VIDEO_CONTENT_TYPES : [...ALLOWED_IMAGE_TYPES],
      maximumSizeInBytes: isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE,
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    return NextResponse.json({ clientToken, multipart })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare upload"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
