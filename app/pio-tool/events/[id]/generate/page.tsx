"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Copy,
  ImageIcon,
  Loader2,
  MapPin,
  Megaphone,
  Pencil,
  Languages,
} from "lucide-react"
import { useAgency } from "@/lib/agency-context"
import { useSubscription } from "@/lib/use-subscription"
import { PIOPaywall } from "@/components/pio-paywall"
import {
  buildEventCampaignPlan,
  type CampaignSlot,
  type EventCampaignKey,
  type EventSharedFacts,
} from "@/lib/event-message-prompts"
import {
  daysUntil,
  formatEventDateLong,
  formatEventDateShort,
  formatTimeRange,
  getPioEventById,
  mergeEventPosts,
  savePioEvent,
  type PioEvent,
  type PioEventPost,
} from "@/lib/pio-events-store"

type SocialChannel = "Facebook" | "X"

const CHANNELS: Array<{ id: SocialChannel; label: string }> = [
  { id: "Facebook", label: "Facebook Post" },
  { id: "X", label: "X Post" },
]

const SLOT_BLURBS: Record<EventCampaignKey, string> = {
  initial_announcement: "Announce the event early so people can save the date.",
  event_highlight: "Spotlight one or two reasons the community should attend.",
  one_week_reminder: "Remind people logistics and how to plan around it.",
  what_to_expect: "Help attendees know what the experience will be like.",
  day_before: "A clear tomorrow reminder with time and place.",
  event_day: "A concise today reminder before the event starts.",
  optional_final: "A short last nudge for people nearby.",
  thank_you: "Thank attendees and share a positive wrap-up the day after.",
}

