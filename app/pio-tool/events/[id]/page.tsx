"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode, Suspense } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  MoreHorizontal,
  Pencil,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { useAgency } from "@/lib/agency-context"
import { PIOPaywall } from "@/components/pio-paywall"
import {
  buildEventCampaignPlan,
  type EventSharedFacts,
} from "@/lib/event-message-prompts"
import {
  deletePioEvent,
  daysUntil,
  formatEventDateLong,
  formatEventDateShort,
  formatTimeRange,
  getPioEventById,
  mapsSearchUrl,
  savePioEvent,
  type PioEvent,
  type PioEventPost,
} from "@/lib/pio-events-store"

const EVENT_TYPES = [
  "Community event",
  "Open house",
  "Education / training",
  "School program",
  "Town hall",
  "Recruitment",
  "Fundraiser",
  "Partner event",
  "Other",
]

const HOSTING_ROLES = [
  { value: "hosting", label: "We are hosting" },
  { value: "co_hosting", label: "We are co-hosting" },
  { value: "promoting", label: "We are promoting" },
  { value: "participating", label: "We are participating" },
] as const

type EditForm = {
  title: string
  description: string
  eventType: string
  hostingRole: string
  hostOrganization: string
  eventDate: string
  startTime: string
  endTime: string
  location: string
  address: string
  highlights: string[]
  contactEmail: string
  contactPhone: string
  audience: string
  parking: string
  registration: string
  website: string
}

function toEditForm(event: PioEvent): EditForm {
  return {
    title: event.title,
    description: event.description,
    eventType: event.eventType || "Community event",
    hostingRole: event.hostingRole || "hosting",
    hostOrganization: event.hostOrganization || "",
    eventDate: event.eventDate,
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    location: event.location,
    address: event.address || "",
    highlights: event.highlights ? [...event.highlights] : [],
    contactEmail: event.contactEmail || "",
    contactPhone: event.contactPhone || "",
    audience: event.audience || "",
    parking: event.parking || "",
    registration: event.registration || "",
    website: event.website || "",
  }
}

function hostingLabel(role?: string): string {
  return HOSTING_ROLES.find((r) => r.value === role)?.label || "We are hosting"
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

export default function EventDetailPage() {
  return (
    <PIOPaywall>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
          </div>
        }
      >
        <EventDetailInner />
      </Suspense>
    </PIOPaywall>
  )
}

function EventDetailInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = String(params.id || "")
  const router = useRouter()
  const { settings } = useAgency()

  const [event, setEvent] = useState<PioEvent | null>(null)
  const [editing, setEditing] = useState(searchParams.get("edit") === "1")
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [highlightDraft, setHighlightDraft] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    const found = getPioEventById(id)
    setEvent(found)
    if (found) {
      setEditForm(toEditForm(found))
    }
  }, [id])

  useEffect(() => {
    refresh()
  }, [refresh])

  const slots = useMemo(() => {
    if (!event) return []
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

  const postsByKey = useMemo(() => {
    const map = new Map<string, PioEventPost>()
    for (const p of event?.posts || []) {
      if (p.key) map.set(p.key, p)
    }
    return map
  }, [event])

  function updateEdit<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setEditForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  function saveEdits() {
    if (!event || !editForm) return
    if (!editForm.title.trim()) {
      setError("Event name is required.")
      return
    }
    if (
      editForm.hostingRole !== "hosting" &&
      !editForm.hostOrganization.trim()
    ) {
      setError("Add the host organization when you are not the sole host.")
      return
    }
    setError(null)
    const next: PioEvent = {
      ...event,
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      eventType: editForm.eventType,
      hostingRole: editForm.hostingRole,
      hostOrganization: editForm.hostOrganization.trim() || undefined,
      eventDate: editForm.eventDate,
      startTime: editForm.startTime,
      endTime: editForm.endTime || undefined,
      location: editForm.location.trim(),
      address: editForm.address.trim() || undefined,
      highlights: editForm.highlights,
      contactEmail: editForm.contactEmail.trim() || undefined,
      contactPhone: editForm.contactPhone.trim() || undefined,
      audience: editForm.audience.trim() || undefined,
      parking: editForm.parking.trim() || undefined,
      registration: editForm.registration.trim() || undefined,
      website: editForm.website.trim() || undefined,
    }
    savePioEvent(next)
    setEvent(next)
    setEditing(false)
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-16 text-center">
        <p className="font-semibold text-[#0f1c3f]">Event not found</p>
        <p className="text-sm text-[#7a8ab0]">
          It may have been deleted, or this link is from another browser.
        </p>
        <Button asChild className="bg-[#2563EB] hover:bg-[#1d4ed8]">
          <Link href="/pio-tool/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  const published = event.status === "generated" || event.posts.length > 0
  const cancelled = event.status === "cancelled"
  const rescheduled = event.status === "rescheduled"
  const timeLabel = formatTimeRange(event.startTime, event.endTime)
  const hostedBy =
    event.hostingRole === "hosting"
      ? settings.agencyName || "Your agency"
      : event.hostOrganization || settings.agencyName || "—"

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-12">
      <Link
        href="/pio-tool/events"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#2563EB]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      {error && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
              <CalendarDays className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[#0f1c3f]">{event.title}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    cancelled
                      ? "bg-[#FEE2E2] text-[#B91C1C]"
                      : rescheduled
                        ? "bg-[#DBEAFE] text-[#1D4ED8]"
                        : published
                          ? "bg-[#D1FAE5] text-[#047857]"
                          : "bg-[#F3F4F6] text-[#6b7280]"
                  }`}
                >
                  {cancelled
                    ? "Cancelled"
                    : rescheduled
                      ? "Rescheduled"
                      : published
                        ? "Published"
                        : "Draft"}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-1.5 text-sm text-[#64748b]">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                  {event.previousEventDate && rescheduled ? (
                    <span>
                      <span className="line-through opacity-60">
                        {formatEventDateLong(event.previousEventDate)}
                      </span>
                      <span className="mx-1.5" aria-hidden>
                        →
                      </span>
                      {formatEventDateLong(event.eventDate)}
                    </span>
                  ) : (
                    formatEventDateLong(event.eventDate)
                  )}
                </p>
                {timeLabel && (
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-[#94A3B8]" />
                    {timeLabel}
                  </p>
                )}
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#94A3B8]" />
                  <span>
                    {event.location}
                    {event.address ? ` | ${event.address}` : ""}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="More actions"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-[#e2e8f5] bg-white p-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    deletePioEvent(event.id)
                    router.push("/pio-tool/events")
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete event
                </button>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="border-[#FECACA] text-[#B91C1C] hover:bg-[#FEF2F2]"
              asChild
            >
              <Link href={`/pio-tool/events/${event.id}/cancel`}>Cancel</Link>
            </Button>
            <Button
              type="button"
              className="bg-[#2563EB] hover:bg-[#1d4ed8]"
              onClick={() => {
                setEditForm(toEditForm(event))
                setEditing(true)
                setMenuOpen(false)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Event
            </Button>
          </div>
        </div>
      </div>

      {editing && editForm ? (
        <div className="space-y-4 rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#0f1c3f]">Edit event details</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-title">Event name</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => updateEdit("title", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-description">About the event</Label>
              <Textarea
                id="edit-description"
                rows={4}
                value={editForm.description}
                onChange={(e) => updateEdit("description", e.target.value.slice(0, 500))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Event type</Label>
              <select
                id="edit-type"
                value={editForm.eventType}
                onChange={(e) => updateEdit("eventType", e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Agency role</Label>
              <select
                id="edit-role"
                value={editForm.hostingRole}
                onChange={(e) => updateEdit("hostingRole", e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {HOSTING_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {editForm.hostingRole !== "hosting" && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit-host">Host organization</Label>
                <Input
                  id="edit-host"
                  value={editForm.hostOrganization}
                  onChange={(e) => updateEdit("hostOrganization", e.target.value)}
                  className="h-11"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-date">Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={editForm.eventDate}
                onChange={(e) => updateEdit("eventDate", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-start">Start</Label>
                <Input
                  id="edit-start"
                  type="time"
                  value={editForm.startTime}
                  onChange={(e) => updateEdit("startTime", e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end">End</Label>
                <Input
                  id="edit-end"
                  type="time"
                  value={editForm.endTime}
                  onChange={(e) => updateEdit("endTime", e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editForm.location}
                onChange={(e) => updateEdit("location", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editForm.address}
                onChange={(e) => updateEdit("address", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-audience">Audience</Label>
              <Input
                id="edit-audience"
                value={editForm.audience}
                onChange={(e) => updateEdit("audience", e.target.value)}
                placeholder="Families, Residents, All Ages"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-parking">Parking</Label>
              <Input
                id="edit-parking"
                value={editForm.parking}
                onChange={(e) => updateEdit("parking", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-registration">Registration</Label>
              <Input
                id="edit-registration"
                value={editForm.registration}
                onChange={(e) => updateEdit("registration", e.target.value)}
                placeholder="No registration required"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-website">Website</Label>
              <Input
                id="edit-website"
                value={editForm.website}
                onChange={(e) => updateEdit("website", e.target.value)}
                placeholder="https://"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Contact email</Label>
              <Input
                id="edit-email"
                value={editForm.contactEmail}
                onChange={(e) => updateEdit("contactEmail", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Contact phone</Label>
              <Input
                id="edit-phone"
                value={editForm.contactPhone}
                onChange={(e) => updateEdit("contactPhone", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Highlights</Label>
              <div className="flex flex-wrap gap-2">
                {editForm.highlights.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() =>
                      updateEdit(
                        "highlights",
                        editForm.highlights.filter((x) => x !== h)
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold text-[#1D4ED8]"
                  >
                    {h}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={highlightDraft}
                  onChange={(e) => setHighlightDraft(e.target.value)}
                  placeholder="Add highlight"
                  className="h-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const tag = highlightDraft.trim()
                      if (!tag || editForm.highlights.includes(tag)) return
                      updateEdit("highlights", [...editForm.highlights, tag])
                      setHighlightDraft("")
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tag = highlightDraft.trim()
                    if (!tag || editForm.highlights.includes(tag)) return
                    updateEdit("highlights", [...editForm.highlights, tag])
                    setHighlightDraft("")
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#eef2f7] pt-4">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#2563EB] hover:bg-[#1d4ed8]"
              onClick={saveEdits}
            >
              Save changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left */}
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-[#0f1c3f]">Event Details</h2>
              <dl className="space-y-4 text-sm">
                <DetailRow icon={<FileText className="h-4 w-4" />} label="About the Event">
                  {event.description || "—"}
                </DetailRow>
                <DetailRow icon={<Users className="h-4 w-4" />} label="Audience">
                  {event.audience || "—"}
                </DetailRow>
                <DetailRow icon={<Users className="h-4 w-4" />} label="Hosted By">
                  <span>
                    {hostedBy}
                    <span className="mt-0.5 block text-xs text-[#94A3B8]">
                      {hostingLabel(event.hostingRole)}
                    </span>
                  </span>
                </DetailRow>
                <DetailRow icon={<Sparkles className="h-4 w-4" />} label="Event Type">
                  {event.eventType || "—"}
                </DetailRow>
                <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location">
                  <span>
                    {event.location}
                    {event.address ? (
                      <span className="mt-0.5 block text-[#64748b]">{event.address}</span>
                    ) : null}
                    <a
                      href={mapsSearchUrl(event.location, event.address)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      View on Map
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </span>
                </DetailRow>
                <DetailRow icon={<MapPin className="h-4 w-4" />} label="Parking">
                  {event.parking || "—"}
                </DetailRow>
                <DetailRow icon={<Check className="h-4 w-4" />} label="Registration">
                  {event.registration || "—"}
                </DetailRow>
                <DetailRow icon={<ExternalLink className="h-4 w-4" />} label="Website">
                  {event.website ? (
                    <a
                      href={event.website.startsWith("http") ? event.website : `https://${event.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-[#2563EB] hover:underline"
                    >
                      {event.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </DetailRow>
                <DetailRow icon={<Users className="h-4 w-4" />} label="Contact">
                  {[event.contactEmail, event.contactPhone].filter(Boolean).join(" · ") || "—"}
                </DetailRow>
                {(event.highlights?.length ?? 0) > 0 && (
                  <div>
                    <dt className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                      Highlights
                    </dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {event.highlights!.map((h) => (
                        <span
                          key={h}
                          className="rounded-full bg-[#DBEAFE] px-2.5 py-0.5 text-xs font-semibold text-[#1D4ED8]"
                        >
                          {h}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          </div>

          {/* Right */}
          <div className="space-y-5">
            {(cancelled || rescheduled) && (
              <section
                className={`rounded-2xl border bg-white p-5 shadow-sm ${
                  rescheduled ? "border-[#93c5fd]" : "border-[#FECACA]"
                }`}
              >
                <h2 className="mb-1 text-base font-bold text-[#0f1c3f]">
                  {rescheduled ? "Rescheduled" : "Cancelled"}
                </h2>
                {event.cancellationReason && (
                  <p className="mb-3 text-sm text-[#7a8ab0]">{event.cancellationReason}</p>
                )}
                <Button asChild variant="outline">
                  <Link href={`/pio-tool/events/${event.id}/cancel`}>
                    {event.posts.some((p) => p.key === "cancellation")
                      ? "View notice"
                      : "Draft notice"}
                  </Link>
                </Button>
              </section>
            )}

            {!cancelled && (
            <section className="rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-base font-bold text-[#0f1c3f]">
                Recommended Communications
              </h2>
              <p className="mb-4 text-sm text-[#7a8ab0]">
                Suggested messages based on your event date.
              </p>
              <ul className="divide-y divide-[#eef2f7]">
                {slots.map((slot) => {
                  const existing = postsByKey.get(slot.key)
                  const dueToday = slot.recommendedPostDate === todayYmd()
                  const past = slot.recommendedPostDate < todayYmd()
                  const { month, day } = formatEventDateShort(slot.recommendedPostDate)
                  return (
                    <li
                      key={slot.key}
                      className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex h-[52px] w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#F3F4F6] text-[#0f1c3f]">
                        <span className="text-[10px] font-bold tracking-wide text-[#6b7280]">
                          {month}
                        </span>
                        <span className="text-lg font-bold leading-none">{day}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#0f1c3f]">{slot.timingLabel}</p>
                        <p className="text-xs text-[#7a8ab0]">
                          {new Date(slot.recommendedPostDate + "T00:00:00").toLocaleDateString(
                            "en-US",
                            { weekday: "short", month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          dueToday
                            ? "bg-[#FEE2E2] text-[#B91C1C]"
                            : past
                              ? "bg-[#F3F4F6] text-[#6b7280]"
                              : "bg-[#DBEAFE] text-[#1D4ED8]"
                        }`}
                      >
                        {dueToday
                          ? "Due Today"
                          : past
                            ? "Past"
                            : daysUntil(slot.recommendedPostDate) === 1
                              ? "1 day"
                              : `${daysUntil(slot.recommendedPostDate)} days`}
                      </span>
                      {existing ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/pio-tool/events/${event.id}/generate?key=${slot.key}`}>
                            View
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" className="bg-[#2563EB] hover:bg-[#1d4ed8]">
                          <Link href={`/pio-tool/events/${event.id}/generate?key=${slot.key}`}>
                            Generate Message
                          </Link>
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
              <p className="mt-4 rounded-xl bg-[#EFF6FF] px-3 py-2.5 text-xs text-[#1e40af]">
                These are recommendations only. You choose what to generate and when.
              </p>
            </section>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-[#94A3B8]">{icon}</div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{label}</dt>
        <dd className="mt-0.5 text-[#0f1c3f]">{children}</dd>
      </div>
    </div>
  )
}
