import { NextRequest, NextResponse } from "next/server"
import { addPost, generateId, removePost, updatePost, isCmsPost } from "@/lib/cms-additions"
import { loadCmsAdditions, persistAdditions } from "@/lib/cms-additions-persist"
import { setPostMessageOverride, clearPostMessageOverride } from "@/lib/content-overrides"
import { loadContentMeta, persistContentMeta } from "@/lib/content-meta-persist"
import { revalidateContentPages } from "@/lib/revalidate-content"
import { unauthorizedIfNotAdmin } from "@/lib/require-admin-api"

export async function POST(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { categoryId, subcategoryId, articleId, title, image, message, facebook, instagram, twitter } = body as {
      categoryId: string
      subcategoryId: string
      articleId: string
      title: string
      image?: string
      message?: string
      facebook?: string
      instagram?: string
      twitter?: string
    }
    if (!categoryId || !subcategoryId || !articleId || !title?.trim()) {
      return NextResponse.json({ error: "categoryId, subcategoryId, articleId, and title required" }, { status: 400 })
    }
    await loadCmsAdditions()
    const caption = (message || facebook || "").trim() || "Share this with your community. #SaferU"
    addPost({
      categoryId,
      subcategoryId,
      articleId,
      id: generateId("post", title),
      title: title.trim(),
      image: (image || "").trim() || undefined,
      message: caption,
      captions: {
        facebook: (facebook || message || caption).trim(),
        instagram: (instagram || message || caption).trim(),
        twitter: (twitter || message || caption).trim(),
      },
    })
    await persistAdditions()
    revalidateContentPages(categoryId, subcategoryId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[cms/post] POST error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { categoryId, subcategoryId, articleId, postId, title, image, message } = body as {
      categoryId: string
      subcategoryId: string
      articleId: string
      postId: string
      title?: string
      image?: string
      message?: string
    }
    if (!categoryId || !subcategoryId || !articleId || !postId) {
      return NextResponse.json({ error: "Missing required ids" }, { status: 400 })
    }

    await Promise.all([loadCmsAdditions(), loadContentMeta()])

    if (isCmsPost(categoryId, subcategoryId, articleId, postId)) {
      const ok = updatePost(categoryId, subcategoryId, articleId, postId, {
        title,
        image,
        message,
      })
      if (!ok) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 })
      }
      await persistAdditions()
    } else {
      if (message !== undefined) {
        if (message.trim()) {
          setPostMessageOverride(categoryId, subcategoryId, articleId, postId, message.trim())
        } else {
          clearPostMessageOverride(categoryId, subcategoryId, articleId, postId)
        }
      }
      await persistContentMeta()
    }

    revalidateContentPages(categoryId, subcategoryId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[cms/post] PATCH error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update post" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const denied = await unauthorizedIfNotAdmin()
  if (denied) return denied
  try {
    const body = await request.json()
    const { categoryId, subcategoryId, articleId, postId } = body as {
      categoryId: string
      subcategoryId: string
      articleId: string
      postId: string
    }
    if (!categoryId || !subcategoryId || !articleId || !postId) {
      return NextResponse.json(
        { error: "categoryId, subcategoryId, articleId, and postId required" },
        { status: 400 }
      )
    }
    await loadCmsAdditions()
    removePost(categoryId, subcategoryId, articleId, postId)
    await persistAdditions()
    revalidateContentPages(categoryId, subcategoryId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[cms/post] DELETE error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete post" },
      { status: 500 }
    )
  }
}
