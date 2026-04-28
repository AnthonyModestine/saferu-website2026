import { NextRequest, NextResponse } from "next/server"
import { getImageOverrides, setPostImageOverride, clearPostImageOverride } from "@/lib/content-overrides"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"

export async function GET() {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  const overrides = getImageOverrides()
  return NextResponse.json(overrides)
}

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { categoryId, subcategoryId, articleId, postId, imageUrl } = body as {
      categoryId: string
      subcategoryId: string
      articleId: string
      postId: string
      imageUrl: string | null
    }
    if (!categoryId || !subcategoryId || !articleId || !postId) {
      return NextResponse.json({ error: "Missing required ids" }, { status: 400 })
    }
    if (imageUrl === null || imageUrl === "") {
      clearPostImageOverride(categoryId, subcategoryId, articleId, postId)
    } else {
      setPostImageOverride(categoryId, subcategoryId, articleId, postId, imageUrl)
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
