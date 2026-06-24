import { issueSignedToken, presignUrl, parseStoreIdFromDelegationToken } from "@vercel/blob"
import {
  buildMediaPathname,
  mediaKindFromFilename,
} from "@/lib/media-filename"
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  isBlobStorageConfigured,
} from "@/lib/media-storage"

const VIDEO_CONTENT_TYPES = ["video/mp4", "application/octet-stream"]

export interface PreparedBlobUpload {
  uploadUrl: string
  publicUrl: string
  pathname: string
  name: string
  contentType: string
  kind: "image" | "video"
  /** Required headers for browser PUT to the Vercel Blob API (not standard Content-Type). */
  uploadHeaders: Record<string, string>
}

export async function prepareBlobDirectUpload(params: {
  originalName: string
  contentType: string
  size: number
  isVideo: boolean
}): Promise<PreparedBlobUpload> {
  if (!isBlobStorageConfigured()) {
    throw new Error("Blob storage is not configured for this project.")
  }

  const pathname = buildMediaPathname(params.originalName, params.isVideo)
  const contentType =
    params.contentType.trim() ||
    (params.isVideo ? "video/mp4" : "application/octet-stream")
  const maxSize = params.isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE

  if (params.size > maxSize) {
    throw new Error(`File too large (max ${Math.round(maxSize / (1024 * 1024))}MB)`)
  }

  const readWriteToken = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  const signedToken = await issueSignedToken({
    ...(readWriteToken ? { token: readWriteToken } : {}),
    pathname,
    operations: ["put"],
    maximumSizeInBytes: maxSize,
    allowedContentTypes: params.isVideo ? VIDEO_CONTENT_TYPES : [...ALLOWED_IMAGE_TYPES],
    validUntil: Date.now() + 60 * 60 * 1000,
  })

  const { presignedUrl } = await presignUrl(signedToken, {
    operation: "put",
    pathname,
    access: "public",
    contentType,
    allowOverwrite: true,
    addRandomSuffix: false,
  })

  const storeId =
    parseStoreIdFromDelegationToken(signedToken.delegationToken) ||
    process.env.BLOB_STORE_ID?.trim() ||
    ""
  const publicUrl = storeId
    ? `https://${storeId}.public.blob.vercel-storage.com/${pathname}`
    : presignedUrl

  const name = pathname.replace(/^posts\//, "")
  if (!storeId) {
    throw new Error("Could not resolve Blob store ID. Reconnect SaferU-Images to saferu-backend in Vercel.")
  }

  return {
    uploadUrl: presignedUrl,
    publicUrl,
    pathname,
    name,
    contentType,
    kind: mediaKindFromFilename(name),
    uploadHeaders: {
      "x-content-type": contentType,
      "x-vercel-blob-access": "public",
      "x-content-length": String(params.size),
      "x-vercel-blob-store-id": storeId,
      "x-api-version": "12",
      "x-add-random-suffix": "0",
      "x-allow-overwrite": "1",
    },
  }
}
