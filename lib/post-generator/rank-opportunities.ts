/**
 * Internal recommendation score (1–5 stars) for the Post Idea Generator.
 * Scores are never shown in the UI. Only 4–5 star opportunities may surface.
 */

import type { DepartmentType } from "@/lib/department-types"
import {
  messagingAngleForOpportunity,
  scoreAgencyRelevance,
} from "./agency-relevance"
import {
  inferJurisdictionFit,
  jurisdictionMessagingGuidance,
  type JurisdictionFit,
} from "./jurisdiction"
import { shouldExcludeUnverifiedEvent } from "./event-exclusion"
import {
  containsVagueHolidayLanguage,
  isValidHolidayRecommendation,
} from "./holiday-validation"
import {
  isNationalValueSource,
  isTrustedSourceUrl,
  scoreSourceTrust,
} from "./trusted-sources"
import { isLikelyHomepageUrl } from "./source-standards"
import { shouldRejectOrdinaryWeather } from "./weather-gates"
import type {
  ExternalOpportunityInput,
  OpportunityPriority,
  PioRating,
  RankedExternalOpportunity,
  RecommendationTier,
} from "./types"

export type RankContext = {
  agencyType?: DepartmentType | string | null
  agencyName?: string | null
  city?: string | null
  county?: string | null
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

/** Collapse related signals into one topic family so heat/storm/scam variants never double-post. */
const TOPIC_FAMILIES: Array<{ family: string; match: RegExp }> = [
  { family: "heat", match: /\b(heat|hot_vehicle|heat_illness|hydration|extreme_heat)\b/ },
  { family: "severe_weather", match: /\b(severe_storms?|thunderstorm|tornado|high_winds?|wind_advisory|hail)\b/ },
  { family: "flood", match: /\b(flood|flash_flood)\b/ },
  { family: "winter", match: /\b(winter|ice_safety|snow|freeze|cold_exposure)\b/ },
  { family: "air_quality", match: /\b(air_quality|aqi|respiratory|smoke)\b/ },
  { family: "wildfire", match: /\b(wildfire|fire_weather|burn_ban)\b/ },
  { family: "earthquake", match: /\b(earthquake)\b/ },
  { family: "scams", match: /\b(scam|fraud|cyber|phishing|ic3|impersonation)\b/ },
  { family: "missing_person", match: /\b(amber|missing_person|missing_child)\b/ },
  { family: "traffic", match: /\b(road_closure|traffic|travel_delay|detour|511)\b/ },
  { family: "utility", match: /\b(outage|boil_water|water_main|utility|power_outage)\b/ },
  { family: "school", match: /\b(school_clos|school_delay|school_safety)\b/ },
  { family: "holiday_safety", match: /\b(holiday|firework|halloween|thanksgiving|christmas|new_year)\b/ },
]

export function topicKey(input: {
  category?: string
  signals?: string[]
  title?: string
  summary?: string
}): string {
  const primarySignal = (input.signals?.[0] || "").toLowerCase()
  const category = (input.category || "").toLowerCase()
  if (/\b(air_quality|aqi|respiratory)\b/.test(`${primarySignal} ${category}`)) {
    return "air_quality"
  }
  if (/\b(wildfire|fire_weather|burn_ban)\b/.test(`${primarySignal} ${category}`)) {
    return "wildfire"
  }

  const blob = [
    ...(input.signals ?? []),
    input.category || "",
    input.title || "",
    input.summary || "",
  ]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9_\s]+/g, " ")

  for (const { family, match } of TOPIC_FAMILIES) {
    if (match.test(blob)) return family
  }

  const signal = (input.signals?.[0] || input.category || "").toLowerCase().replace(/\s+/g, "_")
  if (signal) return signal
  return normalizeText(input.title || "").split(" ").slice(0, 3).join("_")
}

