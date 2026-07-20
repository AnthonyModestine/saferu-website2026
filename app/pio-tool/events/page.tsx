"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Loader2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Info,
  X,
  Search,
  Plus,
} from "lucide-react"
import { useAgency } from "@/lib/agency-context"
import { useSubscription } from "@/lib/use-subscription"
import { isLocalPreviewClient } from "@/lib/local-preview"
import { PIOPaywall } from "@/components/pio-paywall"
import {
  daysUntil,
  formatEventDateShort,
  getUpcomingPioEvents,
  savePioEvent,
  type PioEvent,
  type PioEventPost,
} from "@/lib/pio-events-store"
import {
  getEventTemplateById,
  saveEventTemplate,
} from "@/lib/pio-event-templates-store"
import {
  getCustomEventHighlights,
  saveCustomEventHighlight,
} from "@/lib/pio-custom-highlights-store"

const STEPS = [
  { id: 1, label: "Event Details" },
  { id: 2, label: "Review & Generate" },
] as const

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
  {
    value: "hosting",
    label: "We are hosting",
    hint: "This is our agency’s event.",
  },
  {
    value: "co_hosting",
    label: "We are co-hosting",
    hint: "We share hosting with another organization.",
  },
  {
    value: "promoting",
    label: "We are promoting",
    hint: "Someone else is hosting — we’re helping get the word out.",
  },
  {
    value: "participating",
    label: "We are participating",
    hint: "We’ll have a booth, apparatus, or presence at another event.",
  },
] as const

type HostingRole = (typeof HOSTING_ROLES)[number]["value"]

/** Grouped highlight options — shown in a dropdown, not as a chip wall. */
const HIGHLIGHT_GROUPS: { label: string; options: string[] }[] = [
  {
    label: "General",
    options: [
      "Free Food",
      "Kid Activities",
      "Family Friendly",
      "Giveaways",
      "Live Music",
      "Demonstrations",
      "Photo Opportunities",
      "Meet First Responders",
    ],
  },
  {
    label: "Police / Law Enforcement",
    options: [
      "Meet Officers",
      "Police Vehicle Display",
      "K-9 Demo",
      "Fingerprinting / Child ID",
      "Crime Prevention Tips",
      "Bicycle Safety / Helmets",
    ],
  },
  {
    label: "Fire / EMS",
    options: [
      "Meet Firefighters",
      "Meet EMS / Paramedics",
      "Fire Truck Tours",
      "Ambulance Display",
      "Smoke Detector Checks",
      "Carbon Monoxide Detector Info",
      "Fire Extinguisher Training",
      "Home Fire Escape Planning",
      "CPR / First Aid Booth",
      "Stop the Bleed Demo",
      "Extrication / Rescue Demo",
      "Live Fire Demo",
      "Smoke House / Safety Trailer",
      "Station Open House",
      "Car Seat Safety Check",
      "Emergency Preparedness Kits",
    ],
  },
]

type DraftForm = {
  title: string
  hostingRole: HostingRole
  hostOrganization: string
  eventType: string
  eventDate: string
  startTime: string
  endTime: string
  location: string
  address: string
  description: string
  highlights: string[]
  contactEmail: string
  contactPhone: string
  recurring: boolean
}

const EMPTY_FORM: DraftForm = {
  title: "",
  hostingRole: "hosting",
  hostOrganization: "",
  eventType: "Community event",
  eventDate: "",
  startTime: "",
  endTime: "",
  location: "",
  address: "",
  description: "",
  highlights: ["Family Friendly"],
  contactEmail: "",
  contactPhone: "",
  recurring: false,
}

/** Prefill for local testing so Generate can be clicked quickly. */
function demoForm(): DraftForm {
  const date = new Date()
  date.setDate(date.getDate() + 21)
  const eventDate = date.toISOString().slice(0, 10)
  return {
    title: "National Night Out 2026",
    hostingRole: "hosting",
    hostOrganization: "",
    eventType: "Community event",
    eventDate,
    startTime: "18:00",
    endTime: "21:00",
    location: "Municipal Park Pavilion",
    address: "100 Main Street, Demo Township, NJ 08000",
    description:
      "Join Demo Township Police for National Night Out. Meet officers, tour patrol vehicles, enjoy free food, and pick up home safety resources for the whole family.",
    highlights: ["Free Food", "Kid Activities", "Family Friendly", "Meet Officers", "Police Vehicle Display"],
    contactEmail: "pio@demotownshippd.gov",
    contactPhone: "(555) 555-0100",
    recurring: false,
  }
}

