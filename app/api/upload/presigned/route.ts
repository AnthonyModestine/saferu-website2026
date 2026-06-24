import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client"
import { issueSignedToken } from "@vercel/blob"
import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import {
  ALLOWED_IMAGE_TYPES,
  isBlobStorageConfigured,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from "@/lib/media-storage"

const VIDEO_CONTENT_TYPES = ["video/mp4", "application/octet-stream"]

export const maxDuration = 60

function contentTypeForPathname(pathname: string): string {
  return /\.mp4$/i.test(pathname) ? "video/mp4" : "application/octet-stream"
}

export async function POST(request: Request): Promise<NextResponse> {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied

  if (!isBlobStorageConfigured()) {
    return NextResponse.json(
      { error: "Blob storage is not linked to this project." },
      { status: 503 }
    )
  }

  const webhookPublicKey = process.env.BLOB_WEBHOOK_PUBLIC_KEY?.trim()
  if (!webhookPublicKey) {
    return NextResponse.json(
      { error: "BLOB_WEBHOOK_PUBLIC_KEY is missing. Reconnect SaferU-Images to saferu-backend in Vercel." },
      { status: 503 }
    )
  }

  let body: HandleUploadPresignedBody
  try {
    body = (await request.json()) as HandleUploadPresignedBody
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  try {
    const jsonResponse = await handleUploadPresigned({
      body,
      request,
      webhookPublicKey,
      getSignedToken: async (pathname) => {
        if (!pathname.startsWith("posts/")) {
          throw new Error("Invalid upload path")
        }

        const isVideo = /\.mp4$/i.test(pathname)
        const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim()
        const token = await issueSignedToken({
          ...(readWriteToken ? { token: readWriteToken } : {}),
          pathname,
          operations: ["put"],
          maximumSizeInBytes: isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE,
          allowedContentTypes: isVideo ? VIDEO_CONTENT_TYPES : [...ALLOWED_IMAGE_TYPES],
          validUntil: Date.now() + 60 * 60 * 1000,
        })

        return {
          token,
          urlOptions: {
            access: "public",
            contentType: contentTypeForPathname(pathname),
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
