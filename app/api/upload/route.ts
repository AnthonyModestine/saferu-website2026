import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"

const UPLOAD_DIR = "public/images/posts"
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid type. Use JPEG, PNG, WebP, or GIF." }, { status: 400 })
    }

    const ext = path.extname(file.name) || ".jpg"
    const base = path.basename(file.name, ext).replace(/[^a-z0-9-_]/gi, "-").slice(0, 40)
    const filename = `${base}-${Date.now()}${ext}`
    const dir = path.join(process.cwd(), UPLOAD_DIR)
    await mkdir(dir, { recursive: true })
    const filepath = path.join(dir, filename)
    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    const url = `/images/posts/${filename}`
    return NextResponse.json({ url })
  } catch (e) {
    console.error("Upload error:", e)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
