import { NextRequest, NextResponse } from "next/server"
import { addArticle, generateId, getAdditions } from "@/lib/cms-additions"
import { loadCmsAdditions, persistAdditions } from "@/lib/cms-additions-persist"
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
    await loadCmsAdditions()
    addArticle({
      categoryId,
      subcategoryId,
      id,
      title: title.trim(),
      description: (description || "").trim(),
    })
    await persistAdditions()

    const saved = getAdditions().articles.find(
      (a) => a.id === id && a.categoryId === categoryId && a.subcategoryId === subcategoryId
    )
    if (!saved) {
      return NextResponse.json(
        { error: "Article could not be saved to database. Check Vercel Postgres connection." },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, id })
  } catch (err) {
    console.error("[cms/article] ERROR:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 500 }
    )
  }
}
