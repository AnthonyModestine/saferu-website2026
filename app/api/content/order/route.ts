import { NextRequest, NextResponse } from "next/server"
import {
  setSubcategoryOrder,
  setArticleOrder,
  setPostOrder,
} from "@/lib/content-order"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, categoryId, subcategoryId, articleId, orderedIds } = body as {
      type: "subcategories" | "articles" | "posts"
      categoryId: string
      subcategoryId?: string
      articleId?: string
      orderedIds: string[]
    }
    if (!type || !categoryId || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "type, categoryId, and orderedIds (array) required" },
        { status: 400 }
      )
    }
    if (type === "subcategories") {
      setSubcategoryOrder(categoryId, orderedIds)
      return NextResponse.json({ ok: true })
    }
    if (type === "articles") {
      if (!subcategoryId) {
        return NextResponse.json({ error: "subcategoryId required for articles" }, { status: 400 })
      }
      setArticleOrder(categoryId, subcategoryId, orderedIds)
      return NextResponse.json({ ok: true })
    }
    if (type === "posts") {
      if (!subcategoryId || !articleId) {
        return NextResponse.json(
          { error: "subcategoryId and articleId required for posts" },
          { status: 400 }
        )
      }
      setPostOrder(categoryId, subcategoryId, articleId, orderedIds)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
