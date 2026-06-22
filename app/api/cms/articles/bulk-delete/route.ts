import { NextRequest, NextResponse } from "next/server"
import { removeArticle } from "@/lib/cms-additions"
import { loadCmsAdditions, persistAdditions } from "@/lib/cms-additions-persist"
import { setArticlePublished } from "@/lib/content-visibility"
import { loadVisibility, persistVisibility } from "@/lib/content-visibility-persist"
import { revalidateContentPages } from "@/lib/revalidate-content"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { articles } = body as {
      articles: { categoryId: string; subcategoryId: string; articleId: string }[]
    }
    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: "articles array required" }, { status: 400 })
    }
    await Promise.all([loadCmsAdditions(), loadVisibility()])
    for (const { categoryId, subcategoryId, articleId } of articles) {
      if (!categoryId || !subcategoryId || !articleId) continue
      removeArticle(categoryId, subcategoryId, articleId)
      setArticlePublished(categoryId, subcategoryId, articleId, true)
    }
    await Promise.all([persistAdditions(), persistVisibility()])
    const touched = new Set<string>()
    for (const { categoryId } of articles) {
      if (categoryId) touched.add(categoryId)
    }
    revalidateContentPages()
    for (const categoryId of touched) {
      revalidateContentPages(categoryId)
    }
    return NextResponse.json({ ok: true, deleted: articles.length })
  } catch (err) {
    console.error("[cms/articles/bulk-delete] error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk delete failed" },
      { status: 500 }
    )
  }
}
