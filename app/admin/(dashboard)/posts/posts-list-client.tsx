"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageIcon, ChevronRight, Search } from "lucide-react"
import { BulkActionBar } from "@/components/admin/bulk-action-bar"
import { postRowKey, type AdminPostRow } from "@/lib/admin-content-list"

export function PostsListClient({ posts }: { posts: AdminPostRow[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const categories = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of posts) {
      map.set(p.categoryId, p.categoryTitle)
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [posts])

  const filtered = useMemo(() => {
    let list = posts
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.categoryId === categoryFilter)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.postTitle.toLowerCase().includes(q) ||
          p.articleTitle.toLowerCase().includes(q) ||
          p.categoryTitle.toLowerCase().includes(q) ||
          p.subcategoryTitle.toLowerCase().includes(q)
      )
    }
    return list
  }, [posts, categoryFilter, query])

  const filteredKeys = filtered.map((p) =>
    postRowKey(p.categoryId, p.subcategoryId, p.articleId, p.postId)
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
    const items = posts.filter((p) =>
      selected.has(postRowKey(p.categoryId, p.subcategoryId, p.articleId, p.postId))
    )
    if (
      !window.confirm(
        `Delete ${items.length} post${items.length !== 1 ? "s" : ""}? This cannot be undone.`
      )
    ) {
      return
    }
    setDeleting(true)
    try {
      const res = await fetch("/api/cms/posts/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: items.map((p) => ({
            categoryId: p.categoryId,
            subcategoryId: p.subcategoryId,
            articleId: p.articleId,
            postId: p.postId,
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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search posts, articles, categories..."
            className="pl-10 bg-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[220px] bg-white">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map(([id, title]) => (
              <SelectItem key={id} value={id}>
                {title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <BulkActionBar
        selectedCount={selected.size}
        onDelete={handleBulkDelete}
        deleting={deleting}
        label="post"
      />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Posts</CardTitle>
            <CardDescription>
              {filtered.length === posts.length
                ? "Each post belongs to an article. Open an article to add new posts."
                : `${filtered.length} of ${posts.length} posts shown`}
            </CardDescription>
          </div>
          {filtered.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600 shrink-0 cursor-pointer">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all visible posts"
              />
              Select all
            </label>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-500">No posts match your filters.</p>
            ) : (
              filtered.map((post) => {
                const key = postRowKey(
                  post.categoryId,
                  post.subcategoryId,
                  post.articleId,
                  post.postId
                )
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selected.has(key)}
                      onCheckedChange={() => toggleOne(key)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${post.postTitle}`}
                    />
                    <Link
                      href={`/admin/articles/${post.categoryId}/${post.subcategoryId}/${post.articleId}`}
                      className="flex flex-1 min-w-0 items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                          <ImageIcon className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{post.postTitle}</p>
                          <p className="text-sm text-gray-500 truncate">
                            Article: {post.articleTitle}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {post.categoryTitle}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {post.subcategoryTitle}
                            </Badge>
                            {!post.articlePublished && (
                              <Badge className="text-xs bg-amber-100 text-amber-800">
                                Draft article
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
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
