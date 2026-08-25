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
  type SafetyResearchBrief,
  type SafetyTipCategory,
} from "@/lib/pio-graphic-studio-types"

export default function SafetyTipGraphicPage() {
  const { settings } = useAgency()
  const [category, setCategory] = useState<SafetyTipCategory>("Other / Custom")
  const [residentNeed, setResidentNeed] = useState("")
  const [audience, setAudience] = useState<SafetyAudience>("General Community")
  const [style, setStyle] = useState<SafetyGraphicStyle>("Let SaferU Decide")
  const [visualRequest, setVisualRequest] = useState("")
  const [headline, setHeadline] = useState("")
  const [supportingLine, setSupportingLine] = useState("")
  const [body, setBody] = useState("")
  const [emergencyMessage, setEmergencyMessage] = useState("")
  const [caption, setCaption] = useState("")
  const [research, setResearch] = useState<SafetyResearchBrief | null>(null)
  const [showSources, setShowSources] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [graphicId, setGraphicId] = useState<string | null>(null)
  const [revisionRequest, setRevisionRequest] = useState("")
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [researching, setResearching] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [revising, setRevising] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const agencyPayload = {
    agencyName: settings.agencyName,
    agencyType: settings.agencyType,
    agencyTypeOther: settings.agencyTypeOther,
    city: settings.city,
    state: settings.state,
  }

  const prepareMessage = async () => {
    const need = residentNeed.trim()
    if (need.length < 8) {
      setError("Tell us what you want residents to know — you do not need a finished headline.")
      return
    }
    setResearching(true)
    setError(null)
    try {
      const res = await fetch("/api/pio/graphic-studio/safety-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          residentNeed: need,
          audience,
          style,
          visualRequest,
          ...agencyPayload,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(String(data.error || "Could not research this topic."))
        return
      }
      setHeadline(String(data.headline || ""))
      setSupportingLine(String(data.supportingLine || ""))
      setBody(String(data.body || ""))
      setEmergencyMessage(String(data.emergencyMessage || ""))
      setCaption(String(data.caption || data.body || ""))
      setResearch(data.research || null)
    } catch {
      setError("Something went wrong researching this topic. Please try again.")
    } finally {
      setResearching(false)
    }
  }

  const generateGraphic = async () => {
    if (!headline.trim() || !body.trim()) {
      setError("Prepare and review the message before generating the graphic.")
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
          residentNeed,
          audience,
          style,
          visualRequest,
          headline,
          supportingLine,
          body,
          emergencyMessage,
          visualDirection: research?.visual_concept || visualRequest,
          verifiedTopic: research?.verified_topic || category,
          mustShow: research?.visual_must_show || [],
          mustAvoid: research?.visual_must_avoid || [],
          sources: research?.sources || [],
          research,
          caption,
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
          headline,
          supportingLine,
          body,
          emergencyMessage,
          audience,
          style,
          category,
          visualDirection: research?.visual_concept || "",
          agencyLogoUrl: settings.logoUrl?.startsWith("/") ? settings.logoUrl : null,
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
          Tell us what residents should know. SaferU researches the topic, drafts a clear message,
          and designs a 16:9 graphic with your agency logo in the bottom-right — no SaferU branding
          on the public image.
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
            <Label htmlFor="residentNeed">What do you want residents to know?</Label>
            <Textarea
              id="residentNeed"
              rows={4}
              value={residentNeed}
              onChange={(e) => setResidentNeed(e.target.value)}
              placeholder="Example: Remind residents not to charge e-scooters in front of their apartment door because it may block their only exit."
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
            <Label htmlFor="visualRequest">Anything you want shown in the graphic? (optional)</Label>
            <Textarea
              id="visualRequest"
              rows={2}
              value={visualRequest}
              onChange={(e) => setVisualRequest(e.target.value)}
              placeholder="Example: Show the inside of an apartment with an e-scooter charging directly in front of the front door."
              maxLength={300}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button
            type="button"
            onClick={() => void prepareMessage()}
            disabled={researching || residentNeed.trim().length < 8}
            className="w-full bg-[#0f1c3f] hover:bg-[#1e293b]"
          >
            {researching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Researching safety guidance…
              </>
            ) : (
              "Prepare message"
            )}
          </Button>

          {(headline || body) && (
            <div className="space-y-3 rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-3">
              {research?.user_request_corrected && research.correction_explanation ? (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  We adjusted the message to match current safety guidance:{" "}
                  {research.correction_explanation}
                </p>
              ) : null}
              <div className="space-y-1">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="supportingLine">Supporting line</Label>
                <Input
                  id="supportingLine"
                  value={supportingLine}
                  onChange={(e) => setSupportingLine(e.target.value)}
                  maxLength={160}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="body">Main safety message</Label>
                <Textarea
                  id="body"
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={320}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="emergencyMessage">Emergency message (optional)</Label>
                <Input
                  id="emergencyMessage"
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  maxLength={160}
                />
              </div>
              {research?.sources?.length ? (
                <div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#2563EB]"
                    onClick={() => setShowSources((v) => !v)}
                  >
                    {showSources ? "Hide" : "Show"} verified safety sources
                  </button>
                  {showSources && (
                    <ul className="mt-2 space-y-1 text-xs text-[#64748B]">
                      {research.sources.map((source, idx) => (
                        <li key={`${source.url}-${idx}`}>
                          {source.organization}
                          {source.title ? ` — ${source.title}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
              <Button
                type="button"
                onClick={() => void generateGraphic()}
                disabled={generating || !headline.trim() || !body.trim()}
                className="w-full bg-[#2563EB] hover:bg-[#1d4ed8]"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Designing graphic…
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
                  Prepare the message, then generate a 16:9 graphic.
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
                placeholder="Example: Make the headline larger. Keep everything else the same."
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
