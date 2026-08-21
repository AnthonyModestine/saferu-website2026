"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Copy, Download, Expand, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PostMediaLightbox } from "@/components/post-media-lightbox"
import { useAgency } from "@/lib/agency-context"
import {
  compositeSafetyTipLogos,
  createSafetyTipGraphic,
} from "@/lib/pio-graphic-studio"
import { SAFETY_TIP_CATEGORIES } from "@/lib/pio-graphic-studio-types"

export default function SafetyTipGraphicPage() {
  const { settings } = useAgency()
  const [category, setCategory] = useState<(typeof SAFETY_TIP_CATEGORIES)[number]>(
    "Crime Prevention"
  )
  const [residentNeed, setResidentNeed] = useState("")
  const [categoryLabel, setCategoryLabel] = useState("CRIME PREVENTION")
  const [headline, setHeadline] = useState("")
  const [body, setBody] = useState("")
  const [caption, setCaption] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const stampLogos = async (imageDataUrl: string) => {
    const stamped = await compositeSafetyTipLogos({
      imageDataUrl,
      agencyName: settings.agencyName,
      agencyLogoUrl: settings.logoUrl,
      saferuLogoUrl: "/images/saferu-logo.png",
    })
    return stamped
  }

  const generateWithAi = async () => {
    const need = residentNeed.trim()
    if (need.length < 8) {
      setError("Tell us what residents should know — for example, lock car doors at night.")
      return
    }

    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/pio/graphic-studio/safety-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          residentNeed: need,
          agencyName: settings.agencyName,
          agencyType: settings.agencyType,
          agencyTypeOther: settings.agencyTypeOther,
          city: settings.city,
          state: settings.state,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(String(data.error || "Could not generate graphic."))
        return
      }

      setCategoryLabel(String(data.categoryLabel || category))
      setHeadline(String(data.headline || ""))
      setBody(String(data.body || ""))
      setCaption(String(data.caption || data.body || ""))

      const aiImage = typeof data.imageDataUrl === "string" ? data.imageDataUrl : ""
      if (aiImage) {
        const stamped = await stampLogos(aiImage)
        if (stamped) {
          setPreview(stamped)
          return
        }
      }

      // Fallback: local template if image compositing fails.
      const fallback = await createSafetyTipGraphic({
        categoryLabel: String(data.categoryLabel || category),
        headline: String(data.headline || ""),
        body: String(data.body || ""),
        agencyName: settings.agencyName,
        agencyLogoUrl: settings.logoUrl,
        saferuLogoUrl: "/images/saferu-logo.png",
        aspect: "landscape",
      })
      setPreview(fallback)
    } catch {
      setError("Something went wrong generating the graphic. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const download = () => {
    if (!preview) return
    const a = document.createElement("a")
    a.href = preview
    a.download = `saferu-safety-tip-${Date.now()}.png`
    a.click()
  }

  const copyCaption = async () => {
    if (!caption.trim()) return
    await navigator.clipboard.writeText(caption)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div>
        <Button asChild variant="ghost" className="-ml-2 mb-3 text-[#475569]">
          <Link href="/pio-tool/graphics">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Graphic Studio
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-[#0f1c3f]">Safety Tip Graphic</h1>
        <p className="mt-2 text-[#64748B]">
          AI researches the tip, writes one clear message, and designs a 16:9 graphic. SaferU logo
          is stamped bottom-left; your agency logo bottom-right.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="space-y-4 rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
          <div className="space-y-2">
            <Label>What type of safety graphic?</Label>
            <div className="flex flex-wrap gap-2">
              {SAFETY_TIP_CATEGORIES.map((item) => {
                const active = item === category
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={
                      active
                        ? "rounded-full bg-[#0f1c3f] px-3 py-1.5 text-xs font-semibold text-white"
                        : "rounded-full border border-[#e2e8f5] px-3 py-1.5 text-xs font-semibold text-[#334155] hover:border-[#F2B233] hover:bg-[#FFFBEB]"
                    }
                  >
                    {item}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="residentNeed">What should residents know?</Label>
            <Textarea
              id="residentNeed"
              rows={5}
              value={residentNeed}
              onChange={(e) => setResidentNeed(e.target.value)}
              placeholder="Example: Lock your car doors at night and take valuables with you."
              maxLength={400}
            />
            <p className="text-xs text-[#94A3B8]">
              One strong tip works best. AI will research it and teach that one thing clearly.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button
            type="button"
            onClick={() => void generateWithAi()}
            disabled={generating || residentNeed.trim().length < 8}
            className="w-full bg-[#2563EB] hover:bg-[#1d4ed8]"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Researching & designing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </>
            )}
          </Button>

          {(headline || body) && (
            <div className="space-y-2 rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Message used for this graphic
              </p>
              <p className="text-xs font-semibold text-[#B45309]">{categoryLabel}</p>
              <p className="text-sm font-bold text-[#0f1c3f]">{headline}</p>
              <p className="text-sm text-[#475569]">{body}</p>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-[#e2e8f5] bg-[#0d1526] shadow-sm">
            <div className="relative aspect-video w-full">
              {preview ? (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="absolute inset-0 block w-full cursor-zoom-in"
                  aria-label="Preview graphic larger"
                >
                  <Image
                    src={preview}
                    alt="Safety tip graphic preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </button>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[#94A3B8]">
                  <Sparkles className="h-5 w-5" />
                  Choose a category, describe the tip, then generate.
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => setLightboxOpen(true)}
              disabled={!preview}
              variant="outline"
            >
              <Expand className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button type="button" onClick={download} disabled={!preview} className="bg-[#0f1c3f]">
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void copyCaption()}
              disabled={!caption.trim()}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copied" : "Copy caption"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/pio-tool/settings">Agency logo settings</Link>
            </Button>
          </div>

          {caption && (
            <div className="rounded-xl border border-[#e2e8f5] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Suggested caption
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#334155]">
                {caption}
              </p>
            </div>
          )}
        </section>
      </div>

      {preview && (
        <PostMediaLightbox
          src={preview}
          alt="Safety tip graphic preview"
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}
