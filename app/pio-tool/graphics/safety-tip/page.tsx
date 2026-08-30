"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Copy, Download, Expand, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { PostMediaLightbox } from "@/components/post-media-lightbox"
import { useAgency } from "@/lib/agency-context"
import { GraphicStudioSelect } from "@/components/pio/graphic-studio-select"
import {
  SAFETY_TIP_CATEGORIES,
  type SafetyTipCategory,
} from "@/lib/pio-graphic-studio-types"

export default function SafetyTipGraphicPage() {
  const { settings } = useAgency()
  const [category, setCategory] = useState<SafetyTipCategory>("Other / Custom")
  const [topic, setTopic] = useState("")
  const [visualNotes, setVisualNotes] = useState("")
  const [caption, setCaption] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [graphicId, setGraphicId] = useState<string | null>(null)
  const [revisionRequest, setRevisionRequest] = useState("")
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [revising, setRevising] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const agencyPayload = {
    agencyName: settings.agencyName,
    agencyLogoUrl: settings.logoUrl?.startsWith("/") ? settings.logoUrl : null,
  }

  const generateGraphic = async () => {
    const need = topic.trim()
    if (need.length < 8) {
      setError("Describe what you want residents to know — a short sentence is enough.")
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
          visualRequest: visualNotes.trim() || undefined,
          ...agencyPayload,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(String(data.error || "Could not generate graphic."))
        return
      }
      setGraphicId(typeof data.graphicId === "string" ? data.graphicId : null)
      const aiImage = typeof data.imageDataUrl === "string" ? data.imageDataUrl : ""
      if (aiImage) {
        setHistory((prev) => (preview ? [...prev, preview] : prev))
        setPreview(aiImage)
        if (typeof data.caption === "string" && data.caption.trim()) {
          setCaption(data.caption.trim())
        }
        return
      }
      setError("Could not generate graphic. Please try again.")
    } catch {
      setError("Something went wrong generating the graphic. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const reviseGraphic = async () => {
    if (!preview || !revisionRequest.trim()) return
    setRevising(true)
    setError(null)
    try {
      const res = await fetch("/api/pio/graphic-studio/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graphicId,
          revisionRequest,
          sourceImageDataUrl: preview,
          topic: topic.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(String(data.error || "Could not revise graphic."))
        return
      }
      const next = typeof data.imageDataUrl === "string" ? data.imageDataUrl : null
      if (next) {
        setHistory((prev) => [...prev, preview])
        setPreview(next)
        setRevisionRequest("")
      }
    } catch {
      setError("Could not revise this graphic. Please try again.")
    } finally {
      setRevising(false)
    }
  }

  const undo = () => {
    setHistory((prev) => {
      if (!prev.length) return prev
      const last = prev[prev.length - 1]!
      setPreview(last)
      return prev.slice(0, -1)
    })
  }

  const download = () => {
    if (!preview) return
    const a = document.createElement("a")
    a.href = preview
    a.download = `safety-graphic-${Date.now()}.png`
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
        <h1 className="text-3xl font-bold text-[#0f1c3f]">Safety Graphic</h1>
        <p className="mt-2 text-[#64748B]">
          Describe what you want to educate your community about. We create a 16:9 graphic and place
          your agency logo in the bottom-right when one is saved in your profile.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="space-y-5 rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
          <GraphicStudioSelect
            id="safety-category"
            label="Category (optional)"
            value={category}
            options={SAFETY_TIP_CATEGORIES}
            onChange={(value) => setCategory(value as SafetyTipCategory)}
          />

          <div className="space-y-2">
            <Label htmlFor="topic">What do you want residents to know?</Label>
            <Textarea
              id="topic"
              rows={5}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Example: Remind residents not to charge e-scooters in front of their apartment door because it may block their only exit."
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visualNotes">Anything specific to show in the graphic? (optional)</Label>
            <Textarea
              id="visualNotes"
              rows={2}
              value={visualNotes}
              onChange={(e) => setVisualNotes(e.target.value)}
              placeholder="Example: Apartment hallway with a scooter charging in front of the door."
              maxLength={300}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button
            type="button"
            onClick={() => void generateGraphic()}
            disabled={generating || topic.trim().length < 8}
            className="w-full bg-[#2563EB] hover:bg-[#1d4ed8]"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating your graphic…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate 16:9 graphic
              </>
            )}
          </Button>

          <p className="text-xs text-[#94A3B8]">
            {settings.logoUrl
              ? "Your agency logo from profile settings will be placed bottom-right."
              : "Add your agency logo in settings to include it automatically."}
          </p>
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
                    alt="Safety graphic preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </button>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[#94A3B8]">
                  <Sparkles className="h-5 w-5" />
                  Your 16:9 safety graphic will appear here.
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
            <Button type="button" variant="outline" onClick={undo} disabled={!history.length}>
              Undo
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

          {preview && (
            <div className="space-y-2 rounded-xl border border-[#e2e8f5] bg-white p-4">
              <Label htmlFor="revision">Revise this graphic</Label>
              <Input
                id="revision"
                value={revisionRequest}
                onChange={(e) => setRevisionRequest(e.target.value)}
                placeholder="Example: Make the headline larger."
                maxLength={200}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void reviseGraphic()}
                disabled={revising || !revisionRequest.trim()}
              >
                {revising ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Revising…
                  </>
                ) : (
                  "Apply revision"
                )}
              </Button>
            </div>
          )}

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
          alt="Safety graphic preview"
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}