function scoreGeographic(input: ExternalOpportunityInput): number {
  const label = input.sourceLabel
  const text = `${input.title} ${input.summary} ${input.whyItMatters}`.toLowerCase()

  if (typeof input.distanceMiles === "number" && Number.isFinite(input.distanceMiles)) {
    if (input.distanceMiles <= 5) return 100
    if (input.distanceMiles <= 10) return 82
    if (input.distanceMiles <= 25) return 62
    // Far-away items need an explicit regional impact or nationally useful source.
    if (
      !/regional|statewide|major highway|evacuation|widespread|service area|affects residents/i.test(text) &&
      !isNationalValueSource(input.sourceUrl, input.sourceName)
    ) {
      return 20
    }
  }

  if (label === "Weather Alert") return 98
  if (/road|closure|detour|outage|local|zip|county|township|city/i.test(text)) return 92
  if (label === "Upcoming Event") return 82
  // National value is judged by resident usefulness, not physical distance.
  if (isNationalValueSource(input.sourceUrl, input.sourceName)) return 84
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

function isOngoingAlertFamily(input: ExternalOpportunityInput): boolean {
  const key = topicKey(input)
  return [
    "scams",
    "missing_person",
    "wildfire",
    "earthquake",
    "air_quality",
    "utility",
    "heat",
    "severe_weather",
    "flood",
    "winter",
  ].includes(key)
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
    return { score: 70, reject: false }
  }

  // Past start dates: allow recent ongoing alerts (scams, wildfires, quakes, missing persons).
  // These are not "upcoming events" — their publish/discovery date is often in the past.
  if (days < 0) {
    const age = Math.abs(days)
    if (isOngoingAlertFamily(input) && age <= 30) {
      if (age <= 3) return { score: 90, reject: false }
      if (age <= 14) return { score: 78, reject: false }
      return { score: 62, reject: false }
    }
    // Stale one-off items (old community updates) should not surface.
    return { score: 0, reject: true }
  }

  // Upcoming: surface for the next 1–3 days; allow up to 7 for plan-ahead.
  if (days <= 1) return { score: 95, reject: false }
  if (days <= 3) return { score: 85, reject: false }
  if (days <= 7) return { score: 58, reject: false }
  return { score: 15, reject: true }
}

function compositeToStars(score: number): PioRating {
  if (score >= 82) return 5
  // Slightly lower 4★ floor so legitimate local/national alerts can fill a 4-post briefing.
  if (score >= 66) return 4
  if (score >= 55) return 3
  if (score >= 40) return 2
  return 1
}

function adjustedPriority(
  input: ExternalOpportunityInput,
  pioRating: PioRating,
  urgency: number
): OpportunityPriority {
  // Preserve plan-ahead / optional framing unless urgency clearly justifies promotion.
  if (pioRating === 5 && urgency >= 90) return "urgent"
  if (input.priority === "urgent" && pioRating >= 4) return "urgent"
  if (input.priority === "plan_ahead" || input.priority === "optional") {
    if (urgency >= 85 && pioRating >= 4) return "recommended_today"
    return input.priority
  }
  if (pioRating >= 4 && urgency >= 70) return "recommended_today"
  if (pioRating >= 4) return input.priority === "urgent" ? "urgent" : "recommended_today"
  return input.priority
}

function finalPioGate(input: ExternalOpportunityInput, dims: {
  agencyRelevance: number
  residentValue: number
  actionability: number
  sourceTrust: number
}): boolean {
  if (dims.agencyRelevance < 40) return false
  if (dims.residentValue < 55) return false
  if (dims.actionability < 55) return false
  if (dims.sourceTrust < 50) return false
  const text = `${input.title} ${input.summary} ${input.whyItMatters}`.toLowerCase()
  if (/celebrity|political debate|opinion piece|clickbait/i.test(text)) return false
  const why = (input.whyItMatters || "").trim()
  if (why.length < 20 || /might be interesting|fun fact/i.test(why)) return false
  if (!input.verifiedFacts?.length && input.sourceLabel !== "Weather Alert") return false
  return true
}

const LOCAL_COMMUTE_IMPACT =
  /commuter|affects (local|our)|travel (impact|through)|major (highway|route)|residents (who|may) travel|shared (route|road)/i

function shouldRejectNeighboringRoadWithoutImpact(
  input: ExternalOpportunityInput,
  jurisdictionFit: JurisdictionFit
): boolean {
  const key = topicKey(input)
  const category = (input.category || "").toLowerCase()
  const signals = (input.signals ?? []).map((s) => s.toLowerCase())
  const isRoadClosure =
    key === "traffic" || category.includes("road_closure") || signals.includes("road_closure")
  if (!isRoadClosure) return false

  const text = `${input.title} ${input.summary} ${input.whyItMatters} ${input.suggestedMessage || ""}`
  const hasImpact = LOCAL_COMMUTE_IMPACT.test(text)
  if (hasImpact) return false

  const distance = input.distanceMiles
  if (
    key === "traffic" &&
    (jurisdictionFit === "nearby" || jurisdictionFit === "regional") &&
    typeof distance === "number" &&
    distance > 15
  ) {
    return true
  }
  if (
    jurisdictionFit === "nearby" &&
    typeof distance === "number" &&
    distance >= 20 &&
    (category.includes("road_closure") || signals.includes("road_closure"))
  ) {
    return true
  }
  return false
}

