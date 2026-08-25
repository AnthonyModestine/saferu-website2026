"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Download, Loader2, Sparkles, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAgency } from "@/lib/agency-context"
import { compositeAgencyLogo, createEventGraphic } from "@/lib/pio-graphic-studio"
import { GraphicStudioSelect } from "@/components/pio/graphic-studio-select"
import {
  EVENT_GRAPHIC_STYLES,
  EVENT_GRAPHIC_TYPES,
  type EventGraphicStyle,
  type EventGraphicType,
} from "@/lib/pio-graphic-studio-types"

export default function EventGraphicPage() {
  const { settings } = useAgency()
  const [eventType, setEventType] = useState<EventGraphicType>("Coffee With a Cop")
  const [eventName, setEventName] = useState("Coffee with a Cop")
  const [date, setDate] = useState("Saturday, Sept 12")
  const [startTime, setStartTime] = useState("10:00 AM")
  const [endTime, setEndTime] = useState("12:00 PM")
  const [location, setLocation] = useState("Municipal Building parking lot")
  const [details, setDetails] = useState(
    "Stop by, meet officers, and ask questions in a relaxed setting."
  )
  const [cta, setCta] = useState("All are welcome")
  const [contact, setContact] = useState("")
  const [style, setStyle] = useState<EventGraphicStyle>("Let SaferU Decide")
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timeLabel = [startTime, endTime].filter(Boolean).join(" – ")
  const dateTime = [date, timeLabel].filter(Boolean).join(" · ")

  const stampLogo = async (imageDataUrl: string) => {
    if (!settings.logoUrl) return imageDataUrl
    return (
      (await compositeAgencyLogo({
        imageDataUrl,
        agencyLogoUrl: settings.logoUrl,
        agencyName: settings.agencyName,
      })) || imageDataUrl
    )
  }

  const generateLocal = async () => {
    setGenerating(true)
    setError(null)
    try {
      const dataUrl = await createEventGraphic({
        eventName,
        dateTime,
        location,
        details,
        cta,
        agencyName: settings.agencyName,
        agencyLogoUrl: settings.logoUrl,
        backgroundImageUrl,
        aspect: "landscape",
      })
      setPreview(dataUrl)
    } finally {
      setGenerating(false)
    }
  }

  const generateWithAi = async () => {
    if (!eventName.trim() || !date.trim() || !location.trim()) {
      setError("Event name, date, and location are required.")
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/pio/graphic-studio/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          eventName,
          date,
          time: timeLabel,
          location,
          description: details,
          cta,
          contact,
          style,
          agencyName: settings.agencyName,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(String(data.error || "Could not generate graphic."))
        return
      }
      const aiImage = typeof data.imageDataUrl === "string" ? data.imageDataUrl : ""
      if (aiImage) {
        setPreview(await stampLogo(aiImage))
        return
      }
      setError("AI did not return an image. Try the simple template.")
    } catch {
      setError("Something went wrong generating the graphic.")
    } finally {
      setGenerating(false)
    }
  }

  const onBackgroundSelected = (file: File | null) => {
    if (!file) {
      setBackgroundImageUrl(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setBackgroundImageUrl(typeof reader.result === "string" ? reader.result : null)
    }
    reader.readAsDataURL(file)
  }

  const download = () => {
    if (!preview) return
    const a = document.createElement("a")
    a.href = preview
    a.download = `event-graphic-${Date.now()}.png`
    a.click()
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
        <h1 className="text-3xl font-bold text-[#0f1c3f]">Event Graphic</h1>
        <p className="mt-2 text-[#64748B]">
          Residents should immediately see what, when, and where. Your official logo goes
          bottom-right. No SaferU branding on the public graphic.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="space-y-4 rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
          <GraphicStudioSelect
            id="event-type"
            label="What type of event are you promoting?"
            value={eventType}
            options={EVENT_GRAPHIC_TYPES}
            onChange={(value) => setEventType(value as EventGraphicType)}
          />
          <div className="space-y-2">
            <Label htmlFor="eventName">Event name</Label>
            <Input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              maxLength={90}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-3">
              <Label htmlFor="date">Date</Label>
              <Input id="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start time</Label>
              <Input id="startTime" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="endTime">End time (optional)</Label>
              <Input id="endTime" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Short description</Label>
            <Textarea
              id="details"
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={220}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta">Call to action (optional)</Label>
            <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} maxLength={60} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact">Contact (optional)</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={80}
            />
          </div>
          <GraphicStudioSelect
            id="event-style"
            label="Style"
            value={style}
            options={EVENT_GRAPHIC_STYLES}
            onChange={(value) => setStyle(value as EventGraphicStyle)}
          />
          <div className="space-y-2">
            <Label htmlFor="background">Event photo (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="background"
                type="file"
                accept="image/*"
                onChange={(e) => onBackgroundSelected(e.target.files?.[0] ?? null)}
              />
              {backgroundImageUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setBackgroundImageUrl(null)}>
                  Clear
                </Button>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
              <Upload className="h-3.5 w-3.5" />
              Used for the quick template. AI generation designs a new 16:9 scene.
            </p>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <Button
            type="button"
            onClick={() => void generateWithAi()}
            disabled={generating || !eventName.trim()}
            className="w-full bg-[#10B981] hover:bg-[#059669]"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Designing graphic…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void generateLocal()}
            disabled={generating || !eventName.trim()}
            className="w-full"
          >
            Use simple template
          </Button>
        </section>

        <section className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-[#e2e8f5] bg-[#0d1526] shadow-sm">
            <div className="relative aspect-video w-full">
              {preview ? (
                <Image src={preview} alt="Event graphic preview" fill className="object-contain" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#94A3B8]">
                  Preview will appear here
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={download} disabled={!preview} className="bg-[#0f1c3f]">
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/pio-tool/settings">Agency logo settings</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
