import { NextRequest, NextResponse } from "next/server"
import { addArticle, generateId } from "@/lib/cms-additions"
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
    return NextResponse.json({ ok: true, id })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