function shouldRejectHolidayCandidate(
  input: ExternalOpportunityInput,
  todayIso: string
): boolean {
  const category = (input.category || "").toLowerCase()
  const isHoliday =
    category === "holiday_safety" || input.sourceLabel === "Seasonal Recommendation"
  if (!isHoliday) return false

  const text = `${input.title} ${input.summary} ${input.whyItMatters} ${input.suggestedMessage || ""}`
  if (containsVagueHolidayLanguage(text)) return true
  if (/^(winter holidays|holiday shopping|the holidays|holiday season)$/i.test(input.title.trim())) {
    return true
  }
  if (!input.eventStart) return true

  const days = daysFromToday(input.eventStart, todayIso)
  if (days == null || days < -1 || days > 7) return true

  if (input.id.startsWith("calendar-")) {
    const holidayId = input.id.slice("calendar-".length)
    const dayPart = (input.eventStart || "").slice(0, 10)
    const [, m, d] = dayPart.split("-").map(Number)
    const result = isValidHolidayRecommendation(
      {
        id: holidayId,
        label: input.title,
        category: input.category,
        month: m,
        day: d,
      },
      todayIso,
      7
    )
    if (!result.ok) return true
  }

  return false
}

function assignRecommendationTier(
  pioRating: PioRating,
  geographicRelevance: number,
  jurisdictionFit: JurisdictionFit,
  urgency: number
): RecommendationTier {
  if (pioRating >= 5 || (pioRating >= 4 && geographicRelevance >= 85 && jurisdictionFit === "own")) {
    return "top_recommended"
  }
  if (pioRating >= 4 && urgency >= 90) return "top_recommended"
  if (pioRating >= 4 && jurisdictionFit === "own") return "top_recommended"
  if (pioRating >= 4) return "could_post"
  if (pioRating >= 3 && (jurisdictionFit === "nearby" || jurisdictionFit === "regional")) {
    return "uncertain"
  }
  if (pioRating >= 3) return "could_post"
  return "uncertain"
}

