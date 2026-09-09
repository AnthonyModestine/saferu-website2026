"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Copy, Download, Expand, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PostMediaLightbox } from "@/components/post-media-lightbox"
import { useAgency } from "@/lib/agency-context"
import { GraphicStudioSelect } from "@/components/pio/graphic-studio-select"
import {
  SAFETY_GRAPHIC_STYLES,
  type SafetyGraphicStyle,
} from "@/lib/pio-graphic-studio-types"
import {
  CAPTION_ADJUST_LABELS,
  CAPTION_ADJUST_MODES,
  type CaptionAdjustMode,
} from "@/lib/graphic-studio/caption-adjust"
import { compressGraphicDataUrlForUpload } from "@/lib/graphic-studio/compress-for-upload"

type PreparedMessage = {
  headline: string
  message: string
  messageFormat: string
  visualConcept: string
  importantVisualDetails: string[]
  sourceRecords: Array<{ organization: string; url: string; claim_supported: string }>
}

export default function SafetyTipGraphicPage() {
  const { settings } = useAgency()
  const [topic, setTopic] = useState("")
  const [style, setStyle] = useState<SafetyGraphicStyle>("Let SaferU Decide")
  const [visualNotes, setVisualNotes] = useState("")
  const [headline, setHeadline] = useState("")
  const [message, setMessage] = useState("")
  const [prepared, setPrepared] = useState<PreparedMessage | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [graphicId, setGraphicId] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [editRequest, setEditRequest] = useState("")
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [revising, setRevising] = useState(false)
  const [adjustingCaption, setAdjustingCaption] = useState<CaptionAdjustMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const agencyPayload = {
    agencyName: settings.agencyName,
    agencyLogoUrl: settings.logoUrl?.startsWith("/") ? settings.logoUrl : null,
  }

  const prepareMessage = async () => {
    const need = topic.trim()
    if (need.length < 8) {
      setError("Tell us what you want residents to know — you do not need a finished headline.")
      return
    }
    setPreparing(true)
    setError(null)
    setPrepared(null)
    setPreview(null)
    setCaption("")
    setEditRequest("")
    try {
      const res = await fetch("/api/pio/graphic-studio/prepare-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: need,
          style,
          visualNotes,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(String(data.error || "Could not prepare this message."))
        return
      }
      const next: PreparedMessage = {
        headline: String(data.headline || ""),
        message: String(data.message || ""),
        messageFormat: String(data.messageFormat || "paragraph"),
        visualConcept: String(data.visualConcept || ""),
        importantVisualDetails: Array.isArray(data.importantVisualDetails)
          ? data.importantVisualDetails.map(String)
          : [],
        sourceRecords: Array.isArray(data.sourceRecords) ? data.sourceRecords : [],
      }
      setHeadline(next.headline)
      setMessage(next.message)
      setPrepared(next)
    } catch {
      setError("Something went wrong preparing the message. Please try again.")
    } finally {
      setPreparing(false)
    }
  }

  const generateGraphic = async () => {
    if (!headline.trim() || !message.trim() || !prepared?.visualConcept) {
      setError("Prepare and review the message before generating the graphic.")
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/pio/graphic-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          style,
          headline,
          message,
          messageFormat: prepared.messageFormat,
          visualConcept: prepared.visualConcept,
          importantVisualDetails: prepared.importantVisualDetails,
          visualNotes,
          sourceRecords: prepared.sourceRecords,
          ...agencyPayload,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(String(data.error || "Could not generate graphic."))
        return
      }
      setGraphicId(typeof data.graphicId === "string" ? data.graphicId : null)
      if (typeof data.imageDataUrl === "string") {
        setPreview(data.imageDataUrl)
      } else {
        setError("Could not generate graphic. Please try again.")
        return
      }
      if (typeof data.caption === "string" && data.caption.trim()) {
        setCaption(data.caption.trim())
      } else {
        await refreshCaption()
      }
    } catch {
      setError("Something went wrong generating the graphic. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  const refreshCaption = async () => {
    try {
      const res = await fetch("/api/pio/graphic-studio/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          topic,
          headline,
          message,
          agencyName: settings.agencyName,
        }),
      })
      const data = await res.json()
      if (res.ok && typeof data.caption === "string") {
        setCaption(data.caption)
      }
    } catch {
      // Caption is secondary — graphic can still succeed without it.
    }
  }

  const adjustCaption = async (mode: CaptionAdjustMode) => {
    if (!caption.trim()) {
      setError("Generate the graphic first so we can craft a social caption.")
      return
    }
    setAdjustingCaption(mode)
    setError(null)
    try {
      const res = await fetch("/api/pio/graphic-studio/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust",
          mode,
          caption,
          headline,
          message,
          agencyName: settings.agencyName,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(String((data as { error?: string }).error || "Could not adjust caption."))
        return
      }
      if (typeof (data as { caption?: string }).caption === "string") {
        setCaption((data as { caption: string }).caption)
      }
    } catch {
      setError("Could not adjust the caption. Please try again.")
    } finally {
      setAdjustingCaption(null)
    }
  }

  const reviseGraphic = async () => {
    if (!preview) {
      setError("Generate a graphic before requesting an edit.")
      return
    }
    const notes = editRequest.trim()
    if (notes.length < 4) {
      setError("Describe the specific change you want (example: make the pan larger).")
      return
    }
    setRevising(true)
    setError(null)
    try {
      const compressed = await compressGraphicDataUrlForUpload(preview)
      const res = await fetch("/api/pio/graphic-studio/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: compressed,
          editRequest: notes,
          headline,
          message,
          ...agencyPayload,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 413) {
        setError("That graphic file is too large to edit in one request. Please try again.")
        return
      }
      if (!res.ok) {
        setError(String((data as { error?: string }).error || "Could not revise graphic."))
        return
      }
      if (typeof (data as { imageDataUrl?: string }).imageDataUrl === "string") {
        setPreview((data as { imageDataUrl: string }).imageDataUrl)
        setEditRequest("")
      } else {
        setError("Could not revise graphic. Please try again.")
      }
    } catch {
      setError("Could not revise the graphic. Please try again.")
    } finally {
      setRevising(false)
    }
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

  const busy = preparing || generating || revising || Boolean(adjustingCaption)

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
          Describe what residents should know, approve the short message, then generate a 16:9
          safety graphic with your agency logo.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="space-y-5 rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="topic">What do you want residents to know?</Label>
            <Textarea
              id="topic"
              rows={5}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Example: E-scooter charging — keep hallways and exits clear because of battery fire risk"
              maxLength={800}
            />
            <p className="text-xs text-[#94A3B8]">
              Jot the topic in your own words. We&apos;ll turn it into the on-graphic headline and
              message.
            </p>
          </div>

          <GraphicStudioSelect
            id="safety-style"
            label="Graphic style"
            value={style}
            options={SAFETY_GRAPHIC_STYLES}
            onChange={(value) => setStyle(value as SafetyGraphicStyle)}
          />

          <div className="space-y-2">
            <Label htmlFor="visualNotes">Anything you want shown in the graphic? (optional)</Label>
            <Textarea
              id="visualNotes"
              rows={2}
              value={visualNotes}
              onChange={(e) => setVisualNotes(e.target.value)}
              placeholder="Example: Show an e-scooter blocking an apartment exit."
              maxLength={300}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button
            type="button"
            onClick={() => void prepareMessage()}
            disabled={busy || topic.trim().length < 8}
            className="w-full bg-[#0f1c3f] hover:bg-[#1e293b]"
          >
            {preparing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Crafting your safety message…
              </>
            ) : (
              "Craft message from my notes"
            )}
          </Button>

          {prepared && (
            <div className="space-y-3 rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-3">
              <div className="space-y-1">
                <Label htmlFor="headline">Headline (on the graphic)</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="message">On-graphic message</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={420}
                />
                <p className="text-xs text-[#94A3B8]">Edit freely before generating graphic</p>
              </div>
              <Button
                type="button"
                onClick={() => void generateGraphic()}
                disabled={busy || !headline.trim() || !message.trim()}
                className="w-full bg-[#2563EB] hover:bg-[#1d4ed8]"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating 16:9 graphic…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate graphic
                  </>
                )}
              </Button>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-[#e2e8f5] bg-[#0d1526] shadow-sm">
            <div className="relative aspect-video w-full">
              {generating || revising ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0d1526] via-[#132038] to-[#1a2744] px-6 text-center"
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-[#3B82F6]/25" />
                    <span className="absolute inset-2 animate-pulse rounded-full border-2 border-[#60A5FA]/40" />
                    <Loader2 className="relative h-10 w-10 animate-spin text-[#93C5FD]" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold tracking-tight text-white">
                      {revising ? "Applying your edit…" : "Creating your graphic…"}
                    </p>
                    <p className="max-w-sm text-sm leading-relaxed text-[#94A3B8]">
                      {revising
                        ? "Only the change you asked for — agency logo stays untouched."
                        : "This may take a moment — Rome wasn't built in a day."}
                    </p>
                  </div>
                  <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-[#60A5FA]" />
                  </div>
                </div>
              ) : preparing ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#0d1526] via-[#132038] to-[#1a2744] px-6 text-center"
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-[#3B82F6]/25" />
                    <Loader2 className="relative h-10 w-10 animate-spin text-[#93C5FD]" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-semibold tracking-tight text-white">
                      Crafting your message…
                    </p>
                    <p className="max-w-sm text-sm leading-relaxed text-[#94A3B8]">
                      Turning your notes into a clear headline and actionable on-graphic copy.
                    </p>
                  </div>
                </div>
              ) : preview ? (
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
                  Describe your topic → craft the message → generate the graphic.
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
            <Button asChild type="button" variant="outline">
              <Link href="/pio-tool/settings">Agency logo settings</Link>
            </Button>
          </div>

          {preview && (
            <>
              <div className="space-y-3 rounded-2xl border border-[#e2e8f5] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="social-caption">Social media caption</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copyCaption()}
                    disabled={!caption.trim()}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    {copied ? "Copied" : "Copy caption"}
                  </Button>
                </div>
                <Textarea
                  id="social-caption"
                  rows={5}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Your ready-to-post caption will appear here after the graphic is created."
                  maxLength={1200}
                />
                <p className="text-xs text-[#94A3B8]">
                  Ready for Facebook/Instagram with the graphic. Adjust tone or length, then copy.
                </p>
                <div className="flex flex-wrap gap-2">
                  {CAPTION_ADJUST_MODES.map((mode) => (
                    <Button
                      key={mode}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busy || !caption.trim()}
                      onClick={() => void adjustCaption(mode)}
                    >
                      {adjustingCaption === mode ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : null}
                      {CAPTION_ADJUST_LABELS[mode]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-[#e2e8f5] bg-white p-4 shadow-sm">
                <Label htmlFor="edit-request">Need a change to the graphic?</Label>
                <Textarea
                  id="edit-request"
                  rows={3}
                  value={editRequest}
                  onChange={(e) => setEditRequest(e.target.value)}
                  placeholder="Example: Make the stove flame smaller — keep everything else the same"
                  maxLength={400}
                />
                <p className="text-xs text-[#94A3B8]">
                  Describe only what to change. We keep the rest of the graphic and never alter
                  your agency logo.
                </p>
                <Button
                  type="button"
                  onClick={() => void reviseGraphic()}
                  disabled={busy || editRequest.trim().length < 4}
                  className="w-full bg-[#0f1c3f] hover:bg-[#1e293b]"
                >
                  {revising ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying edit…
                    </>
                  ) : (
                    "Apply edit"
                  )}
                </Button>
              </div>
            </>
          )}

          {graphicId && preview && (
            <p className="text-xs text-[#94A3B8]">Graphic ID: {graphicId}</p>
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
