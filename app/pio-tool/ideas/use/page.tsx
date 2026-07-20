"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAgency } from "@/lib/agency-context"
import { useMemberSession } from "@/lib/use-member-session"
import { isLocalGuestPreviewClient } from "@/lib/local-preview"
import type { PostOpportunity } from "@/lib/post-generator/types"
import {
  loadStashedOpportunity,
  markOpportunityPosted,
} from "@/lib/post-generator/opportunity-store"
import {
  opportunityFingerprint,
  topicKey,
} from "@/lib/post-generator/rank-opportunities"
import {
  createWeatherAlertImage,
  isWeatherAlertOpportunity,
  weatherAlertHeadline,
} from "@/lib/pio-weather-graphic"
import {
  createHolidayImage,
  holidaySlogan,
  holidayTheme,
  isHolidayOpportunity,
} from "@/lib/pio-holiday-graphic"

const CUSTOMIZE_OPTIONS = [
  { mode: "shorten", label: "Shorten" },
  { mode: "conversational", label: "More conversational" },
  { mode: "formal", label: "More formal" },
  { mode: "facebook", label: "Facebook version" },
  { mode: "instagram", label: "Instagram version" },
  { mode: "twitter", label: "X version" },
  { mode: "add_emojis", label: "Add emojis" },
  { mode: "remove_emojis", label: "Remove emojis" },
] as const

