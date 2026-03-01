"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Send, ChevronRight } from "lucide-react"

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
          <Button
            type="button"
            size="sm"
            className="shrink-0 bg-green-600 hover:bg-green-700 gap-1"
            onClick={() => handlePublish(item.categoryId, item.subcategoryId, item.articleId)}
          >
            <Send className="h-3.5 w-3.5" />
            Publish
          </Button>
        </li>
      ))}
    </ul>
  )
}
