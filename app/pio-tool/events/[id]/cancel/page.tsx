"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Check, Copy, Loader2 } from "lucide-react"
import { useAgency } from "@/lib/agency-context"
import { useSubscription } from "@/lib/use-subscription"
import { PIOPaywall } from "@/components/pio-paywall"
import {
  formatEventDateLong,
  getPioEventById,
  mergeEventPosts,
  savePioEvent,
  type PioEvent,
  type PioEventPost,
} from "@/lib/pio-events-store"

type SocialChannel = "Facebook" | "X"

const CHANNELS: SocialChannel[] = ["Facebook", "X"]

export default function CancelEventPage() {
  return (
    <PIOPaywall>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#2563EB]" />
          </div>
        }
      >
        <CancelEventInner />
      </Suspense>
    </PIOPaywall>
  )
}

function CancelEventInner() {
  const params = useParams()
  const id = String(params.id || "")
  const { settings } = useAgency()
  const { isSubscribed } = useSubscription()

  const [event, setEvent] = useState<PioEvent | null>(null)
  const [reason, setReason] = useState("")
  const [newEventDate, setNewEventDate] = useState("")
  const [channel, setChannel] = useState<SocialChannel>("Facebook")
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const skipAutosave = useRef(true)
  /** Fingerprint of reason+date last used to generate per channel — never auto-generate. */
  const [generatedFor, setGeneratedFor] = useState<Partial<Record<SocialChannel, string>>>({})

  const refresh = useCallback(() => {
    const found = getPioEventById(id)
    setEvent(found)
    if (found?.cancellationReason) setReason(found.cancellationReason)
    if (found?.status === "rescheduled" && found.eventDate) {
      setNewEventDate(found.eventDate)
    }
    setHydrated(true)
    skipAutosave.current = true
  }, [id])

  useEffect(() => {
    refresh()
  }, [refresh])

  const isReschedule = Boolean(newEventDate && /^\d{4}-\d{2}-\d{2}$/.test(newEventDate))
  const inputFingerprint = `${reason.trim()}|${newEventDate}`

  const existingPost = useMemo(() => {
    if (!event) return null
    return (
      event.posts.find((p) => p.key === "cancellation" && p.channel === channel) || null
    )
  }, [event, channel])

  // Assume existing posts match current inputs until the user edits reason/date
  useEffect(() => {
    if (!hydrated || !event) return
    const next: Partial<Record<SocialChannel, string>> = {}
    for (const c of CHANNELS) {
      const has = event.posts.some((p) => p.key === "cancellation" && p.channel === c)
      if (has) next[c] = inputFingerprint
    }
    setGeneratedFor(next)
    // only on hydrate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, event?.id])

  const messageOutOfDate =
    Boolean(existingPost) && generatedFor[channel] !== inputFingerprint

  function persistStatus(reasonText: string, nextDate: string, posts?: PioEventPost[]) {
    if (!event) return null
    const hasNewDate = Boolean(nextDate && /^\d{4}-\d{2}-\d{2}$/.test(nextDate))
    const originalDate = event.previousEventDate || event.eventDate
    const next: PioEvent = {
      ...event,
      posts: posts ?? [...event.posts],
      cancellationReason: reasonText.trim(),
      status: hasNewDate ? "rescheduled" : "cancelled",
      previousEventDate: hasNewDate ? originalDate : event.previousEventDate,
      eventDate: hasNewDate ? nextDate : event.eventDate,
    }
    savePioEvent(next)
    setEvent(next)
    return next
  }

  // Auto-save reason + optional new date (no Save button)
  useEffect(() => {
    if (!hydrated || !id) return
    if (skipAutosave.current) {
      skipAutosave.current = false
      return
    }

    const trimmed = reason.trim()
    const current = getPioEventById(id)
    if (!current) return

    const alreadyMarked =
      current.status === "cancelled" || current.status === "rescheduled"
    if (!alreadyMarked && trimmed.length < 5) return
    if (alreadyMarked && trimmed.length < 1) return
    if (newEventDate && !/^\d{4}-\d{2}-\d{2}$/.test(newEventDate)) return

    const timer = window.setTimeout(() => {
      const latest = getPioEventById(id)
      if (!latest) return
      const hasNewDate = Boolean(newEventDate && /^\d{4}-\d{2}-\d{2}$/.test(newEventDate))
      const originalDate = latest.previousEventDate || latest.eventDate
      const next: PioEvent = {
        ...latest,
        posts: [...latest.posts],
        cancellationReason: trimmed,
        status: hasNewDate ? "rescheduled" : "cancelled",
        previousEventDate: hasNewDate ? originalDate : latest.previousEventDate,
        eventDate: hasNewDate ? newEventDate : latest.eventDate,
      }
      if (
        next.cancellationReason === latest.cancellationReason &&
        next.status === latest.status &&
        next.eventDate === latest.eventDate &&
        next.previousEventDate === latest.previousEventDate
      ) {
        return
      }
      savePioEvent(next)
      setEvent(next)
    }, 400)

    return () => window.clearTimeout(timer)
  }, [hydrated, id, reason, newEventDate])

  async function generateNotice() {
    if (!event || !isSubscribed || generating) return
    const trimmed = reason.trim()
    if (trimmed.length < 5) {
      setError("Add a short reason (at least 5 characters).")
      return
    }
    if (newEventDate && !/^\d{4}-\d{2}-\d{2}$/.test(newEventDate)) {
      setError("Enter a valid new date, or leave it blank.")
      return
    }
    const kind = isReschedule ? "reschedule" : "cancellation"
    const confirmMsg = existingPost
      ? `Generate a new ${channel} ${kind} message? This replaces the saved one and uses 1 credit.`
      : `Generate a ${channel} ${kind} message? Uses 1 credit.`
    if (!window.confirm(confirmMsg)) return

    setGenerating(true)
    setError(null)
    try {
      const originalDate = event.previousEventDate || event.eventDate
      persistStatus(trimmed, newEventDate)

      const res = await fetch("/api/pio/generate-event-cancellation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: settings.agencyName || "Demo Township Police Department",
          organizationType: settings.agencyType || "law enforcement",
          title: event.title,
          description: event.description,
          location: event.location,
          address: event.address,
          eventDate: originalDate,
          newEventDate: isReschedule ? newEventDate : undefined,
          startTime: event.startTime,
          endTime: event.endTime,
          hostingRole: event.hostingRole,
          hostOrganization: event.hostOrganization,
          cancellationReason: trimmed,
          channel,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to generate message.")
        return
      }

      const p = data.post as Partial<PioEventPost>
      const incoming: PioEventPost = {
        id: crypto.randomUUID(),
        key: "cancellation",
        postDate: String(p.postDate || new Date().toISOString().slice(0, 10)),
        postTime: p.postTime,
        timingLabel: String(
          p.timingLabel || (isReschedule ? "Reschedule Notice" : "Cancellation Notice")
        ),
        channel,
        postTitle: p.postTitle,
        message: String(p.message || ""),
        callToAction: p.callToAction,
        suggestedImage: p.suggestedImage,
        detailsToVerify: p.detailsToVerify,
        tag: event.title,
      }

      const latest = getPioEventById(event.id) || event
      const next: PioEvent = {
        ...latest,
        posts: mergeEventPosts(latest.posts, [incoming]),
        status: isReschedule ? "rescheduled" : "cancelled",
        cancellationReason: trimmed,
        previousEventDate: isReschedule
          ? latest.previousEventDate || originalDate
          : latest.previousEventDate,
        eventDate: isReschedule ? newEventDate : latest.eventDate,
      }
      savePioEvent(next)
      setEvent(next)
      setGeneratedFor((prev) => ({ ...prev, [channel]: `${trimmed}|${newEventDate}` }))
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  async function copyMessage() {
    if (!existingPost?.message) return
    try {
      await navigator.clipboard.writeText(existingPost.message)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
        <p className="font-semibold text-[#0f1c3f]">Event not found</p>
        <Button asChild className="bg-[#2563EB] hover:bg-[#1d4ed8]">
          <Link href="/pio-tool/events">Back to Events</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-12">
      <Link
        href={`/pio-tool/events/${event.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748b] hover:text-[#2563EB]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[#0f1c3f]">Cancel or reschedule</h1>
        <p className="mt-1 text-sm text-[#7a8ab0]">
          {event.title} · {formatEventDateLong(event.eventDate)}
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-5 rounded-2xl border border-[#e2e8f5] bg-white p-5 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Reason</Label>
          <Textarea
            id="cancel-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 1000))}
            placeholder="e.g. Severe weather — event moved to a new date."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-event-date">New date (optional)</Label>
          <Input
            id="new-event-date"
            type="date"
            value={newEventDate}
            onChange={(e) => setNewEventDate(e.target.value)}
            className="h-11"
          />
          <p className="text-xs text-[#7a8ab0]">
            Add a date to reschedule. Existing posts are kept. Reason saves automatically —
            messages only update when you click Generate Message.
          </p>
        </div>

        <div className="flex gap-2">
          {CHANNELS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setChannel(c)
                setError(null)
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                channel === c
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]"
                  : "border-[#e2e8f5] text-[#64748b] hover:border-[#93c5fd]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {existingPost ? (
          <div
            className={`rounded-xl border bg-[#F8FAFC] p-4 ${
              messageOutOfDate ? "border-amber-300" : "border-[#e2e8f5]"
            }`}
          >
            {channel === "Facebook" && existingPost.postTitle && (
              <p className="mb-2 text-sm font-bold text-[#0f1c3f]">{existingPost.postTitle}</p>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#405172]">
              {existingPost.message}
            </p>
            {channel === "X" && (
              <p className="mt-2 text-right text-xs text-[#94A3B8]">
                {existingPost.message.length}/280
              </p>
            )}
            {messageOutOfDate && (
              <p className="mt-3 text-xs font-medium text-amber-700">
                Reason or date changed. Click Generate Message to update this {channel} post.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#7a8ab0]">
            No {channel} message yet. Click Generate Message when you’re ready (uses 1 credit).
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {existingPost && (
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
          )}
          <Button
            type="button"
            className="bg-[#2563EB] hover:bg-[#1d4ed8]"
            disabled={generating || !isSubscribed}
            onClick={() => void generateNotice()}
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
      </div>
    </div>
  )
}
