import { NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import path from "path"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"

const IMAGES_DIR = path.join(process.cwd(), "public/images/posts")

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied

  try {
    const files = await readdir(IMAGES_DIR)
    const items = await Promise.all(
      files
        .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
        .map(async (f) => {
          const info = await stat(path.join(IMAGES_DIR, f))
          return {
            name: f,
            url: `/images/posts/${f}`,
            size: info.size,
            uploadedAt: info.mtime.toISOString(),
          }
        })
    )
    items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

export async function DELETE(request: Request) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied

  try {
    const { filename } = await request.json()
    if (!filename || /[/\\]/.test(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }
    const { unlink } = await import("fs/promises")
    await unlink(path.join(IMAGES_DIR, filename))
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