function todayYmd() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`
}

function isCampaignKey(value: string | null): value is EventCampaignKey {
  return Boolean(
    value &&
      [
        "initial_announcement",
        "event_highlight",
        "one_week_reminder",
        "what_to_expect",
        "day_before",
        "event_day",
        "optional_final",
        "thank_you",
      ].includes(value)
  )
}

function dueLabel(date: string): { label: string; className: string } {
  const today = todayYmd()
  if (date === today) {
    return { label: "Due Today", className: "bg-[#DBEAFE] text-[#1D4ED8]" }
  }
  if (date < today) {
    return { label: "Past", className: "bg-[#F3F4F6] text-[#6b7280]" }
  }
  const days = daysUntil(date)
  return {
    label: days === 1 ? "1 day" : `${days} days`,
    className: "bg-[#DBEAFE] text-[#1D4ED8]",
  }
}

export default function GenerateMessagesPage() {
  return (
    <PIOPaywall>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
          </div>
        }
      >
        <GenerateMessagesInner />
      </Suspense>
    </PIOPaywall>
  )
}

function GenerateMessagesInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = String(params.id || "")
  const { settings } = useAgency()
  const { isSubscribed } = useSubscription()

  const [event, setEvent] = useState<PioEvent | null>(null)
  const [selectedKey, setSelectedKey] = useState<EventCampaignKey>("initial_announcement")
  const [channel, setChannel] = useState<SocialChannel>("Facebook")
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [spanishMessage, setSpanishMessage] = useState("")
  const [langView, setLangView] = useState<"en" | "es">("en")
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState(false)
  const [messageDraft, setMessageDraft] = useState("")

  const refresh = useCallback(() => {
    setEvent(getPioEventById(id))
  }, [id])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const fromQuery = searchParams.get("key")
    if (isCampaignKey(fromQuery)) setSelectedKey(fromQuery)
  }, [searchParams])

  const slots = useMemo(() => {
    if (!event) return [] as CampaignSlot[]
    const facts: EventSharedFacts = {
      organizationName: settings.agencyName || "Public Safety Agency",
      organizationType: settings.agencyType || "public safety agency",
      eventName: event.title,
      eventCategory: event.category || "",
      eventType: event.eventType || "",
      eventDate: event.eventDate,
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      locationName: event.location,
      fullAddress: event.address || "",
      eventDescription: event.description,
      eventHighlights: (event.highlights || []).join(", "),
      contactEmail: event.contactEmail || "",
      contactPhone: event.contactPhone || "",
      isRecurring: event.recurring ? "yes" : "no",
      agencyRole: event.hostingRole || "hosting",
      hostOrganization: event.hostOrganization || "",
      audience: event.audience,
      parking: event.parking,
      registration: event.registration,
      registrationRequired: event.registrationRequired,
      registrationDeadline: event.registrationDeadline,
      registrationUrl: event.registrationUrl,
      cost: event.cost,
      accessibility: event.accessibility,
      arrivalInstructions: event.arrivalInstructions,
      website: event.website,
      primaryImage: event.primaryImage,
      additionalAssets: event.additionalAssets,
      capacityStatus: event.capacityStatus,
      weatherPlan: event.weatherPlan,
      allowOptionalFinalReminder: !/registration|rsvp required|ticket|sold.?out|private|limited capac/i.test(
        `${event.registration || ""} ${event.capacityStatus || ""} ${event.description}`
      ),
    }
    return buildEventCampaignPlan(facts, todayYmd())
  }, [event, settings.agencyName, settings.agencyType])

  useEffect(() => {
    if (slots.length === 0) return
    if (!slots.some((s) => s.key === selectedKey)) {
      setSelectedKey(slots[0]!.key)
    }
  }, [slots, selectedKey])

  const selectedSlot = slots.find((s) => s.key === selectedKey) || slots[0]
  const existingPost = useMemo(() => {
    if (!event || !selectedSlot) return null
    return (
      event.posts.find((p) => p.key === selectedSlot.key && p.channel === channel) || null
    )
  }, [event, selectedSlot, channel])

  const otherChannelPost = useMemo(() => {
    if (!event || !selectedSlot) return null
    const other: SocialChannel = channel === "Facebook" ? "X" : "Facebook"
    return (
      event.posts.find((p) => p.key === selectedSlot.key && p.channel === other) || null
    )
  }, [event, selectedSlot, channel])

  function selectSlot(key: EventCampaignKey) {
    setSelectedKey(key)
    setError(null)
    setSpanishMessage("")
    setLangView("en")
    setTranslateError(null)
    setEditingMessage(false)
    router.replace(`/pio-tool/events/${id}/generate?key=${key}`, { scroll: false })
  }

  function requestGenerate() {
    if (!event || !selectedSlot || !isSubscribed || generating) return
    const channelLabel = channel === "X" ? "X" : "Facebook"
    const msg = `Generate a ${channelLabel} message for “${selectedSlot.timingLabel}”? This uses 1 generation credit.`
    if (!window.confirm(msg)) return
    void generateSelected()
  }

  async function generateSelected() {
    if (!event || !selectedSlot || !isSubscribed) return
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/pio/generate-event-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: settings.agencyName || "Demo Township Police Department",
          organizationType: settings.agencyType || "law enforcement",
          title: event.title,
          description: event.description,
          location: event.location,
          address: event.address,
          eventDate: event.eventDate,
          startTime: event.startTime,
          endTime: event.endTime,
          eventType: event.eventType,
          highlights: event.highlights,
          contactEmail: event.contactEmail,
          contactPhone: event.contactPhone,
          recurring: event.recurring,
          hostingRole: event.hostingRole,
          hostOrganization: event.hostOrganization,
          audience: event.audience,
          parking: event.parking,
          registration: event.registration,
          registrationRequired: event.registrationRequired,
          registrationDeadline: event.registrationDeadline,
          registrationUrl: event.registrationUrl,
          cost: event.cost,
          accessibility: event.accessibility,
          arrivalInstructions: event.arrivalInstructions,
          website: event.website,
          primaryImage: event.primaryImage,
          additionalAssets: event.additionalAssets,
          capacityStatus: event.capacityStatus,
          weatherPlan: event.weatherPlan,
          keys: [selectedSlot.key],
          channel,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to generate message.")
        return
      }
      if (data.status === "needs_human_review") {
        const verification = Array.isArray(data.detailsToVerify)
          ? data.detailsToVerify.join(" ")
          : ""
        setError(
          [data.humanReviewReason || "This campaign needs human review before publication.", verification]
            .filter(Boolean)
            .join(" ")
        )
        return
      }
      const incoming: PioEventPost[] = (data.posts as Array<Partial<PioEventPost>>).map(
        (p) => ({
          id: crypto.randomUUID(),
          key: p.key,
          postDate: String(p.postDate || selectedSlot.recommendedPostDate),
          postTime: p.postTime || selectedSlot.recommendedPostTime,
          timingLabel: String(p.timingLabel || selectedSlot.timingLabel),
          campaignStage: p.campaignStage,
          strategicPurpose: p.strategicPurpose,
          timeUntilEvent: p.timeUntilEvent,
          channel,
          postTitle: p.postTitle,
          message: String(p.message || ""),
          callToAction: p.callToAction,
          suggestedImage: p.suggestedImage,
          detailsToVerify: p.detailsToVerify,
          qualityStatus: p.qualityStatus,
          tag: p.tag || event.title,
        })
      )
      const next: PioEvent = {
        ...event,
        status: "generated",
        posts: mergeEventPosts(event.posts, incoming),
      }
      savePioEvent(next)
      setEvent(next)
      setSpanishMessage("")
      setLangView("en")
      setTranslateError(null)
      setEditingMessage(false)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  async function copyMessage() {
    if (!existingPost?.message) return
    const text =
      channel === "Facebook" && langView === "es" && spanishMessage.trim()
        ? spanishMessage
        : existingPost.message
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  function saveMessageEdit() {
    if (!event || !existingPost || !messageDraft.trim()) return
    if (channel === "X" && messageDraft.length > 280) {
      setError("X messages must be 280 characters or fewer.")
      return
    }
    const next: PioEvent = {
      ...event,
      posts: event.posts.map((post) =>
        post.id === existingPost.id ? { ...post, message: messageDraft.trim() } : post
      ),
    }
    savePioEvent(next)
    setEvent(next)
    setEditingMessage(false)
    setError(null)
  }

  async function translateFacebook() {
    if (channel !== "Facebook" || !existingPost?.message?.trim()) return
    setTranslating(true)
    setTranslateError(null)
    try {
      const res = await fetch("/api/pio/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: existingPost.message, contentType: "event" }),
      })
      const data = await res.json()
      if (res.ok && data.translation) {
        setSpanishMessage(data.translation)
        setLangView("es")
        return
      }
      setTranslateError(data?.error || "Translation failed. Please try again.")
    } catch {
      setTranslateError("Could not reach the server. Check your connection and try again.")
    } finally {
      setTranslating(false)
    }
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-16 text-center">
        <p className="font-semibold text-[#0f1c3f]">Event not found</p>
        <Button asChild className="bg-[#2563EB] hover:bg-[#1d4ed8]">
          <Link href="/pio-tool/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  const published = event.status === "generated" || event.posts.length > 0
  const timeLabel = formatTimeRange(event.startTime, event.endTime)
  const agencyLabel = settings.agencyName || "Your agency"
  const charCount = existingPost?.message.length ?? 0

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-12">
      <Link
        href={`/pio-tool/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#2563EB]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Event
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1c3f]">Generate Messages</h1>
          <p className="mt-1 text-sm text-[#7a8ab0]">
            Choose a communication from the timeline to generate your message or content.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/pio-tool/events/${event.id}?edit=1`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Event
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#e2e8f5] bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-[#0f1c3f]">{event.title}</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                published ? "bg-[#D1FAE5] text-[#047857]" : "bg-[#F3F4F6] text-[#6b7280]"
              }`}
            >
              {published ? "Published" : "Draft"}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#64748b]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatEventDateLong(event.eventDate)}
            </span>
            {timeLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {timeLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#64748b]">
            1. Select a Communication
          </h2>
          <ul className="space-y-2">
            {slots.map((slot) => {
              const active = selectedSlot?.key === slot.key
              const { month, day } = formatEventDateShort(slot.recommendedPostDate)
              const due = dueLabel(slot.recommendedPostDate)
              return (
                <li key={slot.key}>
                  <button
                    type="button"
                    onClick={() => selectSlot(slot.key)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]/30"
                        : "border-[#e2e8f5] bg-white hover:border-[#93c5fd]"
                    }`}
                  >
                    <div
                      className={`flex h-[58px] w-12 shrink-0 flex-col items-center justify-center rounded-xl ${
                        active ? "bg-[#DBEAFE] text-[#1D4ED8]" : "bg-[#F3F4F6] text-[#0f1c3f]"
                      }`}
                    >
                      <span className="text-[10px] font-bold tracking-wide opacity-70">
                        {month}
                      </span>
                      <span className="text-xl font-bold leading-none">{day}</span>
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#0f1c3f]">
                        {slot.timingLabel}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#7a8ab0]">
                        {SLOT_BLURBS[slot.key]}
                      </span>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${due.className}`}
                      >
                        {due.label}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#64748b]">
              2. Review & Generate
            </h2>
            <p className="mt-1 text-lg font-bold text-[#0f1c3f]">
              {selectedSlot?.timingLabel || "Select a communication"}
            </p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {CHANNELS.map((c) => {
              const active = channel === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    // Channel switch only — never auto-generates (saves credits)
                    setChannel(c.id)
                    setError(null)
                    setSpanishMessage("")
                    setLangView("en")
                    setTranslateError(null)
                    setEditingMessage(false)
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]"
                      : "border-[#e2e8f5] bg-white text-[#64748b] hover:border-[#93c5fd]"
                  }`}
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  {c.label}
                </button>
              )
            })}
          </div>

          <p className="mb-3 text-xs text-[#7a8ab0]">
            {channel === "X"
              ? "X posts are kept under 280 characters. Choosing X does not generate until you click Generate Message."
              : "Choosing Facebook does not generate until you click Generate Message."}
          </p>

          <div className="relative overflow-hidden rounded-2xl border border-[#e2e8f5] bg-[#F8FAFC]">
            {existingPost ? (
              <div className="p-4">
                <div className="rounded-xl border border-[#e2e8f5] bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
                      {agencyLabel.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0f1c3f]">{agencyLabel}</p>
                      <p className="text-xs text-[#94A3B8]">Saved · {channel}</p>
                    </div>
                  </div>
                  {channel === "Facebook" && spanishMessage && (
                    <div className="mb-3 flex gap-2">
                      <Button
                        type="button"
                        variant={langView === "en" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLangView("en")}
                      >
                        English
                      </Button>
                      <Button
                        type="button"
                        variant={langView === "es" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLangView("es")}
                      >
                        Español
                      </Button>
                    </div>
                  )}
                  {channel === "Facebook" && existingPost.postTitle && langView === "en" && (
                    <p className="mb-2 text-sm font-bold text-[#0f1c3f]">
                      {existingPost.postTitle}
                    </p>
                  )}
                  {langView === "en" && (
                    <div className="mb-3 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-2 text-xs text-[#1D4ED8]">
                      <p className="font-semibold">
                        {existingPost.campaignStage || existingPost.timingLabel}
                      </p>
                      <p className="mt-1">
                        Recommended {existingPost.postDate}
                        {existingPost.postTime ? ` at ${existingPost.postTime}` : ""}
                      </p>
                      {existingPost.strategicPurpose && (
                        <p className="mt-1 text-[#405172]">
                          Why SaferU recommends it: {existingPost.strategicPurpose}
                        </p>
                      )}
                    </div>
                  )}
                  {editingMessage && langView === "en" ? (
                    <div>
                      <textarea
                        value={messageDraft}
                        onChange={(e) => setMessageDraft(e.target.value)}
                        rows={8}
                        className="w-full rounded-xl border border-[#cbd5e1] bg-white p-3 text-sm leading-relaxed text-[#405172] outline-none focus:border-[#2563EB]"
                        aria-label="Edit event message"
                      />
                      {channel === "X" && (
                        <p
                          className={`mt-1 text-right text-xs ${
                            messageDraft.length > 280 ? "text-red-600" : "text-[#94A3B8]"
                          }`}
                        >
                          {messageDraft.length}/280
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#405172]">
                      {channel === "Facebook" && langView === "es" && spanishMessage
                        ? spanishMessage
                        : existingPost.message}
                    </p>
                  )}
                  {existingPost.callToAction && (
                    <p className="mt-3 text-sm font-medium text-[#2563EB]">
                      {existingPost.callToAction}
                    </p>
                  )}
                  {existingPost.suggestedImage && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2 text-xs text-[#64748b]">
                      <ImageIcon className="h-4 w-4 shrink-0" />
                      Suggested image: {existingPost.suggestedImage}
                    </div>
                  )}
                  {langView === "en" && (existingPost.detailsToVerify?.length ?? 0) > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      <p className="font-semibold">Details to verify before publishing</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {existingPost.detailsToVerify!.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {channel === "X" && (
                    <p
                      className={`mt-3 text-right text-xs font-medium ${
                        charCount > 280 ? "text-red-600" : "text-[#94A3B8]"
                      }`}
                    >
                      {charCount}/280
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 p-8 text-center">
                <Megaphone className="h-10 w-10 text-[#94A3B8]" />
                <p className="text-sm font-semibold text-[#0f1c3f]">
                  No {channel} message yet
                </p>
                <p className="max-w-sm text-sm text-[#7a8ab0]">
                  {otherChannelPost
                    ? `You already have a ${channel === "X" ? "Facebook" : "X"} version saved. Generate a separate ${channel} message when you’re ready — it uses 1 generation credit.`
                    : `Click Generate Message to draft this ${selectedSlot?.timingLabel.toLowerCase()} for ${channel}. Uses 1 generation credit.`}
                </p>
                <Button
                  type="button"
                  className="mt-1 bg-[#2563EB] hover:bg-[#1d4ed8]"
                  disabled={generating || !isSubscribed || !selectedSlot}
                  onClick={requestGenerate}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    "Generate Message"
                  )}
                </Button>
              </div>
            )}
          </div>

          {existingPost && (
            <div className="mt-4 space-y-2">
              {translateError && (
                <p className="text-sm text-destructive">{translateError}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {editingMessage ? (
                  <>
                    <Button type="button" onClick={saveMessageEdit}>
                      <Check className="mr-2 h-4 w-4" />
                      Save Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingMessage(false)}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMessageDraft(existingPost.message)
                      setEditingMessage(true)
                      setLangView("en")
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={copyMessage}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                {channel === "Facebook" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void translateFacebook()}
                    disabled={translating || !existingPost.message.trim()}
                  >
                    {translating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Translating…
                      </>
                    ) : (
                      <>
                        <Languages className="mr-2 h-4 w-4" />
                        Translate to Spanish
                      </>
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={requestGenerate}
                  disabled={generating || !isSubscribed}
                >
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Megaphone className="mr-2 h-4 w-4" />
                  )}
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
