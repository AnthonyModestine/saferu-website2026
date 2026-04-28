import { NextRequest, NextResponse } from "next/server"
import { setArticlePublished } from "@/lib/content-visibility"
import { loadVisibility, persistVisibility } from "@/lib/content-visibility-persist"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { categoryId, subcategoryId, articleId, published } = body as {
      categoryId: string
      subcategoryId: string
      articleId: string
      published: boolean
    }
    if (
      !categoryId ||
      !subcategoryId ||
      !articleId ||
      typeof published !== "boolean"
    ) {
      return NextResponse.json(
        { error: "categoryId, subcategoryId, articleId, and published (boolean) required" },
        { status: 400 }
      )
    }
    loadVisibility()
    setArticlePublished(categoryId, subcategoryId, articleId, published)
    await persistVisibility()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
