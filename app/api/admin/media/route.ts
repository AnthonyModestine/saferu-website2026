import { NextResponse } from "next/server"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { deleteImage, listImages } from "@/lib/media-storage"

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied

  try {
    const items = await listImages()
    return NextResponse.json({ items })
  } catch (e) {
    console.error("Media list error:", e)
    return NextResponse.json({ items: [] })
  }
}

export async function DELETE(request: Request) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied

  try {
    const { filename } = await request.json()
    await deleteImage(filename)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error("Media delete error:", e)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
