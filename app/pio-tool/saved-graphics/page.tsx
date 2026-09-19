"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Bookmark,
  Copy,
  Download,
  ImageIcon,
  Loader2,
  Trash2,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSubscription } from "@/lib/use-subscription"
import { copyTextToClipboard } from "@/lib/copy-to-clipboard"
import { GRAPHIC_STUDIO_PATH } from "@/lib/press-center-features"
import { PostMediaLightbox } from "@/components/post-media-lightbox"

type SavedGraphic = {
  graphicId: string
  headline: string
  message: string
  caption: string
  category: string
  topic: string
  imageUrl: string
  savedAt: string
  generatedAt: string
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return "—"
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function SavedGraphicsPage() {
  const { isSubscribed, isLoading: subLoading } = useSubscription()
  const [items, setItems] = useState<SavedGraphic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/pio/graphic-studio/saved")
      const data = await res.json()
      if (!res.ok) {
        setError(String(data.error || "Could not load saved graphics."))
        setItems([])
        return
      }
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch {
      setError("Could not load saved graphics.")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (subLoading) return
    if (!isSubscribed) {
      setLoading(false)
      return
    }
    void load()
  }, [isSubscribed, subLoading, load])

  const download = (item: SavedGraphic) => {
    const a = document.createElement("a")
    a.href = item.imageUrl
    a.download = `saferu-graphic-${item.graphicId.slice(0, 8)}.png`
    a.target = "_blank"
    a.rel = "noopener"
    a.click()
  }

  const copyCaption = async (item: SavedGraphic) => {
    if (!item.caption.trim()) return
    const ok = await copyTextToClipboard(item.caption)
    if (ok) {
      setCopiedId(item.graphicId)
      window.setTimeout(() => setCopiedId(null), 1600)
    }
  }

  const remove = async (graphicId: string) => {
    setRemovingId(graphicId)
    try {
      const res = await fetch("/api/pio/graphic-studio/saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graphicId }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.graphicId !== graphicId))
      }
    } finally {
      setRemovingId(null)
    }
  }

  if (subLoading || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[#5c6b85]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading saved graphics…
      </div>
    )
  }

  if (!isSubscribed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Bookmark className="mx-auto h-10 w-10 text-[#F59E0B]" />
        <h1 className="mt-4 text-2xl font-bold text-[#0f1c3f]">Saved Graphics</h1>
        <p className="mt-2 text-[#5c6b85]">
          Subscribe to Press Center to save Graphic Studio artwork and reopen it here.
        </p>
        <Button asChild className="mt-6 bg-[#0f1c3f]">
          <Link href="/pio-tool/subscribe">View Press Center plan</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#F59E0B]">
            AI Assistant
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[#0f1c3f]">Saved Graphics</h1>
          <p className="mt-2 max-w-xl text-sm text-[#5c6b85]">
            Graphics you saved from Graphic Studio — download, copy the caption, or remove anytime.
          </p>
        </div>
        <Button asChild className="bg-[#F59E0B] text-[#0f1c3f] hover:bg-[#ffc44d]">
          <Link href={`${GRAPHIC_STUDIO_PATH}/safety-tip`}>
            <ImageIcon className="mr-2 h-4 w-4" />
            Create new graphic
          </Link>
        </Button>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!error && items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-[#E2E8F5] bg-white px-6 py-16 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-[#94A3B8]" />
          <p className="mt-3 text-lg font-semibold text-[#0f1c3f]">No saved graphics yet</p>
          <p className="mt-1 text-sm text-[#5c6b85]">
            Generate a graphic in Graphic Studio, then click Save graphic.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href={`${GRAPHIC_STUDIO_PATH}/safety-tip`}>Open Graphic Studio</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.graphicId}
              className="overflow-hidden rounded-2xl border border-[#E2E8F5] bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => setLightboxUrl(item.imageUrl)}
                className="relative aspect-video w-full cursor-zoom-in bg-[#0B1B3A]"
                aria-label={`Preview ${item.headline || "saved graphic"}`}
              >
                <Image
                  src={item.imageUrl}
                  alt={item.headline || "Saved safety graphic"}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </button>
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#F59E0B]">
                    {item.category || "Safety graphic"}
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-base font-bold text-[#0f1c3f]">
                    {item.headline || "Untitled graphic"}
                  </h2>
                  <p className="mt-1 text-xs text-[#94A3B8]">Saved {formatSavedAt(item.savedAt)}</p>
                </div>
                {item.caption ? (
                  <p className="line-clamp-3 text-xs leading-relaxed text-[#5c6b85]">{item.caption}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => download(item)}>
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    Download
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!item.caption.trim()}
                    onClick={() => void copyCaption(item)}
                  >
                    {copiedId === item.graphicId ? (
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                    ) : (
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {copiedId === item.graphicId ? "Copied" : "Caption"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                    disabled={removingId === item.graphicId}
                    onClick={() => void remove(item.graphicId)}
                  >
                    {removingId === item.graphicId ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {lightboxUrl && (
        <PostMediaLightbox
          src={lightboxUrl}
          alt="Saved safety graphic"
          open={Boolean(lightboxUrl)}
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </div>
  )
}