export default function UsePostPage() {
  const router = useRouter()
  const { settings } = useAgency()
  const { member } = useMemberSession()
  const guest = isLocalGuestPreviewClient() || !member

  const [opp, setOpp] = useState<PostOpportunity | null>(null)
  const [message, setMessage] = useState("")
  const [originalMessage, setOriginalMessage] = useState("")
  const [customizing, setCustomizing] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [markedPosted, setMarkedPosted] = useState(false)
  const [graphicFailed, setGraphicFailed] = useState(false)
  const [generatedGraphic, setGeneratedGraphic] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void loadStashedOpportunity().then((stashed) => {
      if (cancelled || !stashed) return
      setOpp(stashed)
      const msg = stashed.curatedMessage || stashed.curated?.message || ""
      setMessage(msg)
      setOriginalMessage(msg)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Safety net: generate alert or holiday graphic on the client if missing.
  useEffect(() => {
    if (!opp || opp.graphicUrl?.startsWith("data:")) return
    let cancelled = false

    const generate = async () => {
      if (isHolidayOpportunity(opp)) {
        const dataUrl = await createHolidayImage({
          logoUrl: settings.logoUrl,
          agencyName: settings.agencyName,
          slogan: holidaySlogan(opp),
          theme: holidayTheme(opp),
        })
        if (!cancelled && dataUrl) setGeneratedGraphic(dataUrl)
        return
      }
      if (isWeatherAlertOpportunity(opp)) {
        const dataUrl = await createWeatherAlertImage({
          logoUrl: settings.logoUrl,
          agencyName: settings.agencyName,
          headline: weatherAlertHeadline(opp),
          subtitle: opp.title,
        })
        if (!cancelled && dataUrl) setGeneratedGraphic(dataUrl)
      }
    }

    void generate()
    return () => {
      cancelled = true
    }
  }, [opp, settings.logoUrl, settings.agencyName])

  const graphic =
    generatedGraphic ||
    opp?.graphicUrl ||
    opp?.graphicThumbnailUrl ||
    opp?.curated?.graphicUrl ||
    opp?.curated?.graphicThumbnailUrl

  useEffect(() => {
    setGraphicFailed(false)
  }, [graphic])

  async function handleCustomize(mode: string) {
    if (!message.trim() || guest) return
    setCustomizing(true)
    try {
      const res = await fetch("/api/pio/customize-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "customize",
          mode,
          message,
          agencyName: settings.agencyName,
        }),
      })
      const data = await res.json()
      if (res.ok && data.message) setMessage(data.message)
    } finally {
      setCustomizing(false)
    }
  }

  async function handleTranslate() {
    if (!message.trim() || guest) return
    setTranslating(true)
    try {
      const res = await fetch("/api/pio/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      })
      const data = await res.json()
      if (res.ok && data.translation) setMessage(data.translation)
    } finally {
      setTranslating(false)
    }
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function handleMarkPosted() {
    if (!opp) return
    markOpportunityPosted({
      opportunityId: opp.id,
      fingerprint: opportunityFingerprint(opp),
      topicKey: topicKey(opp),
      contentId: opp.curated?.contentId,
    })
    void fetch("/api/pio/recommendation-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "published",
        opportunityId: opp.id,
        title: opp.title,
        category: opp.category,
        sourceLabel: opp.sourceLabel,
        signals: opp.signals ?? [],
        topicKey: topicKey(opp),
        agencyName: settings.agencyName,
      }),
    }).catch(() => {})
    setMarkedPosted(true)
  }

  if (!opp) {
    return (
      <div className="mx-auto max-w-[720px] py-12 text-center">
        <p className="text-sm text-[#64748B]">No post selected.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/pio-tool/ideas">Back to Post Generator</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[880px] space-y-6 pb-10">
      <div>
        <Link
          href="/pio-tool/ideas"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#0f1c3f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Post Generator
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1c3f]">Review Post</h1>
        <p className="mt-1 text-sm text-[#7a8ab0]">{opp.title}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e2e8f5] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-[#0f1c3f]">Graphic</h2>
          {graphic && !graphicFailed ? (
            <div className="relative mt-3 aspect-video overflow-hidden rounded-xl bg-[#0d1526]">
              <Image
                src={graphic}
                alt={opp.graphicAltText || opp.curated?.title || opp.title}
                fill
                className="object-contain"
                sizes="(max-width: 880px) 50vw"
                unoptimized={graphic.startsWith("http")}
                onError={() => setGraphicFailed(true)}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-[#94A3B8]">No graphic available for this post.</p>
          )}
          {graphic && !graphicFailed && (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <a href={graphic} download target="_blank" rel="noopener noreferrer">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download graphic
              </a>
            </Button>
          )}
          {graphic && !graphicFailed && opp.graphicSourceName && (
            <p className="mt-3 text-xs text-[#64748B]">
              Image source:{" "}
              {opp.graphicSourceUrl ? (
                <a
                  href={opp.graphicSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#2563EB] hover:underline"
                >
                  {opp.graphicSourceName}
                </a>
              ) : (
                opp.graphicSourceName
              )}
            </p>
          )}
          {opp.curated?.category && (
            <p className="mt-3 text-xs text-[#94A3B8]">Category: {opp.curated.category}</p>
          )}
          <p className="mt-1 text-xs text-[#2563EB]">{opp.recommendedPostTiming}</p>
        </section>

        <section className="rounded-2xl border border-[#e2e8f5] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#0f1c3f]">Message</h2>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setMessage(originalMessage)}
              disabled={message === originalMessage}
            >
              <RotateCcw className="mr-1 h-3.5 w-3.5" />
              Restore original
            </Button>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={10}
            className="mt-3 w-full resize-y rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-3 text-sm leading-relaxed text-[#405172] focus:border-[#7C5CFC] focus:outline-none focus:ring-1 focus:ring-[#7C5CFC]"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => void copyMessage()}>
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
            {!guest && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={translating}
                  onClick={() => void handleTranslate()}
                >
                  {translating ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Translate to Spanish
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-[#7C5CFC] hover:bg-[#6D28D9]"
                  disabled={markedPosted}
                  onClick={handleMarkPosted}
                >
                  {markedPosted ? "Published" : "Mark as published"}
                </Button>
              </>
            )}
          </div>

          {!guest && (
            <div className="mt-4 border-t border-[#e2e8f5] pt-4">
              <p className="mb-2 text-xs font-semibold text-[#64748B]">Customize with AI</p>
              <div className="flex flex-wrap gap-2">
                {CUSTOMIZE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.mode}
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={customizing}
                    onClick={() => void handleCustomize(opt.mode)}
                  >
                    {customizing ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1 h-3 w-3" />
                    )}
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => router.push("/pio-tool/ideas")}>
          Done
        </Button>
      </div>
    </div>
  )
}
