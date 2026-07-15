/**
 * Internal recommendation score (1–5 stars) for the Post Idea Generator.
 * Scores are never shown in the UI. Only 4–5 star items surface by default.
 */

import type { DepartmentType } from "@/lib/department-types"
import {
  messagingAngleForOpportunity,
  scoreAgencyRelevance,
} from "./agency-relevance"
import {
  isNationalValueSource,
  isTrustedSourceUrl,
  scoreSourceTrust,
} from "./trusted-sources"
import type {
  ExternalOpportunityInput,
  OpportunityPriority,
  PioRating,
  RankedExternalOpportunity,
} from "./types"

export type RankContext = {
  agencyType?: DepartmentType | string | null
  todayIso: string
  postedFingerprints?: string[]
  recentTopicKeys?: string[]
  requireTrustedSource?: boolean
}

const WEIGHTS = {
  agencyRelevance: 0.22,
  geographicRelevance: 0.16,
  residentValue: 0.14,
  actionability: 0.12,
  urgency: 0.12,
  sourceTrust: 0.1,
  seasonalRelevance: 0.06,
  engagementPotential: 0.05,
  freshness: 0.03,
} as const

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n))
}

function parseDay(iso?: string | null): number | null {
  if (!iso) return null
  const day = iso.slice(0, 10)
  const t = new Date(`${day}T12:00:00`).getTime()
  return Number.isNaN(t) ? null : t
}

function daysFromToday(iso: string | undefined, todayIso: string): number | null {
  const event = parseDay(iso)
  const today = parseDay(todayIso)
  if (event == null || today == null) return null
  return Math.round((event - today) / (1000 * 60 * 60 * 24))
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeText(value).split(" ").filter((t) => t.length > 2))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0
  let intersection = 0
  for (const token of a) if (b.has(token)) intersection++
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

export function opportunityFingerprint(input: {
  title: string
  category?: string
  eventStart?: string
  signals?: string[]
}): string {
  const title = normalizeText(input.title)
  const category = normalizeText(input.category || "")
  const day = (input.eventStart || "").slice(0, 10)
  const primarySignal = normalizeText(input.signals?.[0] || "")
  return [title, category, day, primarySignal].filter(Boolean).join("|")
}

export function topicKey(input: { category?: string; signals?: string[]; title?: string }): string {
  const signal = (input.signals?.[0] || input.category || "").toLowerCase().replace(/\s+/g, "_")
  if (signal) return signal
  return normalizeText(input.title || "").split(" ").slice(0, 3).join("_")
}

function scoreGeographic(input: ExternalOpportunityInput): number {
  const label = input.sourceLabel
  const text = `${input.title} ${input.summary} ${input.whyItMatters}`.toLowerCase()
  if (label === "Weather Alert") return 98
  if (/road|closure|detour|outage|local|zip|county|township|city/i.test(text)) return 92
  if (label === "Upcoming Event") return 88
  if (isNationalValueSource(input.sourceUrl, input.sourceName)) return 78
  if (/national|nationwide|across the country/i.test(text) && !isNationalValueSource(input.sourceUrl, input.sourceName)) {
    return 35
  }
  return 70
}

function scoreResidentValue(input: ExternalOpportunityInput): number {
  const text = `${input.title} ${input.summary} ${input.whyItMatters} ${input.category}`.toLowerCase()
  const high = [
    "road",
    "closure",
    "storm",
    "flood",
    "heat",
    "scam",
    "traffic",
    "cooling",
    "outage",
    "missing",
    "amber",
    "health",
    "burn ban",
    "shelter",
    "evacuation",
  ]
  const low = ["celebrity", "politics", "opinion", "another state", "interesting", "viral"]
  if (low.some((k) => text.includes(k))) return 20
  const hits = high.filter((k) => text.includes(k)).length
  if (hits >= 2) return 95
  if (hits === 1) return 85
  if (input.priority === "urgent") return 90
  if (input.sourceLabel === "Upcoming Event") return 78
  return 55
}

function scoreActionability(input: ExternalOpportunityInput): number {
  const actions = input.publicCallToAction?.length ?? 0
  const text = `${input.recommendedAction} ${(input.publicCallToAction || []).join(" ")}`.toLowerCase()
  const cues = [
    "avoid",
    "prepare",
    "hydrate",
    "lock",
    "register",
    "charge",
    "move",
    "seek shelter",
    "call 911",
    "turn around",
    "check on",
    "never leave",
    "sign up",
  ]
  const cueHits = cues.filter((c) => text.includes(c)).length
  if (actions >= 2 && cueHits >= 1) return 95
  if (actions >= 1 || cueHits >= 1) return 82
  if (input.recommendedAction.trim()) return 68
  return 35
}

