"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Film, FolderOpen } from "lucide-react"
import { isVideoMediaUrl } from "@/lib/media-url"

interface MediaItem {
  name: string
  url: string
  size: number
  uploadedAt: string
  kind?: "image" | "video"
}

interface MediaPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
  title?: string
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Choose from Media Library",
}: MediaPickerDialogProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/media")
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setSearchQuery("")
      fetchItems()
    }
  }, [open, fetchItems])

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelect = (url: string) => {
    onSelect(url)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Select an image or video from your media library.
          </DialogDescription>
        </DialogHeader>

        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search media…"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-sm text-gray-600">
                {searchQuery ? "No media matches that search" : "No media uploaded yet"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Upload files in Admin → Media first
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {filtered.map((item) => {
                const isVideo = item.kind === "video" || isVideoMediaUrl(item.url)
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelect(item.url)}
                    className="group overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-left transition-colors hover:border-[#1470AF] hover:ring-2 hover:ring-[#1470AF]/30"
                  >
                    <div className="relative aspect-video bg-muted">
                      {isVideo ? (
                        <video
                          src={item.url}
                          className="absolute inset-0 h-full w-full object-cover bg-black"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <Image
                          src={item.url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      )}
                      {isVideo && (
                        <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5">
                          <Film className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="truncate p-2 text-xs font-medium text-gray-700">{item.name}</p>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
