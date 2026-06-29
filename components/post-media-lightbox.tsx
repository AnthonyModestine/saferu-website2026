"use client"

import { useEffect } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { isVideoMediaUrl } from "@/lib/media-url"

interface PostMediaLightboxProps {
  src: string
  alt: string
  open: boolean
  onClose: () => void
}

export function PostMediaLightbox({ src, alt, open, onClose }: PostMediaLightboxProps) {
  const isVideo = isVideoMediaUrl(src)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>
      <div
        className="relative max-h-[90vh] max-w-[min(1200px,95vw)] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={src}
            className="mx-auto max-h-[90vh] w-full rounded-lg bg-black"
            controls
            autoPlay
            playsInline
            aria-label={alt}
          />
        ) : (
          <div className="relative mx-auto aspect-video w-full max-h-[90vh]">
            <Image
              src={src}
              alt={alt}
              width={1920}
              height={1080}
              className="mx-auto max-h-[90vh] w-auto h-auto rounded-lg object-contain"
              unoptimized={src.startsWith("/images/") || src.startsWith("http")}
            />
          </div>
        )}
      </div>
    </div>
  )
}
