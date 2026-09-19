import "server-only"

import type { ExternalOpportunityInput } from "./types"

type ModelEvent = {
  title?: string
  summary?: string
  whyItMatters?: string
  recommendedAction?: string
  recommendedPostTiming?: string
  category?: string
  eventDate?: string
  location?: string
  sourceName?: string
  sourceUrl?: string
  verifiedFacts?: string[]
  publicCallToAction?: string[]
  signals?: string[]
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)
}

function safeUrl(value: unknown): string | undefined {
  const raw = String(value || "").trim()
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export function parseDiscoveredEvents(
  events: unknown[] | undefined,
  opts: {
    today: string
    needed: number
    idPrefix: string
    defaultCategory: string
    defaultSignals: string[]
    defaultSourceLabel: ExternalOpportunityInput["sourceLabel"]
  }
): ExternalOpportunityInput[] {
  if (!Array.isArray(events)) return []

  const now = new Date(`${opts.today}T00:00:00`).getTime()
  const minDate = now - 3 * 24 * 60 * 60 * 1000
  const maxDate = now + 7 * 24 * 60 * 60 * 1000
  const opportunities: ExternalOpportunityInput[] = []

  for (const entry of events) {
    const event = entry as ModelEvent
    const title = String(event.title || "").trim()
    const sourceUrl = safeUrl(event.sourceUrl)
    const eventDate = String(event.eventDate || opts.today).trim() || opts.today
    const eventTime = new Date(`${eventDate}T00:00:00`).getTime()
    if (!title || !sourceUrl || Number.isNaN(eventTime) || eventTime < minDate || eventTime > maxDate) {
      continue
    }

    const facts = Array.isArray(event.verifiedFacts)
      ? event.verifiedFacts.map(String).map((v) => v.trim()).filter(Boolean).slice(0, 5)
      : []
    if (!facts.length) continue

    const signals = Array.isArray(event.signals)
      ? event.signals
          .map(String)
          .map((v) => v.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""))
          .filter(Boolean)
          .slice(0, 6)
      : opts.defaultSignals

    opportunities.push({
      id: `${opts.idPrefix}-${eventDate}-${slug(title)}`,
      title,
      summary: String(event.summary || facts[0]).trim(),
      category: String(event.category || opts.defaultCategory).trim(),
      sourceLabel: opts.defaultSourceLabel,
      whyItMatters: String(
        event.whyItMatters ||
          `${title} is a verified update relevant to residents in the service area.`
      ).trim(),
      recommendedAction: String(
        event.recommendedAction || "Share the verified update in a calm community voice."
      ).trim(),
      recommendedPostTiming: String(
        event.recommendedPostTiming || "Post today while the update is still timely."
      ).trim(),
      priority: "recommended_today",
      signals: signals.length ? signals : opts.defaultSignals,
      sourceName: String(event.sourceName || "Local civic source").trim(),
      sourceUrl,
      eventStart: eventDate,
      eventEnd: eventDate,
      verifiedFacts: facts,
      publicCallToAction: Array.isArray(event.publicCallToAction)
        ? event.publicCallToAction.map(String).map((v) => v.trim()).filter(Boolean).slice(0, 3)
        : ["Follow official channels for the latest information."],
      doNotClaim: [
        "Do not add dates, locations, or details not stated in the cited source.",
      ],
      confidenceLevel: "medium",
    })
    if (opportunities.length >= opts.needed) break
  }

  return opportunities
}
