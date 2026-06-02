"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Send, ChevronRight, Trash2 } from "lucide-react"
import { BulkActionBar } from "@/components/admin/bulk-action-bar"
import { articleRowKey } from "@/lib/admin-content-list"
import { setArticleVisibility } from "@/lib/admin-visibility-client"

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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const allSelected = items.length > 0 && items.every((i) =>
    selected.has(articleRowKey(i.categoryId, i.subcategoryId, i.articleId))
  )

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        items.forEach((i) =>
          next.delete(articleRowKey(i.categoryId, i.subcategoryId, i.articleId))
        )
      } else {
        items.forEach((i) =>
          next.add(articleRowKey(i.categoryId, i.subcategoryId, i.articleId))
        )
      }
      return next
    })
  }

  const toggleOne = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectedItems = items.filter((i) =>
    selected.has(articleRowKey(i.categoryId, i.subcategoryId, i.articleId))
  )

  const handleBulkPublish = async () => {
    setPublishing(true)
    try {
      for (const item of selectedItems) {
        await setArticleVisibility(
          item.categoryId,
          item.subcategoryId,
          item.articleId,
          true
        )
      }
      setSelected(new Set())
      router.refresh()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to publish selected articles")
    } finally {
      setPublishing(false)
    }
  }

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Delete ${selectedItems.length} draft article${selectedItems.length !== 1 ? "s" : ""}? This cannot be undone.`
      )
    ) {
      return
    }
    setDeleting(true)
    try {
      const res = await fetch("/api/cms/articles/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles: selectedItems.map((i) => ({
            categoryId: i.categoryId,
            subcategoryId: i.subcategoryId,
            articleId: i.articleId,
          })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(data.error || "Bulk delete failed")
        return
      }
      setSelected(new Set())
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

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
    <>
      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#1470AF]/30 bg-[#1470AF]/5 px-4 py-3">
          <span className="text-sm font-medium text-gray-900">
            {selected.size} article{selected.size !== 1 ? "s" : ""} selected
          </span>
          <Button
            type="button"
            size="sm"
            className="gap-1 bg-green-600 hover:bg-green-700"
            disabled={publishing}
            onClick={handleBulkPublish}
          >
            <Send className="h-3.5 w-3.5" />
            {publishing ? "Publishing…" : "Publish selected"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={deleting}
            onClick={handleBulkDelete}
            className="gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting…" : "Delete selected"}
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <label className="mb-4 flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
          Select all drafts
        </label>
      )}

      <ul className="divide-y">
        {items.map((item) => {
          const key = articleRowKey(item.categoryId, item.subcategoryId, item.articleId)
          return (
            <li
              key={key}
              className="flex items-center justify-between gap-4 py-4 first:pt-0"
            >
              <Checkbox
                checked={selected.has(key)}
                onCheckedChange={() => toggleOne(key)}
                className="shrink-0"
              />
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
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    void handlePublish(item.categoryId, item.subcategoryId, item.articleId)
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                  Publish
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    void handleDelete(
                      item.categoryId,
                      item.subcategoryId,
                      item.articleId,
                      item.articleTitle
                    )
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
