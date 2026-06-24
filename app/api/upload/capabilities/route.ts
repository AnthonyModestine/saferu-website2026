import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { isBlobStorageConfigured } from "@/lib/media-storage"

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  const blobStorage = isBlobStorageConfigured()
  return NextResponse.json({
    blobStorage,
    clientUpload: blobStorage,
    presignedUpload: blobStorage,
    readWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
  })
}
