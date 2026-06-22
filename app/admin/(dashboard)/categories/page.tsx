import React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronRight,
  ShieldCheck,
  Flame,
  Star,
  FolderOpen,
  CloudLightning,
  AlertTriangle,
  Users,
} from "lucide-react"
import { getAllCategories } from "@/lib/content-merged"
import { ensureContentLoaded } from "@/lib/ensure-content-loaded"

export const dynamic = "force-dynamic"

const categoryIcons: Record<string, React.ElementType> = {
  "crime-prevention": ShieldCheck,
  "fire-prevention": Flame,
  "whats-new": Star,
  "weather-preparedness": CloudLightning,
  "natural-disaster": AlertTriangle,
  "community-awareness": Users,
}

const categoryColors: Record<string, string> = {
  "crime-prevention": "bg-[#1470AF]",
  "fire-prevention": "bg-[#e07c3e]",
  "whats-new": "bg-[#f2b233]",
  "weather-preparedness": "bg-[#5b7a9d]",
  "natural-disaster": "bg-[#c44d4d]",
  "community-awareness": "bg-[#4a9d6b]",
}

export default async function CategoriesPage() {
  await ensureContentLoaded()
  const mainCategories = getAllCategories({ includeUnpublished: true })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <p className="mt-1 text-gray-500">
          Manage your content categories and subcategories
        </p>
      </div>

      <div className="space-y-6">
        {mainCategories.map((category) => {
          const Icon = categoryIcons[category.id] || FolderOpen
          const bgColor = categoryColors[category.id] || "bg-gray-500"
          const totalArticles = category.subcategories.reduce(
            (acc, sub) => acc + sub.articles.length,
            0
          )
          const totalPosts = category.subcategories.reduce(
            (acc, sub) =>
              acc +
              sub.articles.reduce((artAcc, art) => artAcc + art.posts.length, 0),
            0
          )

          return (
            <Card key={category.id}>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgColor}`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{totalArticles} articles</Badge>
                    <Badge variant="secondary">{totalPosts} posts</Badge>
                    {category.id === "whats-new" && (
                      <Badge className="bg-[#1470AF] text-white">Members Only</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {category.subcategories.map((subcategory) => {
                    const subArticleCount = subcategory.articles.length
                    const subPostCount = subcategory.articles.reduce(
                      (acc, art) => acc + art.posts.length,
                      0
                    )

                    return (
                      <Link
                        key={subcategory.id}
                        href={`/admin/categories/${category.id}/${subcategory.id}`}
                        className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <FolderOpen className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{subcategory.title}</p>
                            <p className="text-sm text-gray-500">{subcategory.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500">
                            {subArticleCount} articles, {subPostCount} posts
                          </span>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
