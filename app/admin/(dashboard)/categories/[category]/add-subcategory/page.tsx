"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"

export default function AddSubcategoryPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.category as string

  const [formData, setFormData] = useState({ title: "", description: "" })
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!formData.title?.trim()) {
      setError("Title is required")
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/cms/subcategory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          title: formData.title.trim(),
          description: formData.description.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Failed to add subcategory")
        setIsSaving(false)
        return
      }
      router.push(`/admin/categories/${categoryId}`)
      router.refresh()
    } catch {
      setError("Failed to add subcategory")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-4">
        <Button asChild variant="ghost" size="icon" className="bg-transparent">
          <Link href={`/admin/categories/${categoryId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Subcategory</h1>
          <p className="mt-1 text-gray-500">Add a new subcategory to this category</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Subcategory Details</CardTitle>
            <CardDescription>Enter the title and optional description.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Vacation Tips"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this subcategory..."
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
            <Link href={`/admin/categories/${categoryId}`}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90"
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Adding…" : "Add Subcategory"}
          </Button>
        </div>
      </form>
    </div>
  )
}
