"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Download, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAgency } from "@/lib/agency-context"
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
  const [preview, setPreview] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const timeLabel = [startTime, endTime].filter(Boolean).join(" – ")
  const dateTime = [date, timeLabel].filter(Boolean).join(" · ")

  const generateGraphic = async () => {
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
        setPreview(aiImage)
        return
      }
      setError("OpenAI did not return a graphic. Please try again.")
    } catch {
      setError("Something went wrong generating the graphic.")
    } finally {
      setGenerating(false)
    }
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
          OpenAI designs the full 16:9 graphic from your event details. Your official logo goes
          bottom-right. No SaferU branding on the public graphic.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-[#e2e8f5] bg-white p-6 shadow-sm">
          <GraphicStudioSelect
            id="event-type"
            label="Event type"
            value={eventType}
            options={EVENT_GRAPHIC_TYPES}
            onChange={(value) => setEventType(value as EventGraphicType)}
          />
          <div className="space-y-2">
            <Label htmlFor="event-name">Event name</Label>
            <Input
              id="event-name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" value={date} onChange={(e) => setDate(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-time">Start time</Label>
              <Input
                id="start-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                maxLength={40}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="end-time">End time (optional)</Label>
              <Input
                id="end-time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={120}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">Short description</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={280}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta">Call to action</Label>
            <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} maxLength={80} />
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
          <p className="text-xs text-[#94A3B8]">
            Preview date/time: {dateTime || "—"}
          </p>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <Button
            type="button"
            onClick={() => void generateGraphic()}
            disabled={generating || !eventName.trim()}
            className="w-full bg-[#10B981] hover:bg-[#059669]"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                OpenAI is designing your graphic…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate graphic
              </>
            )}
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
