"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Download, Loader2, RefreshCw, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAgency } from "@/lib/agency-context"
import { createEventGraphic } from "@/lib/pio-graphic-studio"

export default function EventGraphicPage() {
  const { settings } = useAgency()
  const [eventName, setEventName] = useState("Coffee with a Cop")
  const [dateTime, setDateTime] = useState("Saturday, Sept 12 · 10:00 AM – 12:00 PM")
  const [location, setLocation] = useState("Municipal Building parking lot")
  const [details, setDetails] = useState("Stop by, meet officers, and ask questions in a relaxed setting. All ages welcome.")
  const [cta, setCta] = useState("All are welcome")
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const regenerate = async () => {
    setGenerating(true)
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

  useEffect(() => {
    void regenerate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          Tell us the event details and we&apos;ll place them into a clean flyer. Your department
          logo appears bottom-right — no SaferU branding on event graphics.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="space-y-4 rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="eventName">Event name</Label>
            <Input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              maxLength={90}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTime">Date & time</Label>
            <Input
              id="dateTime"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              placeholder="Saturday, Sept 12 · 10:00 AM"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="details">What residents should know</Label>
            <Textarea
              id="details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={220}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cta">Call to action (optional)</Label>
            <Input id="cta" value={cta} onChange={(e) => setCta(e.target.value)} maxLength={40} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="background">Background image (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="background"
                type="file"
                accept="image/*"
                onChange={(e) => onBackgroundSelected(e.target.files?.[0] ?? null)}
              />
              {backgroundImageUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setBackgroundImageUrl(null)}
                >
                  Clear
                </Button>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
              <Upload className="h-3.5 w-3.5" />
              Use a photo of the venue or a past event. We darken it so text stays readable.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => void regenerate()}
            disabled={generating || !eventName.trim()}
            className="w-full bg-[#10B981] hover:bg-[#059669]"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Update graphic
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
