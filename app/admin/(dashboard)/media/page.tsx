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
  Film,
} from "lucide-react"
import { isVideoMediaUrl } from "@/lib/media-url"
import { uploadAdminMediaFile } from "@/lib/upload-media-client"

interface MediaItem {
  name: string
  url: string
  size: number
  uploadedAt: string
  kind?: "image" | "video"
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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
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
    setUploadProgress({})
  }

  const handleUpload = async () => {
    if (!uploadFiles.length) return
    setUploading(true)
    setUploadResults([])
    setUploadProgress({})
    const results: { name: string; ok: boolean; error?: string }[] = []
    for (const file of uploadFiles) {
      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))
      try {
        await uploadAdminMediaFile(file, (progress) => {
          setUploadProgress((prev) => ({ ...prev, [file.name]: progress.percentage }))
        })
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }))
        results.push({ name: file.name, ok: true })
        setUploadResults([...results])
      } catch (err) {
        setUploadProgress((prev) => {
          const next = { ...prev }
          delete next[file.name]
          return next
        })
        results.push({
          name: file.name,
          ok: false,
          error: err instanceof Error ? err.message : "Upload failed",
        })
        setUploadResults([...results])
      }
    }
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
          <p className="mt-1 text-gray-500">Upload and manage images and MP4 videos for your posts</p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={(open) => {
          setIsUploadOpen(open)
          if (!open) { setUploadFiles([]); setUploadResults([]); setUploadProgress({}) }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
              <Upload className="mr-2 h-4 w-4" />
              Upload Media
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload media</DialogTitle>
              <DialogDescription>
                Images: PNG, JPG, WebP, or GIF (max 10MB). Videos: MP4 (max 100MB). Recommended: 1920×1080 (16:9).
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
                <p className="text-xs text-gray-400 mt-1">Images up to 10MB · MP4 up to 100MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,.mp4"
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
                    const progress = uploadProgress[f.name]
                    const inProgress = uploading && progress !== undefined && !result
                    return (
                      <div key={f.name} className="rounded-md border border-border px-3 py-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate max-w-[200px] text-foreground">{f.name}</span>
                          <span className="ml-2 shrink-0">
                            {result ? (
                              result.ok ? (
                                <span className="text-green-600 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Uploaded</span>
                              ) : (
                                <span className="text-red-600 flex items-center gap-1"><X className="h-3.5 w-3.5" /> {result.error}</span>
                              )
                            ) : inProgress ? (
                              <span className="text-[#1470AF] flex items-center gap-1">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                {progress <= 3 ? "Preparing…" : `${progress}%`}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">{formatBytes(f.size)}</span>
                            )}
                          </span>
                        </div>
                        {inProgress && (
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full bg-[#1470AF] transition-all duration-300"
                              style={{ width: `${Math.max(progress, 5)}%` }}
                            />
                          </div>
                        )}
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
          placeholder="Search media…"
          className="pl-10 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Media library</CardTitle>
          <CardDescription>
            {loading ? "Loading…" : `${filtered.length} file${filtered.length !== 1 ? "s" : ""}`}
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
                {searchQuery ? "No media matches that search" : "No media uploaded yet"}
              </h3>
              <p className="mt-1 text-gray-500">
                {searchQuery ? "Try a different search term" : "Click Upload Media to add your first file"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => {
                const isVideo = item.kind === "video" || isVideoMediaUrl(item.url)
                return (
                <div
                  key={item.name}
                  className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="aspect-video relative bg-muted">
                    {isVideo ? (
                      <video
                        src={item.url}
                        className="absolute inset-0 h-full w-full object-cover bg-black"
                        controls
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <Image
                        src={item.url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    )}
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
                    <p className="truncate text-sm font-medium text-gray-900 flex items-center gap-1.5">
                      {isVideo && <Film className="h-3.5 w-3.5 shrink-0 text-gray-500" />}
                      {item.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{formatBytes(item.size)}</span>
                      <span>{formatDate(item.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to use media</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2 text-sm text-gray-600">
            <li>Upload an image or MP4 video using the button above</li>
            <li>Hover over any file and click the copy icon to get its URL</li>
            <li>Paste the URL into the media field when creating or editing a post</li>
            <li>Visitors can play videos on the article page and download them with one click</li>
            <li>Recommended size: 1920×1080 (16:9 ratio) for best display</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
