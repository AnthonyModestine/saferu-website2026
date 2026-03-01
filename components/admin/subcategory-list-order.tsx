"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FolderOpen, ChevronUp, ChevronDown, ChevronRight, GripVertical } from "lucide-react"
import type { Subcategory } from "@/lib/data/content-library"

function reorderIds(ids: string[], fromIndex: number, toIndex: number): string[] {
  if (fromIndex === toIndex) return ids
  const copy = [...ids]
  const [removed] = copy.splice(fromIndex, 1)
  copy.splice(toIndex, 0, removed)
  return copy
}

interface Props {
  categoryId: string
  subcategories: Subcategory[]
}

export function SubcategoryListOrder({ categoryId, subcategories }: Props) {
  const router = useRouter()
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const ids = subcategories.map((s) => s.id)

  const applyOrder = async (newOrder: string[]) => {
    await fetch("/api/content/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subcategories", categoryId, orderedIds: newOrder }),
    })
    router.refresh()
  }

  const move = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= ids.length) return
    await applyOrder(reorderIds(ids, index, newIndex))
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index))
    e.dataTransfer.effectAllowed = "move"
  }
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }
  const handleDragLeave = () => setDragOverIndex(null)
  const handleDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10)
    if (Number.isNaN(fromIndex) || fromIndex === toIndex) return
    await applyOrder(reorderIds(ids, fromIndex, toIndex))
  }

  return (
    <div className="divide-y">
      {subcategories.map((subcategory, index) => {
        const articleCount = subcategory.articles.length
        const postCount = subcategory.articles.reduce(
          (acc, art) => acc + art.posts.length,
          0
        )
        return (
          <div
            key={subcategory.id}
            className={`flex items-center justify-between gap-2 px-6 py-4 hover:bg-gray-50 ${dragOverIndex === index ? "bg-[#1470AF]/10 border-l-4 border-[#1470AF]" : ""}`}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="flex flex-1 min-w-0 items-center gap-2">
              <div
                className="flex cursor-grab active:cursor-grabbing touch-none flex-col items-center rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                title="Drag to reorder"
              >
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => move(index, "up")}
                  disabled={index === 0}
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => move(index, "down")}
                  disabled={index === ids.length - 1}
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <Link
                href={`/admin/categories/${categoryId}/${subcategory.id}`}
                className="flex flex-1 items-center gap-4 min-w-0"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <FolderOpen className="h-5 w-5 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{subcategory.title}</p>
                  <p className="text-sm text-gray-500 truncate">{subcategory.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <Badge variant="secondary">{articleCount} articles</Badge>
                  <Badge variant="secondary">{postCount} posts</Badge>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}
