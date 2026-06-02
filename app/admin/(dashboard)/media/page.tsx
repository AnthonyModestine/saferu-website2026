"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Upload,
  Search,
  ImageIcon,
  Copy,
  Check,
  Trash2,
  FolderOpen,
  Loader2,
  X,
} from "lucide-react"

interface MediaItem {
  name: string
  url: string
  size: number
  uploadedAt: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedName, setCopiedName] = useState<string | null>(null)
  const [deletingName, setDeletingName] = useState<string | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<{ name: string; ok: boolean; error?: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => { fetchItems() }, [fetchItems])

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCopy = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url)
    setCopiedName(item.name)
    setTimeout(() => setCopiedName(null), 2000)
  }

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    setDeletingName(item.name)
    try {
      await fetch("/api/admin/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: item.name }),
      })
      await fetchItems()
    } finally {
      setDeletingName(null)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadFiles(Array.from(e.target.files ?? []))
    setUploadResults([])
  }

  const handleUpload = async () => {
    if (!uploadFiles.length) return
    setUploading(true)
    setUploadResults([])
    const results: { name: string; ok: boolean; error?: string }[] = []
    for (const file of uploadFiles) {
      const form = new FormData()
      form.append("file", file)
      try {
        const res = await fetch("/api/upload", { method: "POST", body: form })
        const data = await res.json()
        if (res.ok && data.url) {
          results.push({ name: file.name, ok: true })
        } else {
          results.push({ name: file.name, ok: false, error: data.error ?? "Upload failed" })
        }
      } catch {
        results.push({ name: file.name, ok: false, error: "Network error" })
      }
    }
    setUploadResults(results)
    setUploading(false)
    if (results.some((r) => r.ok)) {
      await fetchItems()
      if (results.every((r) => r.ok)) {
        setTimeout(() => {
          setIsUploadOpen(false)
          setUploadFiles([])
          setUploadResults([])
          if (fileInputRef.current) fileInputRef.current.value = ""
        }, 1200)
      }
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="mt-1 text-gray-500">Upload and manage images for your posts</p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={(open) => {
          setIsUploadOpen(open)
          if (!open) { setUploadFiles([]); setUploadResults([]) }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
              <Upload className="mr-2 h-4 w-4" />
              Upload Images
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Images</DialogTitle>
              <DialogDescription>
                PNG, JPG, WebP, or GIF — max 10MB each. Recommended: 1920×1080 (16:9).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Drop zone */}
              <div
                className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-10 cursor-pointer hover:border-[#1470AF]/50 hover:bg-[#1470AF]/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mb-3 h-10 w-10 text-gray-400" />
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Click to select files</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP, GIF — max 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Selected files list */}
              {uploadFiles.length > 0 && (
                <div className="space-y-1">
                  {uploadFiles.map((f) => {
                    const result = uploadResults.find((r) => r.name === f.name)
                    return (
                      <div key={f.name} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                        <span className="truncate max-w-[200px] text-foreground">{f.name}</span>
                        <span className="ml-2 shrink-0">
                          {result ? (
                            result.ok ? (
                              <span className="text-green-600 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Uploaded</span>
                            ) : (
                              <span className="text-red-600 flex items-center gap-1"><X className="h-3.5 w-3.5" /> {result.error}</span>
                            )
                          ) : (
                            <span className="text-muted-foreground">{formatBytes(f.size)}</span>
                          )}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              <Button
                className="w-full bg-[#1470AF] text-white hover:bg-[#1470AF]/90"
                disabled={!uploadFiles.length || uploading}
                onClick={handleUpload}
              >
                {uploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" />Upload {uploadFiles.length > 0 ? `${uploadFiles.length} file${uploadFiles.length > 1 ? "s" : ""}` : ""}</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search images…"
          className="pl-10 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${filtered.length} image${filtered.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">
                {searchQuery ? "No images match that search" : "No images uploaded yet"}
              </h3>
              <p className="mt-1 text-gray-500">
                {searchQuery ? "Try a different search term" : "Click Upload Images to add your first image"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => (
                <div
                  key={item.name}
                  className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="aspect-video relative bg-muted">
                    <Image
                      src={item.url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleCopy(item)}
                        title="Copy URL"
                      >
                        {copiedName === item.name ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => handleDelete(item)}
                        disabled={deletingName === item.name}
                        title="Delete"
                      >
                        {deletingName === item.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{formatBytes(item.size)}</span>
                      <span>{formatDate(item.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2 text-sm text-gray-600">
            <li>Upload your image using the button above</li>
            <li>Hover over any image and click the copy icon to get its URL</li>
            <li>Paste the URL into the image field when creating or editing a post</li>
            <li>Recommended size: 1920×1080 (16:9 ratio) for best display</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
