import { NextRequest, NextResponse } from "next/server"
import { removePost } from "@/lib/cms-additions"
import { loadCmsAdditions, persistAdditions } from "@/lib/cms-additions-persist"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { posts } = body as {
      posts: {
        categoryId: string
        subcategoryId: string
        articleId: string
        postId: string
      }[]
    }
    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: "posts array required" }, { status: 400 })
    }
    await loadCmsAdditions()
    for (const { categoryId, subcategoryId, articleId, postId } of posts) {
      if (!categoryId || !subcategoryId || !articleId || !postId) continue
      removePost(categoryId, subcategoryId, articleId, postId)
    }
    await persistAdditions()
    return NextResponse.json({ ok: true, deleted: posts.length })
  } catch (err) {
    console.error("[cms/posts/bulk-delete] error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bulk delete failed" },
      { status: 500 }
    )
  }
}
