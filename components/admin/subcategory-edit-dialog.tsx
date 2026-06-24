"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface SubcategoryEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: string
  subcategoryId: string
  initialTitle: string
  initialDescription: string
}

export function SubcategoryEditDialog({
  open,
  onOpenChange,
  categoryId,
  subcategoryId,
  initialTitle,
  initialDescription,
}: SubcategoryEditDialogProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setTitle(initialTitle)
      setDescription(initialDescription)
      setError(null)
    }
    onOpenChange(next)
  }

  const handleSave = async () => {
    setError(null)
    if (!title.trim()) {
      setError("Title is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/cms/subcategory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          subcategoryId,
          title: title.trim(),
          description: description.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Failed to save changes")
        return
      }
      onOpenChange(false)
      router.refresh()
    } catch {
      setError("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit subcategory</DialogTitle>
          <DialogDescription>
            Rename this subcategory or update its description. Changes appear on the public site.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="subcategory-title">Title *</Label>
            <Input
              id="subcategory-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Home Security"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subcategory-description">Description</Label>
            <Textarea
              id="subcategory-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description for this subcategory"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