function scoreUrgency(input: ExternalOpportunityInput, todayIso: string): number {
  const text = `${input.title} ${input.summary}`.toLowerCase()
  if (/amber|flash flood warning|tornado|missing child|power outage/.test(text)) return 98
  if (input.priority === "urgent") return 95
  if (/heat warning|major road|road closure|flood watch|severe thunderstorm/.test(text)) return 88
  const days = daysFromToday(input.eventStart, todayIso)
  if (days != null) {
    if (days <= 0) return 90
    if (days === 1) return 84
    if (days <= 3) return 76
    if (days <= 7) return 58
    return 40
  }
  if (input.priority === "recommended_today") return 78
  if (input.priority === "plan_ahead") return 55
  return 45
}

function scoreSeasonal(input: ExternalOpportunityInput): number {
  const text = `${input.title} ${input.category} ${(input.signals || []).join(" ")}`.toLowerCase()
  const seasonal = [
    "national night out",
    "back to school",
    "halloween",
    "independence",
    "july 4",
    "thanksgiving",
    "vehicle theft prevention",
    "fire prevention",
    "preparedness month",
    "pool safety",
    "boating",
    "heat safety",
    "winter storm",
    "holiday",
  ]
  if (seasonal.some((k) => text.includes(k))) return 90
  if (input.sourceLabel === "Seasonal Recommendation") return 80
  return 55
}

function scoreEngagement(input: ExternalOpportunityInput): number {
  const text = `${input.title} ${input.summary}`.toLowerCase()
  const hooks = [
    "bridge closure",
    "road closure",
    "traffic",
    "bear",
    "severe",
    "heat",
    "warning",
    "scam",
    "missing",
    "outage",
    "flood",
    "community event",
    "night out",
  ]
  const hits = hooks.filter((k) => text.includes(k)).length
  if (hits >= 2) return 92
  if (hits === 1) return 80
  return 50
}

function scoreFreshness(input: ExternalOpportunityInput, todayIso: string): {
  score: number
  reject: boolean
} {
  const expires = parseDay(input.expiresAt || input.eventEnd)
  const today = parseDay(todayIso)
  if (expires != null && today != null && expires < today) {
    return { score: 0, reject: true }
  }

  const days = daysFromToday(input.eventStart, todayIso)
  if (days == null) {
    // Weather alerts without a start date are treated as current.
    if (input.sourceLabel === "Weather Alert") return { score: 90, reject: false }
    return { score: 60, reject: false }
  }

  // Current bucket: generally surface only for the next 1–3 days.
  if (days < 0) return { score: 0, reject: true }
  if (days <= 1) return { score: 95, reject: false }
  if (days <= 3) return { score: 85, reject: false }
  // Plan-ahead community events can remain if otherwise excellent and near-term.
  if (days <= 7 && input.sourceLabel === "Upcoming Event") return { score: 55, reject: false }
  if (days <= 7) return { score: 40, reject: false }
  return { score: 15, reject: true }
}

function compositeToStars(score: number): PioRating {
  if (score >= 84) return 5
  if (score >= 72) return 4
  if (score >= 58) return 3
  if (score >= 40) return 2
  return 1
}

function adjustedPriority(
  input: ExternalOpportunityInput,
  pioRating: PioRating,
  urgency: number
): OpportunityPriority {
  if (pioRating === 5 && urgency >= 90) return "urgent"
  if (input.priority === "urgent" && pioRating >= 4) return "urgent"
  if (pioRating >= 4 && urgency >= 70) return "recommended_today"
  if (pioRating >= 4) return "recommended_today"
  return input.priority
}

function finalPioGate(input: ExternalOpportunityInput, dims: {
  agencyRelevance: number
  residentValue: number
  actionability: number
  sourceTrust: number
}): boolean {
  // "If I were the PIO today, would this genuinely help my community?"
  if (dims.agencyRelevance < 40) return false
  if (dims.residentValue < 45) return false
  if (dims.actionability < 40) return false
  if (dims.sourceTrust < 50) return false
  const text = `${input.title} ${input.summary} ${input.whyItMatters}`.toLowerCase()
  if (/celebrity|political debate|opinion piece|clickbait/i.test(text)) return false
  if (!input.verifiedFacts?.length && input.sourceLabel !== "Weather Alert") return false
  return true
}

