import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { isClientBlobUploadAvailable } from "@/lib/media-storage"

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  return NextResponse.json({ clientUpload: isClientBlobUploadAvailable() })
}
