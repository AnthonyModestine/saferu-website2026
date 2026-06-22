import { NextRequest, NextResponse } from "next/server"
import { setArticlePublished } from "@/lib/content-visibility"
import { loadVisibility, persistVisibility } from "@/lib/content-visibility-persist"
import { revalidateContentPages } from "@/lib/revalidate-content"
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
    await loadVisibility()
    setArticlePublished(categoryId, subcategoryId, articleId, published)
    await persistVisibility()
    revalidateContentPages(categoryId, subcategoryId)
    return NextResponse.json({ ok: true, published })
  } catch (err) {
    console.error("[content/visibility] error:", err)
    const message = err instanceof Error ? err.message : "Failed to update visibility"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
