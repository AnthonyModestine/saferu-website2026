import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin-auth"
import {
  ALLOWED_IMAGE_TYPES,
  isClientBlobUploadAvailable,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from "@/lib/media-storage"

const VIDEO_CONTENT_TYPES = ["video/mp4", "application/octet-stream"]

const BLOB_SETUP_MESSAGE =
  "Add BLOB_READ_WRITE_TOKEN to saferu-backend in Vercel (copy from saferu-website2026), then redeploy."

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim()
    if (!isClientBlobUploadAvailable() || !readWriteToken) {
      return NextResponse.json({ error: BLOB_SETUP_MESSAGE }, { status: 503 })
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      token: readWriteToken,
      onBeforeGenerateToken: async (pathname, _clientPayload, _multipart) => {
        const isAdmin = await checkAdminSession()
        if (!isAdmin) {
          throw new Error("Unauthorized")
        }

        const isVideo = /\.mp4$/i.test(pathname)
        if (!pathname.startsWith("posts/")) {
          throw new Error("Invalid upload path")
        }

        return {
          allowedContentTypes: isVideo ? VIDEO_CONTENT_TYPES : [...ALLOWED_IMAGE_TYPES],
          maximumSizeInBytes: isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE,
          addRandomSuffix: false,
          allowOverwrite: true,
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    const status = message === "Unauthorized" ? 401 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
