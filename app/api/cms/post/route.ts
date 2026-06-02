import { NextRequest, NextResponse } from "next/server"
import { addPost, generateId } from "@/lib/cms-additions"
import { loadCmsAdditions, persistAdditions } from "@/lib/cms-additions-persist"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { categoryId, subcategoryId, articleId, title, image, message, facebook, instagram, twitter } = body as {
      categoryId: string
      subcategoryId: string
      articleId: string
      title: string
      image?: string
      message?: string
      facebook?: string
      instagram?: string
      twitter?: string
    }
    if (!categoryId || !subcategoryId || !articleId || !title?.trim()) {
      return NextResponse.json({ error: "categoryId, subcategoryId, articleId, and title required" }, { status: 400 })
    }
    await loadCmsAdditions()
    const caption = (message || facebook || "").trim() || "Share this with your community. #SaferU"
    addPost({
      categoryId,
      subcategoryId,
      articleId,
      id: generateId("post", title),
      title: title.trim(),
      image: (image || "").trim() || undefined,
      message: caption,
      captions: {
        facebook: (facebook || message || caption).trim(),
        instagram: (instagram || message || caption).trim(),
        twitter: (twitter || message || caption).trim(),
      },
    })
    await persistAdditions()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
