import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client"
import { issueSignedToken } from "@vercel/blob"
import { NextResponse } from "next/server"
import { checkAdminSession } from "@/lib/admin-auth"
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  isPresignedBlobUploadAvailable,
} from "@/lib/media-storage"

const VIDEO_CONTENT_TYPES = ["video/mp4", "application/octet-stream"]

export async function POST(request: Request): Promise<NextResponse> {
  if (!isPresignedBlobUploadAvailable()) {
    return NextResponse.json(
      { error: "Blob storage is not linked to this project." },
      { status: 503 }
    )
  }

  const body = (await request.json()) as HandleUploadPresignedBody

  try {
    const jsonResponse = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, _clientPayload, _multipart) => {
        const isAdmin = await checkAdminSession()
        if (!isAdmin) {
          throw new Error("Unauthorized")
        }
        if (!pathname.startsWith("posts/")) {
          throw new Error("Invalid upload path")
        }

        const isVideo = /\.mp4$/i.test(pathname)
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          maximumSizeInBytes: isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE,
          allowedContentTypes: isVideo ? VIDEO_CONTENT_TYPES : [...ALLOWED_IMAGE_TYPES],
          validUntil: Date.now() + 60 * 60 * 1000,
        })

        return {
          token,
          urlOptions: {
            allowOverwrite: true,
            addRandomSuffix: false,
          },
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
