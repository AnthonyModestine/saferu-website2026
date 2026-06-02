"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, ImageIcon, ChevronUp, ChevronDown, ChevronRight, Send, EyeOff, GripVertical } from "lucide-react"
import type { Article } from "@/lib/data/content-library"
import { setArticleVisibility } from "@/lib/admin-visibility-client"

function reorderIds(ids: string[], fromIndex: number, toIndex: number): string[] {
  if (fromIndex === toIndex) return ids
  const copy = [...ids]
  const [removed] = copy.splice(fromIndex, 1)
  copy.splice(toIndex, 0, removed)
  return copy
}

interface Props {
  categoryId: string
  subcategoryId: string
  articles: Article[]
  /** articleId -> true if published (live), false if draft. If omitted, all shown as published. */
  publishedByArticleId?: Record<string, boolean>
}

export function ArticleListOrder({ categoryId, subcategoryId, articles, publishedByArticleId }: Props) {
  const router = useRouter()
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [visibilityArticleId, setVisibilityArticleId] = useState<string | null>(null)
  const ids = articles.map((a) => a.id)
  const isPublished = (articleId: string) => publishedByArticleId?.[articleId] !== false

  const setVisibility = async (articleId: string, published: boolean) => {
    setVisibilityArticleId(articleId)
    try {
      await setArticleVisibility(categoryId, subcategoryId, articleId, published)
      router.refresh()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update article visibility")
    } finally {
      setVisibilityArticleId(null)
    }
  }

  const applyOrder = async (newOrder: string[]) => {
    const res = await fetch("/api/content/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "articles", categoryId, subcategoryId, orderedIds: newOrder }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      window.alert((data as { error?: string }).error || "Failed to reorder articles")
      return
    }
    router.refresh()
  }

  const move = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= ids.length) return
    await applyOrder(reorderIds(ids, index, newIndex))
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index))
    e.dataTransfer.effectAllowed = "move"
  }
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }
  const handleDragLeave = () => setDragOverIndex(null)
  const handleDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10)
    if (Number.isNaN(fromIndex) || fromIndex === toIndex) return
    await applyOrder(reorderIds(ids, fromIndex, toIndex))
  }

  return (
    <div className="divide-y">
      {articles.map((article, index) => (
        <div
          key={article.id}
          className={`flex items-center justify-between gap-2 px-6 py-4 hover:bg-gray-50 ${dragOverIndex === index ? "bg-[#1470AF]/10 border-l-4 border-[#1470AF]" : ""}`}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
        >
          <div className="flex flex-1 min-w-0 items-center gap-2">
            <div
              className="flex cursor-grab active:cursor-grabbing touch-none items-center rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              title="Drag to reorder"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => move(index, "up")}
                disabled={index === 0}
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => move(index, "down")}
                disabled={index === ids.length - 1}
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            <Link
              href={`/admin/articles/${categoryId}/${subcategoryId}/${article.id}`}
              className="flex flex-1 items-center gap-4 min-w-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{article.title}</p>
                <p className="text-sm text-gray-500 truncate">{article.description}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {publishedByArticleId && !isPublished(article.id) && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">Draft</Badge>
                )}
                <ImageIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {article.posts.length} post{article.posts.length !== 1 ? "s" : ""}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          </div>
          {publishedByArticleId && (
            <div className="flex shrink-0 items-center gap-2">
              {isPublished(article.id) ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  disabled={visibilityArticleId === article.id}
                  onClick={() => setVisibility(article.id, false)}
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  {visibilityArticleId === article.id ? "Saving…" : "Unpublish"}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 gap-1 bg-green-600 hover:bg-green-700"
                  disabled={visibilityArticleId === article.id}
                  onClick={() => setVisibility(article.id, true)}
                >
                  <Send className="h-3.5 w-3.5" />
                  {visibilityArticleId === article.id ? "Publishing…" : "Publish"}
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