export function scoreExternalOpportunity(
  input: ExternalOpportunityInput,
  ctx: RankContext
): RankedExternalOpportunity | null {
  const fingerprint = opportunityFingerprint(input)
  if ((ctx.postedFingerprints ?? []).includes(fingerprint) || (ctx.postedFingerprints ?? []).includes(input.id)) {
    return null
  }

  // Do not recommend community events unless the agency is clearly involved.
  if (shouldExcludeUnverifiedEvent(input)) return null

  if (shouldRejectOrdinaryWeather(input)) return null

  const combinedText = `${input.title} ${input.summary} ${input.whyItMatters} ${input.suggestedMessage || ""}`
  if (containsVagueHolidayLanguage(combinedText)) return null
  if (shouldRejectHolidayCandidate(input, ctx.todayIso)) return null

  const requireTrusted = ctx.requireTrustedSource !== false
  if (requireTrusted && input.sourceUrl && !isTrustedSourceUrl(input.sourceUrl, input.sourceName)) {
    // Allow medium-confidence local civic sources only when sourceName looks official.
    if (scoreSourceTrust(input.sourceUrl, input.sourceName) < 70) return null
  }
  if (
    requireTrusted &&
    input.sourceUrl &&
    isLikelyHomepageUrl(input.sourceUrl) &&
    input.sourceLabel !== "Weather Alert"
  ) {
    return null
  }

  const freshness = scoreFreshness(input, ctx.todayIso)
  if (freshness.reject) return null

  const jurisdictionFit =
    input.jurisdictionFit ||
    inferJurisdictionFit({
      agencyName: ctx.agencyName || undefined,
      city: ctx.city || undefined,
      county: ctx.county || undefined,
      title: input.title,
      summary: input.summary,
      whyItMatters: input.whyItMatters,
      sourceName: input.sourceName,
      category: input.category,
      signals: input.signals,
      distanceMiles: input.distanceMiles,
    })

  if (shouldRejectNeighboringRoadWithoutImpact(input, jurisdictionFit)) return null

  const agency = scoreAgencyRelevance(input.signals ?? [], input.category, ctx.agencyType)
  let geographicRelevance = scoreGeographic(input)
  if (jurisdictionFit === "own") geographicRelevance = Math.max(geographicRelevance, 92)
  if (jurisdictionFit === "nearby") geographicRelevance = Math.min(geographicRelevance, 78)
  if (jurisdictionFit === "regional") geographicRelevance = Math.min(geographicRelevance, 62)

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
  if (jurisdictionFit === "nearby") composite -= 4
  if (jurisdictionFit === "regional") composite -= 8

  composite = clamp(composite)
  const pioRating = compositeToStars(composite)
  // Quality gate: 1–3 stars never reach the user.
  if (pioRating < 4) return null

  let messagingAngle = messagingAngleForOpportunity(
    input.signals ?? [],
    input.category,
    ctx.agencyType,
    `${input.title} ${input.summary || ""} ${input.whyItMatters || ""}`
  )
  const jurisdictionNote = jurisdictionMessagingGuidance(
    jurisdictionFit,
    ctx.agencyName || "this agency",
    ctx.city || undefined
  )
  messagingAngle = messagingAngle
    ? `${messagingAngle} ${jurisdictionNote}`
    : jurisdictionNote

  const recommendationTier = assignRecommendationTier(
    pioRating,
    geographicRelevance,
    jurisdictionFit,
    urgency
  )

  // Neighboring road closures should not read as "own jurisdiction" ownership posts.
  const doNotClaim = [
    ...(input.doNotClaim ?? []),
    ...(jurisdictionFit === "nearby" || jurisdictionFit === "regional"
      ? [
          "Do not claim this agency owns, manages, or is performing the work.",
          'Do not say "thank you for your understanding," "our crews," or "we apologize for the inconvenience" for another jurisdiction\'s project.',
        ]
      : []),
  ]

  return {
    ...input,
    doNotClaim,
    jurisdictionFit,
    recommendationTier,
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
  // Same topic family (heat vs heat, storm vs storm) is always a duplicate for the daily briefing.
  if (topicKey(a) === topicKey(b)) return true

  const titleSim = jaccard(tokenSet(a.title), tokenSet(b.title))
  if (titleSim >= 0.55) return true

  const factA = tokenSet((a.verifiedFacts || []).join(" "))
  const factB = tokenSet((b.verifiedFacts || []).join(" "))
  if (jaccard(factA, factB) >= 0.65) return true
  return false
}

function acceptDistinctTopics(
  scored: RankedExternalOpportunity[],
  into: RankedExternalOpportunity[],
  usedTopics: Set<string>,
  limit: number
) {
  for (const item of scored) {
    if (into.length >= limit) break
    const key = topicKey(item)
    // One item per topic family across the full briefing (heat once, AQI once, etc.).
    if (usedTopics.has(key)) continue
    if (into.some((existing) => areNearDuplicates(existing, item))) continue
    usedTopics.add(key)
    into.push(item)
  }
}

/**
 * Score, tier, and dedupe external opportunities.
 * Only accepts 4–5 star opportunities.
 * Internal scores remain on the object for server-side use and are stripped before API responses.
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
  acceptDistinctTopics(scored, accepted, usedTopics, 8)

  return accepted
}

/** True when at least one item earned Top recommended via scoring. */
export function hasTopRecommended(
  ranked: Array<{ recommendationTier?: RecommendationTier | null }>
): boolean {
  return ranked.some((opp) => (opp.recommendationTier || "") === "top_recommended")
}

/** True when at least one item is recommendable (top or could-post), not only uncertain fillers. */
export function hasRecommendablePost(
  ranked: Array<{ recommendationTier?: RecommendationTier | null }>
): boolean {
  return ranked.some((opp) => {
    const tier = opp.recommendationTier || ""
    return tier === "top_recommended" || tier === "could_post"
  })
}

/** Strip internal scoring fields before sending opportunities to the client UI. */
export function stripInternalScores<T extends { internalScores?: unknown }>(item: T): Omit<T, "internalScores"> {
  const { internalScores: _ignored, ...rest } = item
  return rest
}
