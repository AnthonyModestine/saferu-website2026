import { NextRequest, NextResponse } from "next/server"
import {
  canConfigureCategoryLayout,
  getCategoryLayout,
  setCategoryLayout,
  getDefaultSubcategoryId,
} from "@/lib/category-layout"
import { loadContentMeta, persistContentMeta } from "@/lib/content-meta-persist"
import { getAdditions, addSubcategory } from "@/lib/cms-additions"
import { loadCmsAdditions, persistAdditions } from "@/lib/cms-additions-persist"
import { contentLibrary } from "@/lib/data/content-library"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"
import { revalidateContentPages } from "@/lib/revalidate-content"
import type { CategoryLayoutMode } from "@/lib/content-meta-store"

function ensureFlatArticleBucket(categoryId: string): void {
  const bucketId = getDefaultSubcategoryId(categoryId)
  const base = contentLibrary.find((c) => c.id === categoryId)
  const hasInBase = base?.subcategories.some((s) => s.id === bucketId) ?? false
  if (hasInBase) return

  const add = getAdditions()
  const existsInCms = add.subcategories.some(
    (s) => s.categoryId === categoryId && s.id === bucketId
  )
  if (existsInCms) return

  addSubcategory({
    categoryId,
    id: bucketId,
    title: base?.title ?? "Articles",
    description: base?.description ?? "Articles in this category",
    icon: base?.subcategories[0]?.icon ?? "FileText",
  })
}

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get("categoryId")
  if (!categoryId) {
    return NextResponse.json({ error: "categoryId required" }, { status: 400 })
  }
  await loadContentMeta()
  return NextResponse.json({
    layout: getCategoryLayout(categoryId),
    canConfigure: canConfigureCategoryLayout(categoryId),
  })
}

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied

  try {
    const body = await request.json()
    const { categoryId, layout } = body as {
      categoryId: string
      layout: CategoryLayoutMode
    }

    if (!categoryId || (layout !== "flat" && layout !== "nested")) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (!canConfigureCategoryLayout(categoryId)) {
      return NextResponse.json(
        { error: "This category layout cannot be changed" },
        { status: 400 }
      )
    }

    if (!contentLibrary.some((c) => c.id === categoryId)) {
      return NextResponse.json({ error: "Unknown category" }, { status: 404 })
    }

    await Promise.all([loadContentMeta(), loadCmsAdditions()])

    if (layout === "flat") {
      ensureFlatArticleBucket(categoryId)
      await persistAdditions()
    }

    setCategoryLayout(categoryId, layout)
    await persistContentMeta()
    revalidateContentPages(categoryId)

    return NextResponse.json({ ok: true, layout: getCategoryLayout(categoryId) })
  } catch {
    return NextResponse.json({ error: "Failed to update layout" }, { status: 500 })
  }
}
