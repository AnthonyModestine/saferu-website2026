"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, ImageIcon, ChevronRight, Search } from "lucide-react"

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
  const [query, setQuery] = useState("")

  const filtered = query.trim()
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.description?.toLowerCase().includes(query.toLowerCase()) ||
          a.categoryTitle.toLowerCase().includes(query.toLowerCase()) ||
          a.subcategoryTitle.toLowerCase().includes(query.toLowerCase())
      )
    : articles

  return (
    <>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search articles..."
          className="pl-10 bg-white"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Articles List */}
      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
          <CardDescription>
            {filtered.length === articles.length
              ? "Click an article to view and edit its posts"
              : `${filtered.length} of ${articles.length} articles match`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-500">No articles match your search.</p>
            ) : (
              filtered.map((article) => (
                <Link
                  key={`${article.categoryId}-${article.subcategoryId}-${article.id}`}
                  href={`/admin/articles/${article.categoryId}/${article.subcategoryId}/${article.id}`}
                  className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                      <FileText className="h-6 w-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{article.title}</p>
                      <p className="text-sm text-gray-500">{article.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {article.categoryTitle}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {article.subcategoryTitle}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {article.posts.length} post{article.posts.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
