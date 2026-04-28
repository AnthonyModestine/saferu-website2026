import { NextRequest, NextResponse } from "next/server"
import { addSubcategory, generateId } from "@/lib/cms-additions"
import { loadCmsAdditions, persistAdditions } from "@/lib/cms-additions-persist"
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
    loadCmsAdditions()
    const id = generateId("sub", title) // e.g. sub-vacation-tips-abc123
    addSubcategory({
      categoryId,
      id,
      title: title.trim(),
      description: (description || "").trim(),
      icon: (icon || "FileText").trim(),
    })
    await persistAdditions()
    return NextResponse.json({ ok: true, id })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
