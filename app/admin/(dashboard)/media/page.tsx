"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  FolderOpen
} from "lucide-react"

// Placeholder media items - in production these would come from Supabase Storage
const mediaItems = [
  { id: "1", name: "lock-it-up.jpg", url: "/images/posts/placeholder-1.jpg", size: "245 KB", uploadedAt: "2024-01-15" },
  { id: "2", name: "light-it-up.jpg", url: "/images/posts/placeholder-2.jpg", size: "312 KB", uploadedAt: "2024-01-15" },
  { id: "3", name: "neighborhood-watch.jpg", url: "/images/posts/placeholder-3.jpg", size: "287 KB", uploadedAt: "2024-01-14" },
  { id: "4", name: "car-safety.jpg", url: "/images/posts/placeholder-4.jpg", size: "298 KB", uploadedAt: "2024-01-14" },
  { id: "5", name: "tornado-warning.jpg", url: "/images/posts/tornado-warning.jpg", size: "276 KB", uploadedAt: "2024-01-13" },
  { id: "6", name: "emergency-kit.jpg", url: "/images/posts/emergency-kit.jpg", size: "321 KB", uploadedAt: "2024-01-13" },
]

export default function MediaLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)

  const filteredMedia = mediaItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
          <p className="mt-1 text-gray-500">
            Manage your images and graphics for social media posts
          </p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
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
                Upload images to use in your social media posts. Recommended size: 1920x1080 (16:9 ratio).
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12">
                <Upload className="mb-4 h-12 w-12 text-gray-400" />
                <p className="mb-2 text-sm text-gray-600">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or WebP (max 5MB)</p>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  className="mt-4 max-w-xs"
                />
              </div>
              <p className="mt-4 text-center text-sm text-gray-500">
                Note: Image upload requires Supabase Storage integration.
                <br />
                For now, add images to the /public/images/posts folder.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input 
          placeholder="Search images..." 
          className="pl-10 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Media Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            {filteredMedia.length} image{filteredMedia.length !== 1 ? "s" : ""} in library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">No images found</h3>
              <p className="mt-1 text-gray-500">
                {searchQuery ? "Try a different search term" : "Upload your first image to get started"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="aspect-video relative">
                    <Image
                      src={item.url || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8"
                        onClick={() => handleCopyUrl(item.id, item.url)}
                      >
                        {copiedId === item.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{item.size}</span>
                      <span>{item.uploadedAt}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-inside list-decimal space-y-2 text-sm text-gray-600">
            <li>Upload your image or copy the URL of an existing image</li>
            <li>When creating a new post, paste the image URL in the image field</li>
            <li>Images should be 16:9 ratio (1920x1080 recommended) for best display</li>
            <li>Always include #SaferNeighborhoodsTogether and #SaferU in your captions</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
