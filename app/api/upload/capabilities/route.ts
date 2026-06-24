import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { isDirectBlobUploadAvailable, isPresignedBlobUploadAvailable } from "@/lib/media-storage"

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  return NextResponse.json({
    clientUpload: isDirectBlobUploadAvailable(),
    presignedUpload: isPresignedBlobUploadAvailable(),
    readWriteToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
  })
}