function initialCreateForm(hasTemplate: boolean): DraftForm {
  if (hasTemplate) return EMPTY_FORM
  if (isLocalPreviewClient()) return demoForm()
  return EMPTY_FORM
}

export default function EventsPage() {
  return (
    <PIOPaywall>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2563EB] border-t-transparent" />
          </div>
        }
      >
        <EventsPageInner />
      </Suspense>
    </PIOPaywall>
  )
}

function EventsPageInner() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("new") === "1" ? "create" : "list"
  if (mode === "create") return <CreateEventWizard />
  return <EventsListView />
}

function CreateEventWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get("template")
  const { settings } = useAgency()
  const { isSubscribed } = useSubscription()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<DraftForm>(() => initialCreateForm(Boolean(templateId)))
  const [highlightInput, setHighlightInput] = useState("")
  const [customHighlights, setCustomHighlights] = useState<string[]>([])
  const [showCustomHighlight, setShowCustomHighlight] = useState(false)
  const [highlightQuery, setHighlightQuery] = useState("")
  const [highlightTab, setHighlightTab] = useState<string>("general")
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templateSavedNote, setTemplateSavedNote] = useState(false)

  useEffect(() => {
    setCustomHighlights(getCustomEventHighlights())
  }, [])

  useEffect(() => {
    if (settings.agencyType === "fire" || settings.agencyType === "ems") {
      setHighlightTab("Fire / EMS")
    } else if (
      settings.agencyType === "police" ||
      settings.agencyType === "sheriff" ||
      settings.agencyType === "state_police"
    ) {
      setHighlightTab("Police / Law Enforcement")
    } else {
      setHighlightTab("General")
    }
  }, [settings.agencyType])

  const highlightTabs = useMemo(() => {
    const tabs = HIGHLIGHT_GROUPS.map((g) => g.label)
    if (customHighlights.length > 0) tabs.unshift("Saved by you")
    return tabs
  }, [customHighlights.length])

  const highlightOptionsForTab = useMemo(() => {
    const q = highlightQuery.trim().toLowerCase()
    let options: string[] = []
    if (highlightTab === "Saved by you") {
      options = customHighlights
    } else {
      options = HIGHLIGHT_GROUPS.find((g) => g.label === highlightTab)?.options ?? []
    }
    if (!q) return options
    return options.filter((o) => o.toLowerCase().includes(q))
  }, [highlightTab, highlightQuery, customHighlights])

  useEffect(() => {
    if (!templateId) return
    const t = getEventTemplateById(templateId)
    if (!t) return
    setForm({
      title: t.title,
      hostingRole: (t.hostingRole as HostingRole) || "hosting",
      hostOrganization: t.hostOrganization || "",
      eventType:
        t.eventType && EVENT_TYPES.includes(t.eventType)
          ? t.eventType
          : EMPTY_FORM.eventType,
      eventDate: "",
      startTime: t.startTime || "",
      endTime: t.endTime || "",
      location: t.location,
      address: t.address || "",
      description: t.description,
      highlights: t.highlights?.length ? [...t.highlights] : [],
      contactEmail: t.contactEmail || "",
      contactPhone: t.contactPhone || "",
      recurring: true,
    })
  }, [templateId])

  function update<K extends keyof DraftForm>(key: K, value: DraftForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function persistRecurringTemplateIfNeeded() {
    if (!form.recurring) return
    saveEventTemplate({
      title: form.title.trim() || "Untitled event",
      description: form.description.trim(),
      location: form.location.trim(),
      address: form.address.trim(),
      startTime: form.startTime,
      endTime: form.endTime || undefined,
      eventType: form.eventType,
      highlights: form.highlights,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      hostingRole: form.hostingRole,
      hostOrganization: form.hostOrganization.trim() || undefined,
      id: templateId || undefined,
    })
    setTemplateSavedNote(true)
  }

  function toggleHighlight(value: string) {
    const tag = value.trim()
    if (!tag) return
    setForm((prev) => ({
      ...prev,
      highlights: prev.highlights.includes(tag)
        ? prev.highlights.filter((h) => h !== tag)
        : [...prev.highlights, tag],
    }))
  }

  function addHighlight(value: string) {
    const tag = value.trim()
    if (!tag || form.highlights.includes(tag)) return
    update("highlights", [...form.highlights, tag])
    setHighlightInput("")
    setShowCustomHighlight(false)
  }

  function addAndSaveCustomHighlight() {
    const tag = highlightInput.trim()
    if (!tag) return
    const saved = saveCustomEventHighlight(tag)
    setCustomHighlights(saved)
    addHighlight(tag)
  }

  function removeHighlight(tag: string) {
    update(
      "highlights",
      form.highlights.filter((h) => h !== tag)
    )
  }

  function validateStep1(): string | null {
    if (!form.title.trim()) return "Event name is required."
    if (!form.eventDate) return "Event date is required."
    if (!form.location.trim()) return "Location is required."
    if (
      form.hostingRole !== "hosting" &&
      !form.hostOrganization.trim()
    ) {
      return "Add the host organization name when you are not the sole host."
    }
    if (!form.description.trim() || form.description.trim().length < 20) {
      return "Add a short description (at least 20 characters)."
    }
    return null
  }

  function goNext() {
    setError(null)
    if (step === 1) {
      const err = validateStep1()
      if (err) {
        setError(err)
        return
      }
    }
    setStep((s) => Math.min(2, s + 1))
  }

  function saveDraft() {
    const now = new Date().toISOString()
    const event: PioEvent = {
      id: crypto.randomUUID(),
      title: form.title.trim() || "Untitled event",
      description: form.description.trim(),
      location: form.location.trim(),
      address: form.address.trim(),
      eventDate: form.eventDate || now.slice(0, 10),
      startTime: form.startTime,
      endTime: form.endTime || undefined,
      eventType: form.eventType,
      highlights: form.highlights,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      recurring: form.recurring,
      hostingRole: form.hostingRole,
      hostOrganization: form.hostOrganization.trim() || undefined,
      status: "draft",
      posts: [],
      createdAt: now,
      updatedAt: now,
    }
    savePioEvent(event)
    persistRecurringTemplateIfNeeded()
    router.push(`/pio-tool/events/${event.id}`)
  }

  async function generateContent() {
    setError(null)
    const err = validateStep1()
    if (err) {
      setStep(1)
      setError(err)
      return
    }
    setGenerating(true)
    try {
      const res = await fetch("/api/pio/generate-event-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: settings.agencyName || "Demo Township Police Department",
          organizationType: settings.agencyType || "law enforcement",
          title: form.title,
          description: form.description,
          location: form.location,
          address: form.address,
          eventDate: form.eventDate,
          startTime: form.startTime,
          endTime: form.endTime || undefined,
          eventType: form.eventType,
          highlights: form.highlights,
          contactEmail: form.contactEmail,
          contactPhone: form.contactPhone,
          recurring: form.recurring,
          hostingRole: form.hostingRole,
          hostOrganization: form.hostOrganization.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to generate content.")
        return
      }
      if (data.status === "needs_human_review") {
        setError(
          data.humanReviewReason ||
            "SaferU could not safely approve this campaign. Review the event details and try again."
        )
        return
      }

      const posts: PioEventPost[] = (data.posts as Array<Partial<PioEventPost>>).map((p) => ({
        id: crypto.randomUUID(),
        key: p.key,
        postDate: String(p.postDate || ""),
        postTime: p.postTime,
        timingLabel: String(p.timingLabel || ""),
        campaignStage: p.campaignStage,
        strategicPurpose: p.strategicPurpose,
        timeUntilEvent: p.timeUntilEvent,
        channel: (p.channel as PioEventPost["channel"]) || "Facebook",
        postTitle: p.postTitle,
        message: String(p.message || ""),
        callToAction: p.callToAction,
        suggestedImage: p.suggestedImage,
        detailsToVerify: p.detailsToVerify,
        qualityStatus: p.qualityStatus,
        tag: p.tag || form.title.trim(),
      }))
      const now = new Date().toISOString()
      const event: PioEvent = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        address: form.address.trim(),
        eventDate: form.eventDate,
        startTime: form.startTime,
        endTime: form.endTime || undefined,
        eventType: form.eventType,
        highlights: form.highlights,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
        recurring: form.recurring,
        hostingRole: form.hostingRole,
        hostOrganization: form.hostOrganization.trim() || undefined,
        status: "generated",
        posts,
        createdAt: now,
        updatedAt: now,
      }
      savePioEvent(event)
      persistRecurringTemplateIfNeeded()
      router.push(`/pio-tool/events/${event.id}`)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[#7a8ab0]">
        <Link href="/pio-tool" className="hover:text-[#2563EB]">
          Dashboard
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/pio-tool/events" className="hover:text-[#2563EB]">
          Community Events
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-[#0f1c3f]">Create Event</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#10B981]">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f1c3f]">Create Community Event</h1>
            <p className="mt-1 text-sm text-[#667795]">
              Promote an event you host — or one you&apos;re supporting, co-hosting, or attending
              with another organization.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={saveDraft}
            className="border-[#d5def0] bg-white"
          >
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={generateContent}
            disabled={generating || !isSubscribed}
            className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>Generate Content →</>
            )}
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e2e8f5] bg-white px-4 py-3 shadow-sm">
        {STEPS.map((s, i) => {
          const active = step === s.id
          const done = step > s.id
          return (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && <div className="mx-1 hidden h-px w-6 bg-[#e2e8f5] sm:block" />}
              <button
                type="button"
                onClick={() => setStep(s.id)}
                className="flex items-center gap-2 rounded-full px-1 py-1 text-left"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    active
                      ? "bg-[#10B981] text-white"
                      : done
                        ? "bg-[#D1FAE5] text-[#047857]"
                        : "bg-[#F3F4F6] text-[#6b7280]"
                  }`}
                >
                  {s.id}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    active ? "text-[#10B981]" : done ? "text-[#047857]" : "text-[#6b7280]"
                  }`}
                >
                  {s.label}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-[#e2e8f5] bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-[#0f1c3f]">Event Details</h2>
              <p className="mt-1 text-sm text-[#7a8ab0]">
                Provide the basic information about your event.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Event Name</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="National Night Out 2025"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hostingRole">Agency role</Label>
              <select
                id="hostingRole"
                value={form.hostingRole}
                onChange={(e) => update("hostingRole", e.target.value as HostingRole)}
                className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {HOSTING_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[#7a8ab0]">
                {HOSTING_ROLES.find((r) => r.value === form.hostingRole)?.hint}
              </p>
            </div>

            {form.hostingRole !== "hosting" && (
              <div className="space-y-2">
                <Label htmlFor="hostOrganization">Host organization</Label>
                <Input
                  id="hostOrganization"
                  value={form.hostOrganization}
                  onChange={(e) => update("hostOrganization", e.target.value)}
                  placeholder="e.g. Township Parks & Recreation, Local school district, Fire prevention coalition"
                  className="h-11"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="eventType">Event type</Label>
              <select
                id="eventType"
                value={
                  EVENT_TYPES.includes(form.eventType)
                    ? form.eventType
                    : EVENT_TYPES[0]
                }
                onChange={(e) => update("eventType", e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => update("eventDate", e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <Input
                    id="startTime"
                    type="time"
                    value={form.startTime}
                    onChange={(e) => update("startTime", e.target.value)}
                    className="h-11 pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <Input
                    id="endTime"
                    type="time"
                    value={form.endTime}
                    onChange={(e) => update("endTime", e.target.value)}
                    className="h-11 pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="Central Park Pavilion"
                className="h-11"
              />
              <Input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Full street address (optional)"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => update("description", e.target.value.slice(0, 500))}
                rows={5}
                placeholder="Share what the community should know about this event…"
              />
              <p className="text-right text-xs text-[#94A3B8]">{form.description.length}/500</p>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Event Highlights</Label>
                <p className="mt-1 text-xs text-[#7a8ab0]">
                  Tap options to select or unselect. Use categories or search to find what you need.
                </p>
              </div>

              {form.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.highlights.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeHighlight(tag)}
                      className="inline-flex items-center gap-1 rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold text-[#1D4ED8]"
                    >
                      {tag}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-[#e2e8f5] bg-white">
                <div className="flex gap-1 overflow-x-auto border-b border-[#eef2f7] bg-[#F8FAFC] p-2">
                  {highlightTabs.map((tab) => {
                    const active = highlightTab === tab
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setHighlightTab(tab)}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          active
                            ? "bg-[#2563EB] text-white shadow-sm"
                            : "text-[#64748b] hover:bg-white hover:text-[#0f1c3f]"
                        }`}
                      >
                        {tab === "Police / Law Enforcement"
                          ? "Police"
                          : tab === "Fire / EMS"
                            ? "Fire / EMS"
                            : tab === "Saved by you"
                              ? "Saved"
                              : tab}
                      </button>
                    )
                  })}
                </div>

                <div className="relative border-b border-[#eef2f7] p-2">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <Input
                    value={highlightQuery}
                    onChange={(e) => setHighlightQuery(e.target.value)}
                    placeholder={`Search ${highlightTab === "Saved by you" ? "saved" : highlightTab.toLowerCase()} highlights…`}
                    className="h-10 border-0 bg-[#F8FAFC] pl-9 shadow-none focus-visible:ring-0"
                  />
                </div>

                <div className="grid max-h-56 gap-2 overflow-y-auto p-3 sm:grid-cols-2">
                  {highlightOptionsForTab.length === 0 ? (
                    <p className="col-span-full py-6 text-center text-sm text-[#94A3B8]">
                      No matches. Try another category or add a custom highlight.
                    </p>
                  ) : (
                    highlightOptionsForTab.map((opt) => {
                      const selected = form.highlights.includes(opt)
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleHighlight(opt)}
                          aria-pressed={selected}
                          className={`flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                            selected
                              ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]"
                              : "border-[#e2e8f5] bg-white text-[#0f1c3f] hover:border-[#93c5fd]"
                          }`}
                        >
                          <span
                            aria-hidden
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
                              selected
                                ? "border-[#2563EB] bg-[#2563EB] text-white"
                                : "border-input bg-white"
                            }`}
                          >
                            {selected ? <Check className="h-3 w-3" /> : null}
                          </span>
                          <span className="leading-snug">{opt}</span>
                        </button>
                      )
                    })
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-[#eef2f7] px-3 py-2">
                  <p className="text-xs text-[#7a8ab0]">
                    {form.highlights.length} selected
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[#2563EB]"
                    onClick={() => setShowCustomHighlight((v) => !v)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Custom
                  </Button>
                </div>
              </div>

              {showCustomHighlight && (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    placeholder="Custom highlight"
                    className="h-10 flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addAndSaveCustomHighlight()
                      }
                      if (e.key === "Escape") {
                        setShowCustomHighlight(false)
                        setHighlightInput("")
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-10 bg-[#2563EB] hover:bg-[#1d4ed8]"
                    disabled={!highlightInput.trim()}
                    onClick={addAndSaveCustomHighlight}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => update("contactEmail", e.target.value)}
                  placeholder="pio@agency.gov"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={form.contactPhone}
                  onChange={(e) => update("contactPhone", e.target.value)}
                  placeholder="(555) 555-0100"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm text-[#405172]">
                <Checkbox
                  checked={form.recurring}
                  onCheckedChange={(v) => {
                    const on = v === true
                    update("recurring", on)
                    if (on && form.title.trim() && form.location.trim()) {
                      saveEventTemplate({
                        title: form.title.trim(),
                        description: form.description.trim(),
                        location: form.location.trim(),
                        address: form.address.trim(),
                        startTime: form.startTime,
                        endTime: form.endTime || undefined,
                        eventType: form.eventType,
                        highlights: form.highlights,
                        contactEmail: form.contactEmail,
                        contactPhone: form.contactPhone,
                        hostingRole: form.hostingRole,
                        hostOrganization: form.hostOrganization.trim() || undefined,
                        id: templateId || undefined,
                      })
                      setTemplateSavedNote(true)
                    }
                  }}
                />
                This is a recurring event
                <Info className="h-3.5 w-3.5 text-[#94A3B8]" />
              </label>
              <p className="pl-6 text-xs text-[#7a8ab0]">
                When checked, this event is saved under{" "}
                <Link href="/pio-tool/templates" className="font-semibold text-[#2563EB] hover:underline">
                  Templates
                </Link>{" "}
                so you can reuse it later.
              </p>
              {templateSavedNote && (
                <p className="pl-6 text-xs font-medium text-[#047857]">
                  Saved to Templates.
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#0f1c3f]">Review & Generate</h2>
              <p className="mt-1 text-sm text-[#7a8ab0]">
                Confirm the details, then generate posting dates and messages.
              </p>
            </div>
            <dl className="grid gap-3 rounded-xl bg-[#F8FAFC] p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#7a8ab0]">Event</dt>
                <dd className="font-semibold text-[#0f1c3f]">{form.title || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#7a8ab0]">Our role</dt>
                <dd className="font-semibold text-[#0f1c3f]">
                  {HOSTING_ROLES.find((r) => r.value === form.hostingRole)?.label || "Hosting"}
                  {form.hostOrganization.trim() ? ` · Host: ${form.hostOrganization}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[#7a8ab0]">When</dt>
                <dd className="font-semibold text-[#0f1c3f]">
                  {form.eventDate || "—"}
                  {form.startTime ? ` · ${form.startTime}` : ""}
                  {form.endTime ? `–${form.endTime}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-[#7a8ab0]">Where</dt>
                <dd className="font-semibold text-[#0f1c3f]">{form.location || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#7a8ab0]">Type</dt>
                <dd className="font-semibold text-[#0f1c3f]">
                  {form.eventType}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[#7a8ab0]">Highlights</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {form.highlights.length === 0 ? (
                    <span className="text-[#0f1c3f]">—</span>
                  ) : (
                    form.highlights.map((h) => (
                      <span
                        key={h}
                        className="rounded-full bg-[#DBEAFE] px-2.5 py-0.5 text-xs font-semibold text-[#1D4ED8]"
                      >
                        {h}
                      </span>
                    ))
                  )}
                </dd>
              </div>
            </dl>
            <Button
              type="button"
              onClick={generateContent}
              disabled={generating || !isSubscribed}
              className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating content…
                </>
              ) : (
                <>Generate Content →</>
              )}
            </Button>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-[#eef2f7] pt-5">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Back
          </Button>
          {step < 2 ? (
            <Button
              type="button"
              onClick={goNext}
              className="bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
            >
              Next →
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={saveDraft}>
              Save Draft
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function EventsListView() {
  const [events, setEvents] = useState<PioEvent[]>([])

  useEffect(() => {
    setEvents(getUpcomingPioEvents())
  }, [])

  const groups = useMemo(() => {
    const map = new Map<string, PioEvent[]>()
    for (const event of events) {
      const d = new Date(event.eventDate + "T00:00:00")
      const key = Number.isNaN(d.getTime())
        ? "Upcoming"
        : d.toLocaleString("en-US", { month: "long", year: "numeric" })
      const list = map.get(key) || []
      list.push(event)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [events])

  function statusBadge(event: PioEvent) {
    const published = event.status === "generated" || event.posts.length > 0
    const cancelled = event.status === "cancelled"
    const rescheduled = event.status === "rescheduled"
    if (cancelled) return { label: "Cancelled", className: "bg-[#FEE2E2] text-[#B91C1C]" }
    if (rescheduled) return { label: "Rescheduled", className: "bg-[#DBEAFE] text-[#1D4ED8]" }
    if (published) return { label: "Published", className: "bg-[#D1FAE5] text-[#047857]" }
    return { label: "Draft", className: "bg-[#F3F4F6] text-[#6b7280]" }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1c3f]">Events</h1>
          <p className="mt-1 text-sm text-[#667795]">
            Upcoming community events, grouped by month.
          </p>
        </div>
        <Button asChild className="bg-[#2563EB] hover:bg-[#1d4ed8]">
          <Link href="/pio-tool/events?new=1">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c7d2e5] bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#ECFDF5] text-[#10B981]">
            <CalendarDays className="h-6 w-6" />
          </div>
          <p className="font-semibold text-[#0f1c3f]">No upcoming events yet</p>
          <p className="mt-1 text-sm text-[#7a8ab0]">
            Create an event to generate posting dates and messages.
          </p>
          <Button asChild className="mt-4 bg-[#2563EB] hover:bg-[#1d4ed8]">
            <Link href="/pio-tool/events?new=1">Create Community Event</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([monthLabel, monthEvents]) => (
            <section key={monthLabel} className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#94A3B8]">
                {monthLabel}
              </h2>
              <ul className="space-y-3">
                {monthEvents.map((event) => {
                  const { month, day } = formatEventDateShort(event.eventDate)
                  const away = daysUntil(event.eventDate)
                  const badge = statusBadge(event)
                  return (
                    <li key={event.id}>
                      <Link
                        href={`/pio-tool/events/${event.id}`}
                        className="flex w-full gap-3 rounded-xl border border-[#e2e8f5] bg-white p-4 text-left transition-colors hover:border-[#2563EB]/40 hover:bg-[#F8FAFC]"
                      >
                        <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#F3F4F6] text-[#0f1c3f]">
                          <span className="text-[10px] font-bold tracking-wide text-[#6b7280]">
                            {month}
                          </span>
                          <span className="text-lg font-bold leading-none">{day}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold text-[#0f1c3f]">{event.title}</p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                            >
                              {badge.label}
                            </span>
                          </div>
                          <p className="truncate text-sm text-[#6b7c9c]">{event.location}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-xs font-medium text-[#1D4ED8]">
                              {away === 0
                                ? "Today"
                                : away === 1
                                  ? "Tomorrow"
                                  : `${away} days away`}
                            </span>
                            <span className="text-xs text-[#7a8ab0]">
                              {event.posts.length} message
                              {event.posts.length === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="mt-4 h-5 w-5 shrink-0 text-[#94A3B8]" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

