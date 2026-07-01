"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { CategoryLayoutMode } from "@/lib/content-meta-store"

interface CategoryLayoutToggleProps {
  categoryId: string
  categoryTitle: string
  layout: CategoryLayoutMode
  canConfigure: boolean
}

export function CategoryLayoutToggle({
  categoryId,
  categoryTitle,
  layout: initialLayout,
  canConfigure,
}: CategoryLayoutToggleProps) {
  const router = useRouter()
  const [layout, setLayout] = useState(initialLayout)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = async (value: CategoryLayoutMode) => {
    if (!canConfigure || value === layout) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/content/category-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, layout: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error || "Failed to save")
        return
      }
      setLayout(value)
      router.refresh()
    } catch {
      setError("Failed to save. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Category structure</CardTitle>
        <CardDescription>
          Choose how {categoryTitle} is organized on the site and in admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!canConfigure ? (
          <p className="text-sm text-gray-600">
            {categoryTitle} always lists articles directly (no subcategories).
          </p>
        ) : (
          <RadioGroup
            value={layout}
            onValueChange={(v) => handleChange(v as CategoryLayoutMode)}
            className="space-y-3"
            disabled={saving}
          >
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
              <RadioGroupItem value="flat" id={`${categoryId}-flat`} className="mt-1" />
              <Label htmlFor={`${categoryId}-flat`} className="cursor-pointer font-normal">
                <span className="font-medium text-gray-900">Articles only</span>
                <p className="mt-1 text-sm text-gray-500">
                  Visitors open {categoryTitle} and see articles immediately — like What&apos;s New.
                  No subcategory step.
                </p>
              </Label>
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
              <RadioGroupItem value="nested" id={`${categoryId}-nested`} className="mt-1" />
              <Label htmlFor={`${categoryId}-nested`} className="cursor-pointer font-normal">
                <span className="font-medium text-gray-900">Subcategories</span>
                <p className="mt-1 text-sm text-gray-500">
                  Group articles under topics (e.g. Home, Vehicle, Cyber). Visitors pick a topic
                  first, then see articles.
                </p>
              </Label>
            </div>
          </RadioGroup>
        )}
        {saving && <p className="mt-3 text-sm text-gray-500">Saving…</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  )
}
