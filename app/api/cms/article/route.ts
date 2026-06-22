import { NextRequest, NextResponse } from "next/server"
import { addArticle, generateId, getAdditions, isCmsArticle, removeArticle } from "@/lib/cms-additions"
import { baseArticleExists } from "@/lib/content-merged"
import { loadCmsAdditions, persistAdditions } from "@/lib/cms-additions-persist"
import { setArticlePublished } from "@/lib/content-visibility"
import { loadVisibility, persistVisibility } from "@/lib/content-visibility-persist"
import { revalidateContentPages } from "@/lib/revalidate-content"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"

/** Sanitize custom slug: letters, numbers, hyphens only; preserve case */
function sanitizeSlug(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 80)
}

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { categoryId, subcategoryId, title, description, slug } = body as {
      categoryId: string
      subcategoryId: string
      title: string
      description?: string
      slug?: string
    }
    if (!categoryId || !subcategoryId || !title?.trim()) {
      return NextResponse.json({ error: "categoryId, subcategoryId, and title required" }, { status: 400 })
    }
    const id = slug?.trim()
      ? sanitizeSlug(slug) || generateId("art", title)
      : generateId("art", title)
    await Promise.all([loadCmsAdditions(), loadVisibility()])

    if (
      isCmsArticle(categoryId, subcategoryId, id) ||
      baseArticleExists(categoryId, subcategoryId, id)
    ) {
      return NextResponse.json(
        {
          error:
            "An article with this URL slug already exists. Choose a different slug or edit the existing article.",
        },
        { status: 409 }
      )
    }

    const created = addArticle({
      categoryId,
      subcategoryId,
      id,
      title: title.trim(),
      description: (description || "").trim(),
    })
    if (!created) {
      return NextResponse.json(
        { error: "An article with this URL slug already exists." },
        { status: 409 }
      )
    }
    setArticlePublished(categoryId, subcategoryId, id, false)
    await Promise.all([persistAdditions(), persistVisibility()])

    const saved = getAdditions().articles.find(
      (a) => a.id === id && a.categoryId === categoryId && a.subcategoryId === subcategoryId
    )
    if (!saved) {
      return NextResponse.json(
        { error: "Article could not be saved to database. Check Vercel Postgres connection." },
        { status: 500 }
      )
    }

    revalidateContentPages(categoryId, subcategoryId)
    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error("[cms/article] ERROR:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { categoryId, subcategoryId, articleId } = body as {
      categoryId: string
      subcategoryId: string
      articleId: string
    }
    if (!categoryId || !subcategoryId || !articleId) {
      return NextResponse.json(
        { error: "categoryId, subcategoryId, and articleId required" },
        { status: 400 }
      )
    }
    await Promise.all([loadCmsAdditions(), loadVisibility()])
    removeArticle(categoryId, subcategoryId, articleId)
    setArticlePublished(categoryId, subcategoryId, articleId, true)
    await Promise.all([persistAdditions(), persistVisibility()])
    revalidateContentPages(categoryId, subcategoryId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[cms/article] DELETE error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete article" },
      { status: 500 }
    )
  }
}
