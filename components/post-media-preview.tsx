"use client"

import Image from "next/image"
import { Film } from "lucide-react"
import { isVideoMediaUrl } from "@/lib/media-url"

interface PostMediaPreviewProps {
  src: string
  alt: string
  className?: string
  /** When true, video fills container with object-cover (article cards). When false, object-contain for admin previews. */
  cover?: boolean
}

export function PostMediaPreview({
  src,
  alt,
  className = "",
  cover = true,
}: PostMediaPreviewProps) {
  const isVideo = isVideoMediaUrl(src)
  const objectClass = cover ? "object-cover" : "object-contain"

  if (isVideo) {
    return (
      <video
        src={src}
        className={`absolute inset-0 h-full w-full bg-black ${objectClass} ${className}`}
        controls
        playsInline
        preload="metadata"
        aria-label={alt}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={`${objectClass} ${className}`}
      unoptimized={src.startsWith("/images/") || src.startsWith("http")}
      onError={(e) => {
        const target = e.currentTarget
        target.style.display = "none"
        const parent = target.closest(".relative")
        const fallback = parent?.querySelector("[data-media-fallback]") as HTMLElement
        if (fallback) fallback.style.display = "flex"
      }}
    />
  )
}

export function PostMediaPlaceholder({
  label = "No graphic",
  className = "",
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      data-media-fallback
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm ${className}`}
      style={{ background: "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)" }}
      aria-hidden
    >
      <Film className="h-8 w-8 opacity-40" />
      <span className="font-medium">{label}</span>
    </div>
  )
}
