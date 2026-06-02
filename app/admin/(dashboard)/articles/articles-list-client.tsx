"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, ImageIcon, ChevronRight, Search } from "lucide-react"
import { BulkActionBar } from "@/components/admin/bulk-action-bar"
import { articleRowKey } from "@/lib/admin-content-list"

interface ArticleItem {
  id: string
  title: string
  description: string
  categoryId: string
  categoryTitle: string
  subcategoryId: string
  subcategoryTitle: string
  posts: unknown[]
}

export function ArticlesListClient({ articles }: { articles: ArticleItem[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const filtered = query.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.description?.toLowerCase().includes(query.toLowerCase()) ||
          a.categoryTitle.toLowerCase().includes(query.toLowerCase()) ||
          a.subcategoryTitle.toLowerCase().includes(query.toLowerCase())
      )
    : articles

  const filteredKeys = filtered.map((a) =>
    articleRowKey(a.categoryId, a.subcategoryId, a.id)
  )
  const allFilteredSelected =
    filtered.length > 0 && filteredKeys.every((k) => selected.has(k))

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filteredKeys.forEach((k) => next.delete(k))
      } else {
        filteredKeys.forEach((k) => next.add(k))
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

  const handleBulkDelete = async () => {
    const items = articles.filter((a) =>
      selected.has(articleRowKey(a.categoryId, a.subcategoryId, a.id))
    )
    if (
      !window.confirm(
        `Delete ${items.length} article${items.length !== 1 ? "s" : ""} and all their posts? This cannot be undone.`
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
          articles: items.map((a) => ({
            categoryId: a.categoryId,
            subcategoryId: a.subcategoryId,
            articleId: a.id,
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

  return (
    <>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search articles..."
          className="pl-10 bg-white"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <BulkActionBar
        selectedCount={selected.size}
        onDelete={handleBulkDelete}
        deleting={deleting}
        label="article"
      />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Live on site</CardTitle>
            <CardDescription>
              {filtered.length === articles.length
                ? "Select articles to bulk delete. Drafts are under Drafts in the sidebar."
                : `${filtered.length} of ${articles.length} live articles match`}
            </CardDescription>
          </div>
          {filtered.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600 shrink-0 cursor-pointer">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all visible articles"
              />
              Select all
            </label>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-500">No articles match your search.</p>
            ) : (
              filtered.map((article) => {
                const key = articleRowKey(article.categoryId, article.subcategoryId, article.id)
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selected.has(key)}
                      onCheckedChange={() => toggleOne(key)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${article.title}`}
                    />
                    <Link
                      href={`/admin/articles/${article.categoryId}/${article.subcategoryId}/${article.id}`}
                      className="flex flex-1 min-w-0 items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                          <FileText className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{article.title}</p>
                          <p className="text-sm text-gray-500 truncate">{article.description}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {article.categoryTitle}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {article.subcategoryTitle}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {article.posts.length} post{article.posts.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </Link>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