export function scoreExternalOpportunity(
  input: ExternalOpportunityInput,
  ctx: RankContext
): RankedExternalOpportunity | null {
  const fingerprint = opportunityFingerprint(input)
  if ((ctx.postedFingerprints ?? []).includes(fingerprint) || (ctx.postedFingerprints ?? []).includes(input.id)) {
    return null
  }

  const requireTrusted = ctx.requireTrustedSource !== false
  if (requireTrusted && input.sourceUrl && !isTrustedSourceUrl(input.sourceUrl, input.sourceName)) {
    // Allow medium-confidence local civic sources only when sourceName looks official.
    if (scoreSourceTrust(input.sourceUrl, input.sourceName) < 70) return null
  }

  const freshness = scoreFreshness(input, ctx.todayIso)
  if (freshness.reject) return null

  const agency = scoreAgencyRelevance(input.signals ?? [], input.category, ctx.agencyType)
  const geographicRelevance = scoreGeographic(input)
  const residentValue = scoreResidentValue(input)
  const actionability = scoreActionability(input)
  const urgency = scoreUrgency(input, ctx.todayIso)
  const sourceTrust = scoreSourceTrust(input.sourceUrl, input.sourceName)
  const seasonalRelevance = scoreSeasonal(input)
  const engagementPotential = scoreEngagement(input)
  const freshnessScore = freshness.score

  if (
    !finalPioGate(input, {
      agencyRelevance: agency.score,
      residentValue,
      actionability,
      sourceTrust,
    })
  ) {
    return null
  }

  let composite =
    agency.score * WEIGHTS.agencyRelevance +
    geographicRelevance * WEIGHTS.geographicRelevance +
    residentValue * WEIGHTS.residentValue +
    actionability * WEIGHTS.actionability +
    urgency * WEIGHTS.urgency +
    sourceTrust * WEIGHTS.sourceTrust +
    seasonalRelevance * WEIGHTS.seasonalRelevance +
    engagementPotential * WEIGHTS.engagementPotential +
    freshnessScore * WEIGHTS.freshness

  // Soft penalty for repeating the same topic family recently.
  const key = topicKey(input)
  if ((ctx.recentTopicKeys ?? []).includes(key)) {
    composite -= 12
  }

  composite = clamp(composite)
  const pioRating = compositeToStars(composite)
  if (pioRating < 4) return null

  const messagingAngle = messagingAngleForOpportunity(
    input.signals ?? [],
    input.category,
    ctx.agencyType
  )

  return {
    ...input,
    priority: adjustedPriority(input, pioRating, urgency),
    internalScores: {
      agencyRelevance: Math.round(agency.score),
      geographicRelevance: Math.round(geographicRelevance),
      residentValue: Math.round(residentValue),
      actionability: Math.round(actionability),
      urgency: Math.round(urgency),
      sourceTrust: Math.round(sourceTrust),
      seasonalRelevance: Math.round(seasonalRelevance),
      engagementPotential: Math.round(engagementPotential),
      freshness: Math.round(freshnessScore),
      composite: Math.round(composite),
      pioRating,
      agencyFitReason: agency.reason,
      messagingAngle,
    },
  }
}

function areNearDuplicates(a: ExternalOpportunityInput, b: ExternalOpportunityInput): boolean {
  const titleSim = jaccard(tokenSet(a.title), tokenSet(b.title))
  if (titleSim >= 0.72) return true
  const sameTopic =
    topicKey(a) === topicKey(b) &&
    (a.eventStart || "").slice(0, 10) === (b.eventStart || "").slice(0, 10) &&
    Boolean(a.eventStart)
  if (sameTopic && titleSim >= 0.45) return true
  const factA = tokenSet((a.verifiedFacts || []).join(" "))
  const factB = tokenSet((b.verifiedFacts || []).join(" "))
  if (jaccard(factA, factB) >= 0.75) return true
  return false
}

/**
 * Score, gate (4–5 stars only), and dedupe external opportunities.
 * Internal scores remain on the object for server-side debugging and are stripped before API responses.
 */
export function rankAndGateExternalOpportunities(
  candidates: ExternalOpportunityInput[],
  ctx: RankContext
): RankedExternalOpportunity[] {
  const scored: RankedExternalOpportunity[] = []
  for (const candidate of candidates) {
    const ranked = scoreExternalOpportunity(candidate, ctx)
    if (ranked) scored.push(ranked)
  }

  scored.sort((a, b) => b.internalScores.composite - a.internalScores.composite)

  const accepted: RankedExternalOpportunity[] = []
  const usedTopics = new Set<string>()
  for (const item of scored) {
    if (accepted.some((existing) => areNearDuplicates(existing, item))) continue
    const key = topicKey(item)
    // Prefer topical variety: allow at most one heat/scam/flood family unless urgency is extreme.
    if (usedTopics.has(key) && item.internalScores.urgency < 92) continue
    usedTopics.add(key)
    accepted.push(item)
  }
  return accepted
}

/** Strip internal scoring fields before sending opportunities to the client UI. */
export function stripInternalScores<T extends { internalScores?: unknown }>(item: T): Omit<T, "internalScores"> {
  const { internalScores: _ignored, ...rest } = item
  return rest
}
