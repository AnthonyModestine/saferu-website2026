import { NextRequest, NextResponse } from "next/server"
import {
  getImageOverrides,
  getMessageOverrides,
  setPostImageOverride,
  clearPostImageOverride,
  setPostMessageOverride,
  clearPostMessageOverride,
} from "@/lib/content-overrides"
import { loadContentMeta, persistContentMeta } from "@/lib/content-meta-persist"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { revalidateContentPages } from "@/lib/revalidate-content"

export async function GET() {
  await loadContentMeta()
  return NextResponse.json({
    images: getImageOverrides(),
    messages: getMessageOverrides(),
  })
}

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    await loadContentMeta()
    const body = await request.json()
    const { categoryId, subcategoryId, articleId, postId, imageUrl, message } = body as {
      categoryId: string
      subcategoryId: string
      articleId: string
      postId: string
      imageUrl?: string | null
      message?: string | null
    }
    if (!categoryId || !subcategoryId || !articleId || !postId) {
      return NextResponse.json({ error: "Missing required ids" }, { status: 400 })
    }

    if (imageUrl !== undefined) {
      if (imageUrl === null || imageUrl === "") {
        clearPostImageOverride(categoryId, subcategoryId, articleId, postId)
      } else {
        setPostImageOverride(categoryId, subcategoryId, articleId, postId, imageUrl)
      }
    }

    if (message !== undefined) {
      if (message === null || message.trim() === "") {
        clearPostMessageOverride(categoryId, subcategoryId, articleId, postId)
      } else {
        setPostMessageOverride(categoryId, subcategoryId, articleId, postId, message.trim())
      }
    }

    await persistContentMeta()
    revalidateContentPages(categoryId, subcategoryId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
