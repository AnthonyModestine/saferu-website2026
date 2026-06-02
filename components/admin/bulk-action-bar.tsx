"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface BulkActionBarProps {
  selectedCount: number
  onDelete: () => void
  deleting?: boolean
  label?: string
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  deleting = false,
  label = "item",
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#1470AF]/30 bg-[#1470AF]/5 px-4 py-3">
      <span className="text-sm font-medium text-gray-900">
        {selectedCount} {label}
        {selectedCount !== 1 ? "s" : ""} selected
      </span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={deleting}
        onClick={onDelete}
        className="gap-1"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {deleting ? "Deleting…" : "Delete selected"}
      </Button>
    </div>
  )
}
