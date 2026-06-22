"use client"

import React from "react"
import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import type { Category } from "@/lib/data/content-library"

function NewArticleFormInner({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const preselectedCategory = searchParams.get("category") || ""
  const preselectedSubcategory = searchParams.get("subcategory") || ""

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    slug: "",
    categoryId: preselectedCategory,
    subcategoryId: preselectedSubcategory,
  })
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const selectedCategory = categories.find((c) => c.id === formData.categoryId)
  const subcategories = selectedCategory?.subcategories || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title || !formData.categoryId || !formData.subcategoryId) {
      setError("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/cms/article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: formData.categoryId,
          subcategoryId: formData.subcategoryId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          slug: formData.slug.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Failed to create article")
        setIsSaving(false)
        return
      }
      const articleId = data.id
      router.refresh()
      router.push(
        `/admin/articles/${formData.categoryId}/${formData.subcategoryId}/${articleId}`
      )
    } catch {
      setError("Failed to create article")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Article Details</CardTitle>
          <CardDescription>
            New articles start as drafts (not live). Add posts, then publish from the article editor or Drafts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    categoryId: value,
                    subcategoryId: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory *</Label>
              <Select
                value={formData.subcategoryId}
                onValueChange={(value) => setFormData({ ...formData, subcategoryId: value })}
                disabled={!formData.categoryId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      formData.categoryId ? "Select a subcategory" : "Select category first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Article Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Burglary Prevention Tips"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL slug (optional)</Label>
            <Input
              id="slug"
              placeholder="e.g. StPatricksDaySafety"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              Custom URL path for this article. Letters, numbers, hyphens only. Leave blank to
              auto-generate.
            </p>
            {formData.slug.trim() && formData.categoryId && formData.subcategoryId && (
              <p className="text-xs font-medium text-gray-700 mt-1">
                URL will be: www.saferu.com
                {formData.categoryId === "whats-new"
                  ? `/whats-new/${formData.slug.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}`
                  : `/${formData.categoryId}/${formData.subcategoryId}/${formData.slug.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this article..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-3">
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/admin/articles">Cancel</Link>
        </Button>
        <Button
          type="submit"
          className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90"
          disabled={isSaving}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Creating..." : "Create Article"}
        </Button>
      </div>
    </form>
  )
}

export function NewArticleForm({ categories }: { categories: Category[] }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewArticleFormInner categories={categories} />
    </Suspense>
  )
}
