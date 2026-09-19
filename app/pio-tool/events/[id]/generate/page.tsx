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
  eventHolidayCopy,
  resolveEventHolidayContext,
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
  { id: "Facebook", label: "Facebook" },
  { id: "X", label: "X" },
]

const ADJUST_OPTIONS = [
  { mode: "shorten", label: "Shorter" },
  { mode: "longer", label: "Longer" },
  { mode: "add_emojis", label: "Add emojis" },
  { mode: "remove_emojis", label: "Remove emojis" },
] as const

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

type MessageDay = {
  key: EventCampaignKey
  postDate: string
  postTime?: string
  timingLabel: string
}

function todayYmd() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`
}

function isCampaignKey(value: string | null | undefined): value is EventCampaignKey {
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
          <div className="flex min-h-[40vh] items-center justify-center text-sm text-[#64748b]">
            Loading messages…
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
  const [selectedKey, setSelectedKey] = useState<EventCampaignKey | null>(null)
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
  const [customizing, setCustomizing] = useState<string | null>(null)
  const [autoXRequested, setAutoXRequested] = useState(false)

  const refresh = useCallback(() => {
    setEvent(getPioEventById(id))
  }, [id])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const fromQuery = searchParams.get("key")
    // Only open a message when the URL has a key from an explicit date click.
    // Never keep a stale key that would show copy on first paint without a click.
    if (isCampaignKey(fromQuery)) {
      setSelectedKey(fromQuery)
    } else {
      setSelectedKey(null)
    }
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
    return buildEventCampaignPlan(facts, todayYmd(), { includePast: true })
  }, [event, settings.agencyName, settings.agencyType])

  const holidayNote = useMemo(() => {
    if (!event) return null
    return eventHolidayCopy(
      resolveEventHolidayContext({
        eventDate: event.eventDate,
        eventName: event.title,
        eventDescription: event.description || "",
        eventType: event.eventType || "",
      })
    )
  }, [event])

  const messageDays = useMemo(() => {
    if (!event) return [] as MessageDay[]
    const today = todayYmd()
    const byKey = new Map<EventCampaignKey, MessageDay>()
    for (const post of event.posts) {
      if (!isCampaignKey(post.key)) continue
      if (post.postDate < today) continue
      const current = byKey.get(post.key)
      if (!current || post.channel === "Facebook") {
        byKey.set(post.key, {
          key: post.key,
          postDate: post.postDate,
          postTime: post.postTime,
          timingLabel: post.timingLabel || SLOT_BLURBS[post.key],
        })
      }
    }
    if (byKey.size > 0) {
      return Array.from(byKey.values()).sort((a, b) => a.postDate.localeCompare(b.postDate))
    }
    return slots
      .filter((slot) => slot.recommendedPostDate >= today)
      .map((slot) => ({
        key: slot.key,
        postDate: slot.recommendedPostDate,
        postTime: slot.recommendedPostTime,
        timingLabel: slot.timingLabel,
      }))
  }, [event, slots])

  useEffect(() => {
    if (messageDays.length === 0) {
      setSelectedKey(null)
      return
    }
    if (selectedKey && !messageDays.some((day) => day.key === selectedKey)) {
      setSelectedKey(null)
      router.replace(`/pio-tool/events/${id}/generate`, { scroll: false })
    }
  }, [messageDays, selectedKey, id, router])

  const selectedSlot = messageDays.find((day) => day.key === selectedKey) || null
  const campaignSlot = slots.find((slot) => slot.key === selectedSlot?.key)

  const existingPost = useMemo(() => {
    if (!event || !selectedSlot) return null
    return event.posts.find((p) => p.key === selectedSlot.key && p.channel === channel) || null
  }, [event, selectedSlot, channel])

  function selectSlot(key: EventCampaignKey) {
    if (selectedKey === key) {
      setSelectedKey(null)
      setChannel("Facebook")
      setError(null)
      setSpanishMessage("")
      setLangView("en")
      setTranslateError(null)
      setEditingMessage(false)
      setAutoXRequested(false)
      router.replace(`/pio-tool/events/${id}/generate`, { scroll: false })
      return
    }
    setSelectedKey(key)
    setChannel("Facebook")
    setError(null)
    setSpanishMessage("")
    setLangView("en")
    setTranslateError(null)
    setEditingMessage(false)
    setAutoXRequested(false)
    router.replace(`/pio-tool/events/${id}/generate?key=${key}`, { scroll: false })
  }

  async function generateSelected(targetChannel: SocialChannel = channel) {
    if (!event || !selectedSlot || !isSubscribed || generating) return
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
          channel: targetChannel,
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
          postDate: String(p.postDate || selectedSlot.postDate),
          postTime: p.postTime || selectedSlot.postTime || campaignSlot?.recommendedPostTime,
          timingLabel: String(p.timingLabel || selectedSlot.timingLabel),
          campaignStage: p.campaignStage,
          strategicPurpose: p.strategicPurpose,
          timeUntilEvent: p.timeUntilEvent,
          channel: targetChannel,
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
      setAutoXRequested(false)
    }
  }

  useEffect(() => {
    if (!event || !selectedSlot || generating || !isSubscribed) return
    if (channel !== "X" || existingPost || !autoXRequested) return
    void generateSelected("X")
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot X create when user swaps channel
  }, [autoXRequested, channel, existingPost, selectedSlot?.key])

  function requestRegenerate() {
    if (!event || !selectedSlot || !isSubscribed || generating) return
    if (existingPost && !window.confirm("Replace this message with a new draft?")) return
    void generateSelected(channel)
  }

  function switchChannel(next: SocialChannel) {
    setChannel(next)
    setError(null)
    setSpanishMessage("")
    setLangView("en")
    setTranslateError(null)
    setEditingMessage(false)
    if (next === "X") {
      const hasX = Boolean(
        event?.posts.some((p) => p.key === selectedSlot?.key && p.channel === "X")
      )
      setAutoXRequested(!hasX)
    } else {
      setAutoXRequested(false)
    }
  }

  async function customizeMessage(mode: (typeof ADJUST_OPTIONS)[number]["mode"]) {
    if (!event || !existingPost?.message?.trim() || customizing) return
    setCustomizing(mode)
    setError(null)
    try {
      const res = await fetch("/api/pio/customize-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "customize",
          mode: channel === "X" && mode === "shorten" ? "twitter" : mode,
          message: existingPost.message,
          agencyName: settings.agencyName || "",
          city: settings.city || "",
          state: settings.state || "",
          agencyType: settings.agencyType || "",
          agencyTypeOther: settings.agencyTypeOther || "",
          eventDate: event.eventDate,
          eventName: event.title,
          eventDescription: event.description || "",
          eventType: event.eventType || "",
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.message) {
        setError(data.error || "Could not adjust this message.")
        return
      }
      let nextMessage = String(data.message)
      if (channel === "X" && nextMessage.length > 280) {
        nextMessage = nextMessage.slice(0, 280)
      }
      const next: PioEvent = {
        ...event,
        posts: event.posts.map((post) =>
          post.id === existingPost.id ? { ...post, message: nextMessage } : post
        ),
      }
      savePioEvent(next)
      setEvent(next)
      setMessageDraft(nextMessage)
      setLangView("en")
      setSpanishMessage("")
    } catch {
      setError("Could not reach the server. Check your connection and try again.")
    } finally {
      setCustomizing(null)
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
  const busy = generating || Boolean(customizing)

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
          <h1 className="text-2xl font-bold text-[#0f1c3f]">Event Messages</h1>
          <p className="mt-1 text-sm text-[#7a8ab0]">
            Click a date to view that draft. Adjust the copy, swap to X, or translate to Spanish.
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
              {published ? "Ready" : "Draft"}
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
          {holidayNote && (
            <p className="mt-2 text-xs text-[#7a8ab0]">{holidayNote}</p>
          )}
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

      <section className="space-y-4">
        {messageDays.length === 0 ? (
          <div className="rounded-2xl border border-[#e2e8f5] bg-white p-6 text-sm text-[#7a8ab0] shadow-sm">
            No upcoming messages. Past posting dates are hidden automatically.
          </div>
        ) : (
          messageDays.map((day) => {
            const active = selectedSlot?.key === day.key
            const { month, day: dayNum } = formatEventDateShort(day.postDate)
            const due = dueLabel(day.postDate)
            const dayPost = active ? existingPost : null
            const showingMessage =
              active && channel === "Facebook" && langView === "es" && spanishMessage.trim()
                ? spanishMessage
                : dayPost?.message || ""

            return (
              <article
                key={day.key}
                className={`rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
                  active ? "border-[#2563EB] ring-1 ring-[#2563EB]/20" : "border-[#e2e8f5]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectSlot(day.key)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <div
                    className={`flex h-[58px] w-12 shrink-0 flex-col items-center justify-center rounded-xl ${
                      active ? "bg-[#DBEAFE] text-[#1D4ED8]" : "bg-[#F3F4F6] text-[#0f1c3f]"
                    }`}
                  >
                    <span className="text-[10px] font-bold tracking-wide opacity-70">{month}</span>
                    <span className="text-xl font-bold leading-none">{dayNum}</span>
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-[#0f1c3f]">{day.timingLabel}</span>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${due.className}`}
                      >
                        {due.label}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-[#7a8ab0]">
                      Post {day.postDate}
                      {day.postTime ? ` · ${day.postTime}` : ""}
                      {active ? " · Click to close" : " · Click to view message"}
                    </span>
                  </span>
                </button>

                {active && (
                <div className="mt-4 border-t border-[#eef2f7] pt-4">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {CHANNELS.map((c) => {
                      const channelActive = channel === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => switchChannel(c.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            channelActive
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

                  {generating && !dayPost ? (
                    <div className="flex items-center gap-2 text-sm text-[#64748b]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#2563EB]" />
                      {channel === "X" ? "Creating X version…" : "Creating message…"}
                    </div>
                  ) : dayPost ? (
                    <div className="rounded-xl border border-[#e2e8f5] bg-[#F8FAFC] p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
                          {agencyLabel.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#0f1c3f]">{agencyLabel}</p>
                          <p className="text-xs text-[#94A3B8]">{channel} draft</p>
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

                      {editingMessage &&
                      langView === "en" &&
                      existingPost?.id === dayPost.id ? (
                        <div>
                          <textarea
                            value={messageDraft}
                            onChange={(e) => setMessageDraft(e.target.value)}
                            rows={7}
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
                          {showingMessage}
                        </p>
                      )}

                      {dayPost.callToAction && (
                        <p className="mt-3 text-sm font-medium text-[#2563EB]">
                          {dayPost.callToAction}
                        </p>
                      )}
                      {channel === "X" && existingPost && (
                        <p
                          className={`mt-3 text-right text-xs font-medium ${
                            charCount > 280 ? "text-red-600" : "text-[#94A3B8]"
                          }`}
                        >
                          {charCount}/280
                        </p>
                      )}
                    </div>
                  ) : channel === "X" ? (
                    <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#F8FAFC] p-4 text-sm text-[#7a8ab0]">
                      No X version yet.{" "}
                      <button
                        type="button"
                        className="font-semibold text-[#2563EB] hover:underline"
                        disabled={!isSubscribed || busy}
                        onClick={() => {
                          setAutoXRequested(true)
                          void generateSelected("X")
                        }}
                      >
                        Create one
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-[#7a8ab0]">No Facebook draft for this date.</p>
                  )}

                  {existingPost && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                          Adjust
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {ADJUST_OPTIONS.map((opt) => (
                            <Button
                              key={opt.mode}
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={busy || langView === "es"}
                              onClick={() => void customizeMessage(opt.mode)}
                            >
                              {customizing === opt.mode ? (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              ) : null}
                              {opt.label}
                            </Button>
                          ))}
                          {channel === "Facebook" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={
                                translating || busy || !existingPost.message.trim()
                              }
                              onClick={() => void translateFacebook()}
                            >
                              {translating ? (
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Languages className="mr-2 h-3.5 w-3.5" />
                              )}
                              Spanish
                            </Button>
                          )}
                        </div>
                      </div>

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
                        <Button
                          type="button"
                          variant="outline"
                          onClick={requestRegenerate}
                          disabled={busy || !isSubscribed}
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
                </div>
                )}
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}
