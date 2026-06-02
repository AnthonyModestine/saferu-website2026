"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Send, ChevronRight, Trash2 } from "lucide-react"

interface Item {
  categoryId: string
  subcategoryId: string
  articleId: string
  categoryTitle: string
  subcategoryTitle: string
  articleTitle: string
}

interface Props {
  items: Item[]
}

export function UnpublishedListClient({ items }: Props) {
  const router = useRouter()

  const handlePublish = async (categoryId: string, subcategoryId: string, articleId: string) => {
    await fetch("/api/content/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, subcategoryId, articleId, published: true }),
    })
    router.refresh()
  }

  const handleDelete = async (
    categoryId: string,
    subcategoryId: string,
    articleId: string,
    title: string
  ) => {
    if (!window.confirm(`Delete draft "${title}" permanently? This cannot be undone.`)) {
      return
    }
    const res = await fetch("/api/cms/article", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, subcategoryId, articleId }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      window.alert(data.error || "Failed to delete article")
      return
    }
    router.refresh()
  }

  return (
    <ul className="divide-y">
      {items.map((item) => (
        <li
          key={`${item.categoryId}::${item.subcategoryId}::${item.articleId}`}
          className="flex items-center justify-between gap-4 py-4 first:pt-0"
        >
          <Link
            href={`/admin/articles/${item.categoryId}/${item.subcategoryId}/${item.articleId}`}
            className="flex flex-1 min-w-0 items-center gap-4 hover:opacity-80"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <FileText className="h-5 w-5 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900">{item.articleTitle}</p>
              <p className="text-sm text-gray-500">
                {item.categoryTitle} → {item.subcategoryTitle}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-1 bg-green-600 hover:bg-green-700"
              onClick={() => handlePublish(item.categoryId, item.subcategoryId, item.articleId)}
            >
              <Send className="h-3.5 w-3.5" />
              Publish
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="gap-1"
              onClick={() =>
                handleDelete(
                  item.categoryId,
                  item.subcategoryId,
                  item.articleId,
                  item.articleTitle
                )
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
