"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { track } from "@/lib/track"
import { copyTextToClipboard } from "@/lib/copy-to-clipboard"
import { downloadImageFile } from "@/lib/download-image"
import { getPostMessage } from "@/lib/post-message"
import type { ImageOverrides } from "@/lib/content-overrides"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ChevronRight, ArrowLeft, Download, ExternalLink, ShieldCheck, Flame, Star, CloudLightning, AlertTriangle, Users, Shield } from "lucide-react"
import { PostMessageBlock } from "@/components/post-message-block"
import type { Article, Subcategory, Category } from "@/lib/data/content-library"
import type { LucideIcon } from "lucide-react"

const categoryIconMap: Record<string, LucideIcon> = {
  "crime-prevention": ShieldCheck,
  "fire-prevention": Flame,
  "whats-new": Star,
  "weather-preparedness": CloudLightning,
  "natural-disaster": AlertTriangle,
  "community-awareness": Users,
}

interface ArticleDetailPageProps {
  category: Category
  subcategory: Subcategory
  article: Article
  iconColor: string
  /** When true (What's New), breadcrumb and back link skip subcategory and go to /whats-new */
  isWhatsNew?: boolean
}

const platforms = [
  {
    label: "Facebook",
    href: "https://www.facebook.com",
    bgColor: "bg-[#1877F2]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com",
    bgColor: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: "https://www.x.com",
    bgColor: "bg-black",
    icon: (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Neighbors",
    href: "https://publicsafety.ring.com",
    bgColor: "bg-[#00B4D8]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    ),
  },
]

export function ArticleDetailPage({ 
  category, 
  subcategory, 
  article, 
  iconColor,
  isWhatsNew = false,
}: ArticleDetailPageProps) {
  const pathname = usePathname()
  const CategoryIcon = categoryIconMap[category.id] || Shield
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null)
  const [downloadingPostId, setDownloadingPostId] = useState<string | null>(null)
  const [imageOverrides, setImageOverrides] = useState<ImageOverrides>({})

  useEffect(() => {
    fetch("/api/content/overrides")
      .then((r) => r.ok ? r.json() : {})
      .then(setImageOverrides)
      .catch(() => {})
  }, [])

  const copyToClipboard = async (text: string, id: string, postTitle?: string) => {
    setCopyErrorId(null)
    if (!text.trim()) {
      setCopyErrorId(id)
      setTimeout(() => setCopyErrorId(null), 2500)
      return
    }
    const ok = await copyTextToClipboard(text)
    if (!ok) {
      setCopyErrorId(id)
      setTimeout(() => setCopyErrorId(null), 2500)
      return
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    track("copy", { path: pathname ?? undefined, postId: id, postTitle })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb & Header */}
        <section className="border-b border-border bg-white py-6">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb — What's New: no subcategory in path */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
              <Link href={isWhatsNew ? "/whats-new" : `/${category.id}`} className="hover:text-foreground transition-colors">
                {category.title}
              </Link>
              {!isWhatsNew && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <Link href={`/${category.id}/${subcategory.id}`} className="hover:text-foreground transition-colors">
                    {subcategory.title}
                  </Link>
                </>
              )}
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{article.title}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`rounded-xl bg-[#1470AF]/10 p-3 ${iconColor}`}>
                  <CategoryIcon className="h-7 w-7 text-[#1470AF]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#1a365d]">{article.title}</h1>
                  <p className="text-muted-foreground">{article.posts.length} ready-to-share posts</p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="bg-transparent">
                <Link href={isWhatsNew ? "/whats-new" : `/${category.id}/${subcategory.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to {isWhatsNew ? category.title : subcategory.title}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="py-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2">
              {article.posts.map((post) => {
                const message = getPostMessage(post)
                const overrideUrl = imageOverrides[category.id]?.[subcategory.id]?.[article.id]?.[post.id]
                const imageSrc = overrideUrl ?? post.image ?? null
                
                return (
                  <div key={post.id} className="flex flex-col rounded-2xl bg-white shadow-md overflow-hidden border border-gray-100">
                    {/* Image - 16:9 aspect ratio (safe fallback when no image or load error) */}
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={post.title}
                          fill
                          className="object-cover"
                          unoptimized={imageSrc.startsWith("/images/") || imageSrc.startsWith("http")}
                          onError={(e) => {
                            const target = e.currentTarget
                            target.style.display = "none"
                            const parent = target.closest(".relative")
                            const fallback = parent?.querySelector("[data-image-fallback]") as HTMLElement
                            if (fallback) fallback.style.display = "flex"
                          }}
                        />
                      ) : null}
                      <div
                        data-image-fallback
                        className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm"
                        style={{ display: imageSrc ? "none" : "flex", background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)" }}
                        aria-hidden
                      >
                        <span className="font-medium">No graphic</span>
                      </div>
                      {imageSrc ? (
                        <button
                          type="button"
                          disabled={downloadingPostId === post.id}
                          onClick={async () => {
                            setDownloadingPostId(post.id)
                            try {
                              await downloadImageFile(
                                imageSrc,
                                post.title.toLowerCase().replace(/\s+/g, "-")
                              )
                              track("download", {
                                path: pathname ?? undefined,
                                name: post.title,
                                postId: post.id,
                                postTitle: post.title,
                              })
                            } catch {
                              window.alert("Could not download this image. Try again in a moment.")
                            } finally {
                              setDownloadingPostId(null)
                            }
                          }}
                          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-lg bg-white/95 backdrop-blur-sm px-3 py-2 text-sm font-medium text-[#1a365d] shadow-lg hover:bg-white transition-colors disabled:opacity-70"
                        >
                          <Download className="h-4 w-4" />
                          {downloadingPostId === post.id ? "Downloading…" : "Download"}
                        </button>
                      ) : null}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-4">
                      <PostMessageBlock
                        postId={post.id}
                        postTitle={post.title}
                        message={message}
                        copiedId={copiedId}
                        copyErrorId={copyErrorId}
                        onCopy={copyToClipboard}
                      />

                      {/* Platform Links */}
                      <div className="grid grid-cols-4 gap-2">
                        {platforms.map((platform) => (
                          <a
                            key={platform.label}
                            href={platform.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-white transition-opacity hover:opacity-80 ${platform.bgColor}`}
                            aria-label={`Share on ${platform.label}`}
                          >
                            {platform.icon}
                            <span>{platform.label}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
