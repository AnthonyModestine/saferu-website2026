"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  ChevronRight, 
  Plus,
  ArrowLeft,
  Pencil,
  Trash2,
  ImageIcon,
  Save,
  ChevronUp,
  ChevronDown,
  Send,
  EyeOff,
  Link2,
  Copy,
  Upload,
  GripVertical,
} from "lucide-react"
import type { ImageOverrides } from "@/lib/content-overrides"
import type { Article, Category, Subcategory } from "@/lib/data/content-library"

type ArticleEditorClientProps = {
  category: Category
  subcategory: Subcategory
  article: Article
  categoryId: string
  subcategoryId: string
  articleId: string
  published: boolean
}

export default function ArticleEditorClient({
  category,
  subcategory,
  article: initialArticle,
  categoryId,
  subcategoryId,
  articleId,
  published: initialPublished,
}: ArticleEditorClientProps) {
  const router = useRouter()
  const [article, setArticle] = useState(initialArticle)
  const [published, setPublished] = useState(initialPublished)
  const [isAddPostOpen, setIsAddPostOpen] = useState(false)
  const [newPost, setNewPost] = useState({ title: "", image: "", message: "" })
  const [imageOverrides, setImageOverrides] = useState<ImageOverrides>({})
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editImageUrl, setEditImageUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [savingPost, setSavingPost] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [dragOverPostIndex, setDragOverPostIndex] = useState<number | null>(null)

  // Keep in sync when server re-fetches (e.g. after adding a post)
  useEffect(() => {
    setArticle(initialArticle)
    setPublished(initialPublished)
  }, [initialArticle, initialPublished])

  useEffect(() => {
    fetch("/api/content/overrides")
      .then((r) => (r.ok ? r.json() : {}))
      .then(setImageOverrides)
      .catch(() => {})
  }, [])

  const getPostImage = (post: { id: string; image?: string }) =>
    imageOverrides[categoryId]?.[subcategoryId]?.[articleId]?.[post.id] ?? post.image ?? ""

  const handleSaveImageOverride = async () => {
    if (!editingPostId) return
    setSaving(true)
    try {
      const res = await fetch("/api/content/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          subcategoryId,
          articleId,
          postId: editingPostId,
          imageUrl: editImageUrl.trim() || null,
        }),
      })
      if (res.ok) {
        setImageOverrides((prev) => {
          const next = JSON.parse(JSON.stringify(prev))
          if (!next[categoryId]) next[categoryId] = {}
          if (!next[categoryId][subcategoryId]) next[categoryId][subcategoryId] = {}
          if (!next[categoryId][subcategoryId][articleId]) next[categoryId][subcategoryId][articleId] = {}
          if (editImageUrl.trim()) {
            next[categoryId][subcategoryId][articleId][editingPostId] = editImageUrl.trim()
          } else {
            delete next[categoryId]?.[subcategoryId]?.[articleId]?.[editingPostId]
          }
          return next
        })
        setEditingPostId(null)
        setEditImageUrl("")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.set("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        setNewPost((prev) => ({ ...prev, image: data.url }))
      } else {
        setUploadError(data.error || "Upload failed. Try a smaller image or paste a URL.")
      }
    } catch {
      setUploadError("Upload failed. Check your connection and try again.")
    } finally {
      setUploadingImage(false)
      e.target.value = ""
    }
  }

  const setVisibility = async (publish: boolean) => {
    await fetch("/api/content/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, subcategoryId, articleId, published: publish }),
    })
    setPublished(publish)
    router.refresh()
  }

  const reorderPosts = (fromIndex: number, toIndex: number): string[] => {
    if (fromIndex === toIndex) return article.posts.map((p) => p.id)
    const ids = [...article.posts.map((p) => p.id)]
    const [removed] = ids.splice(fromIndex, 1)
    ids.splice(toIndex, 0, removed)
    return ids
  }

  const applyPostOrder = async (newOrder: string[]) => {
    await fetch("/api/content/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "posts",
        categoryId,
        subcategoryId,
        articleId,
        orderedIds: newOrder,
      }),
    })
    router.refresh()
  }

  const movePost = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= article.posts.length) return
    await applyPostOrder(reorderPosts(index, newIndex))
  }

  const handlePostDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", String(index))
    e.dataTransfer.effectAllowed = "move"
  }
  const handlePostDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverPostIndex(index)
  }
  const handlePostDrop = async (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    setDragOverPostIndex(null)
    const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10)
    if (Number.isNaN(fromIndex) || fromIndex === toIndex) return
    await applyPostOrder(reorderPosts(fromIndex, toIndex))
  }

  const handleSavePost = async () => {
    if (!newPost.title?.trim()) return
    setSavingPost(true)
    try {
      const res = await fetch("/api/cms/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          subcategoryId,
          articleId,
          title: newPost.title.trim(),
          image: newPost.image.trim() || undefined,
          message: newPost.message.trim() || undefined,
          facebook: newPost.message.trim() || undefined,
          instagram: newPost.message.trim() || undefined,
          twitter: newPost.message.trim() || undefined,
        }),
      })
      if (res.ok) {
        setIsAddPostOpen(false)
        setNewPost({ title: "", image: "", message: "" })
        router.refresh()
      }
    } finally {
      setSavingPost(false)
    }
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/articles" className="hover:text-gray-900">Articles</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/categories/${categoryId}`} className="hover:text-gray-900">
          {category.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/admin/categories/${categoryId}/${subcategoryId}`} className="hover:text-gray-900">
          {subcategory.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900">{article.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="bg-transparent">
            <Link href={`/admin/categories/${categoryId}/${subcategoryId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-gray-900">{article.title}</h1>
              {published ? (
                <Badge className="bg-green-100 text-green-800">Live</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800">Draft</Badge>
              )}
            </div>
            <p className="mt-1 text-gray-500">{article.description}</p>
            <div className="mt-2 flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-500 font-mono">
                www.saferu.com
                {categoryId === "whats-new"
                  ? `/whats-new/${articleId}`
                  : `/${categoryId}/${subcategoryId}/${articleId}`}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => {
                  const url = typeof window !== "undefined"
                    ? `${window.location.origin}${categoryId === "whats-new" ? `/whats-new/${articleId}` : `/${categoryId}/${subcategoryId}/${articleId}`}`
                    : ""
                  navigator.clipboard.writeText(url)
                }}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy link
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {published ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setVisibility(false)}
              className="gap-2"
            >
              <EyeOff className="h-4 w-4" />
              Unpublish
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => setVisibility(true)}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <Send className="h-4 w-4" />
              Publish
            </Button>
          )}
          <Dialog open={isAddPostOpen} onOpenChange={setIsAddPostOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Post
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Post</DialogTitle>
              <DialogDescription>
                Create a new post with a graphic and message. Users will copy the message and share it on their preferred platform.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Post Title *</Label>
                <Input
                  placeholder="e.g., Lock It Up"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Post Image</Label>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-32 w-48 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                    {newPost.image ? (
                      <Image
                        src={newPost.image || "/placeholder.svg"}
                        alt="Preview"
                        width={192}
                        height={128}
                        className="h-full w-full object-cover rounded-lg"
                        unoptimized={newPost.image.startsWith("/images/") || newPost.image.startsWith("http")}
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-1 text-xs text-gray-500">16:9 ratio</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label className="cursor-pointer rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium hover:bg-gray-100">
                        <Upload className="mr-2 inline h-4 w-4" />
                        Upload from computer
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </Label>
                      {uploadingImage && (
                        <span className="text-sm text-gray-500">Uploading…</span>
                      )}
                    </div>
                    {uploadError && (
                      <p className="text-sm text-red-600">{uploadError}</p>
                    )}
                    <Input
                      placeholder="/images/posts/your-image.jpg or paste URL"
                      value={newPost.image}
                      onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      Upload a file (JPG, PNG, WebP, GIF, max 10MB) or paste an image URL
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Write the message that will be shared across all platforms..."
                  rows={6}
                  value={newPost.message}
                  onChange={(e) => setNewPost({ ...newPost, message: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  This single message will be copied by users and shared on Facebook, Instagram, X, or Neighbors.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPostOpen(false)} className="bg-transparent">
                Cancel
              </Button>
              <Button 
                onClick={handleSavePost} 
                className="bg-[#1470AF] text-white hover:bg-[#1470AF]/90"
                disabled={savingPost || !newPost.title?.trim()}
              >
                <Save className="mr-2 h-4 w-4" />
                {savingPost ? "Saving…" : "Save Post"}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit graphic dialog */}
      <Dialog open={!!editingPostId} onOpenChange={(open) => !open && setEditingPostId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set graphic for post</DialogTitle>
            <DialogDescription>
              Enter the image URL for this template post. It will be used on the public site. Use /images/posts/... for files in public, or a full URL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label>Image URL</Label>
            <Input
              placeholder="/images/posts/your-image.jpg"
              value={editImageUrl}
              onChange={(e) => setEditImageUrl(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPostId(null)}>Cancel</Button>
            <Button onClick={handleSaveImageOverride} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Posts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {article.posts.map((post, index) => {
          const message = post.message || post.captions.facebook
          const displayImage = getPostImage(post) || `/images/posts/placeholder-${(index % 4) + 1}.jpg`
          return (
            <div
              key={post.id}
              className={`rounded-2xl transition-colors ${dragOverPostIndex === index ? "ring-2 ring-[#1470AF] ring-offset-2" : ""}`}
              onDragOver={(e) => handlePostDragOver(e, index)}
              onDragLeave={() => setDragOverPostIndex(null)}
              onDrop={(e) => handlePostDrop(e, index)}
            >
              <Card className="overflow-hidden">
                <div className="relative aspect-video bg-gray-100">
                  <Image
                    src={displayImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    unoptimized={displayImage.startsWith("/images/")}
                  />
                  <div
                    className="absolute left-2 top-2 z-10 flex cursor-grab active:cursor-grabbing touch-none items-center justify-center rounded bg-white/90 p-1.5 text-gray-500 shadow hover:bg-white hover:text-gray-700"
                    draggable
                    onDragStart={(e) => handlePostDragStart(e, index)}
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="absolute right-2 top-2 flex flex-col gap-1">
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={(e) => { e.preventDefault(); movePost(index, "up") }}
                        disabled={index === 0}
                        aria-label="Move post up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7"
                        onClick={(e) => { e.preventDefault(); movePost(index, "down") }}
                        disabled={index === article.posts.length - 1}
                        aria-label="Move post down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingPostId(post.id)
                      setEditImageUrl(getPostImage(post))
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Badge className="absolute bottom-2 left-2 bg-black/70 text-white">
                  Post {index + 1}
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-wrap">{message}</p>
                </div>
              </CardContent>
              </Card>
            </div>
          )
        })}

        {/* Add Post Card */}
        <Card 
          className="flex cursor-pointer items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50/50 transition-colors hover:border-[#1470AF] hover:bg-gray-50"
          onClick={() => setIsAddPostOpen(true)}
        >
          <div className="py-12 text-center">
            <Plus className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 font-medium text-gray-600">Add New Post</p>
            <p className="text-sm text-gray-500">Create a new post with graphic and message</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
