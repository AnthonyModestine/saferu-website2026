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
  SAFETY_AUDIENCES,
  SAFETY_GRAPHIC_STYLES,
  SAFETY_TIP_CATEGORIES,
  type SafetyAudience,
  type SafetyGraphicStyle,
  type SafetyTipCategory,
} from "@/lib/pio-graphic-studio-types"

type PreparedMessage = {
  headline: string
  message: string
  visualConcept: string
  importantVisualDetails: string[]
  sourceRecords: Array<{ organization: string; url: string; claim_supported: string }>
}

export default function SafetyTipGraphicPage() {
  const { settings } = useAgency()
  const [category, setCategory] = useState<SafetyTipCategory>("Child & Family Safety")
  const [topic, setTopic] = useState("")
  const [audience, setAudience] = useState<SafetyAudience>("Parents")
  const [style, setStyle] = useState<SafetyGraphicStyle>("Friendly / Family")
  const [visualNotes, setVisualNotes] = useState("")
  const [headline, setHeadline] = useState("")
  const [message, setMessage] = useState("")
  const [prepared, setPrepared] = useState<PreparedMessage | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [graphicId, setGraphicId] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [generating, setGenerating] = useState(false)
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
    try {
      const res = await fetch("/api/pio/graphic-studio/prepare-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          topic: need,
          audience,
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
          category,
          topic,
          audience,
          style,
          headline,
          message,
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
      }
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
    a.download = `safety-graphic-${Date.now()}.png`
    a.click()
  }

  const copyMessage = async () => {
    const text = `${headline}\n\n${message}`
    await navigator.clipboard.writeText(text)
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
          Describe your topic. OpenAI researches and drafts the on-graphic message. After you
          approve the copy, we generate a 16:9 graphic and place your exact agency logo
          bottom-right.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="space-y-5 rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
          <GraphicStudioSelect
            id="safety-category"
            label="What type of safety content are you creating?"
            value={category}
            options={SAFETY_TIP_CATEGORIES}
            onChange={(value) => setCategory(value as SafetyTipCategory)}
          />

          <div className="space-y-2">
            <Label htmlFor="topic">What do you want residents to know?</Label>
            <Textarea
              id="topic"
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Example: Signs your child might be getting bullied and what parents can watch for."
              maxLength={500}
            />
            <p className="text-xs text-[#94A3B8]">
              You do not need to write the final message — we will help turn it into clear
              public-safety content.
            </p>
          </div>

          <GraphicStudioSelect
            id="safety-audience"
            label="Who is this message for?"
            value={audience}
            options={SAFETY_AUDIENCES}
            onChange={(value) => setAudience(value as SafetyAudience)}
          />

          <GraphicStudioSelect
            id="safety-style"
            label="What style would you like?"
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
              placeholder="Example: A parent calmly talking with a child at home."
              maxLength={300}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button
            type="button"
            onClick={() => void prepareMessage()}
            disabled={preparing || topic.trim().length < 8}
            className="w-full bg-[#0f1c3f] hover:bg-[#1e293b]"
          >
            {preparing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Researching & drafting message…
              </>
            ) : (
              "Prepare message"
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
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={320}
                />
              </div>
              <Button
                type="button"
                onClick={() => void generateGraphic()}
                disabled={generating || !headline.trim() || !message.trim()}
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
              <p className="text-xs text-[#94A3B8]">
                {settings.logoUrl
                  ? "Your original agency logo will be composited bottom-right after generation."
                  : "Add your agency logo in settings to include it automatically."}
              </p>
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
                    alt="Safety graphic preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </button>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[#94A3B8]">
                  <Sparkles className="h-5 w-5" />
                  Prepare the message, approve the copy, then generate your graphic.
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
              onClick={() => void copyMessage()}
              disabled={!headline.trim() && !message.trim()}
            >
              <Copy className="mr-2 h-4 w-4" />
              {copied ? "Copied" : "Copy text"}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/pio-tool/settings">Agency logo settings</Link>
            </Button>
          </div>

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
