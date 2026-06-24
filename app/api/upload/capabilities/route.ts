import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import {
  isBlobStorageConfigured,
  isClientBlobUploadAvailable,
  isPresignedBlobUploadAvailable,
} from "@/lib/media-storage"

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  return NextResponse.json({
    blobStorage: isBlobStorageConfigured(),
    presignedUpload: isPresignedBlobUploadAvailable(),
    readWriteToken: isClientBlobUploadAvailable(),
  })
}
