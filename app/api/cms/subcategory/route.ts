import { NextRequest, NextResponse } from "next/server"
import { addSubcategory, generateId, updateSubcategory, removeSubcategory } from "@/lib/cms-additions"
import { loadCmsAdditions, persistAdditions } from "@/lib/cms-additions-persist"
import { revalidateContentPages } from "@/lib/revalidate-content"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { categoryId, title, description, icon } = body as {
      categoryId: string
      title: string
      description?: string
      icon?: string
    }
    if (!categoryId || !title?.trim()) {
      return NextResponse.json({ error: "categoryId and title required" }, { status: 400 })
    }
    await loadCmsAdditions()
    const id = generateId("sub", title)
    addSubcategory({
      categoryId,
      id,
      title: title.trim(),
      description: (description || "").trim(),
      icon: (icon || "FileText").trim(),
    })
    await persistAdditions()
    revalidateContentPages(categoryId)
    return NextResponse.json({ ok: true, id })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { categoryId, subcategoryId, title, description, icon } = body as {
      categoryId: string
      subcategoryId: string
      title?: string
      description?: string
      icon?: string
    }
    if (!categoryId || !subcategoryId) {
      return NextResponse.json({ error: "categoryId and subcategoryId required" }, { status: 400 })
    }
    if (title !== undefined && !title.trim()) {
      return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 })
    }
    await loadCmsAdditions()
    const updated = updateSubcategory(categoryId, subcategoryId, {
      title: title?.trim(),
      description: description?.trim(),
      icon: icon?.trim(),
    })
    if (!updated) {
      return NextResponse.json({ error: "Subcategory not found" }, { status: 404 })
    }
    await persistAdditions()
    revalidateContentPages(categoryId, subcategoryId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[cms/subcategory] PATCH error:", err)
    return NextResponse.json({ error: "Failed to update subcategory" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { categoryId, subcategoryId } = body as {
      categoryId: string
      subcategoryId: string
    }
    if (!categoryId || !subcategoryId) {
      return NextResponse.json({ error: "categoryId and subcategoryId required" }, { status: 400 })
    }
    await loadCmsAdditions()
    const { getCategoryById } = await import("@/lib/content-merged")
    const category = getCategoryById(categoryId, { includeUnpublished: true })
    if (category && category.subcategories.length <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the only subcategory in this category." },
        { status: 400 }
      )
    }
    removeSubcategory(categoryId, subcategoryId)
    await persistAdditions()
    revalidateContentPages(categoryId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[cms/subcategory] DELETE error:", err)
    return NextResponse.json({ error: "Failed to delete subcategory" }, { status: 500 })
  }
}
