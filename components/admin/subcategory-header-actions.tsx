"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Loader2 } from "lucide-react"
import { SubcategoryEditDialog } from "@/components/admin/subcategory-edit-dialog"

interface SubcategoryHeaderActionsProps {
  categoryId: string
  subcategoryId: string
  title: string
  description: string
  articleCount: number
  canDelete: boolean
}

export function SubcategoryHeaderActions({
  categoryId,
  subcategoryId,
  title,
  description,
  articleCount,
  canDelete,
}: SubcategoryHeaderActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const message =
      articleCount > 0
        ? `Delete "${title}" and all ${articleCount} article${articleCount !== 1 ? "s" : ""} inside it? This cannot be undone.`
        : `Delete "${title}"? This cannot be undone.`
    if (!confirm(message)) return

    setDeleting(true)
    try {
      const res = await fetch("/api/cms/subcategory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, subcategoryId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(data.error || "Failed to delete subcategory")
        return
      }
      router.push(`/admin/categories/${categoryId}`)
      router.refresh()
    } catch {
      window.alert("Failed to delete subcategory")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setEditOpen(true)}
          className="bg-transparent"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit subcategory
        </Button>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={!canDelete || deleting}
          className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
          title={canDelete ? "Delete subcategory" : "Cannot delete the only subcategory"}
        >
          {deleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete
        </Button>
      </div>

      <SubcategoryEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        initialTitle={title}
        initialDescription={description}
      />
    </>
  )
}
