/**
 * Normalize discovery outputs into one internal recommendation candidate shape
 * before scoring and deduplication.
 */

import type { ExternalOpportunityInput, SourceLabel } from "./types"

export type NormalizedSourceType =
  | "official_alert"
  | "current_event"
  | "weather"
  | "agency_content"
  | "saferu_content"
  | "holiday"
  | "agency_event"

export type NormalizedCandidate = {
  id: string
  sourceType: NormalizedSourceType
  title: string
  summary: string
  category: string
  location?: string
  eventDate?: string
  sourceName?: string
  sourceUrl?: string
  sourceContentId?: string
  verifiedFacts: string[]
  agencyRelevance?: string
  communityRelevance?: string
  whyNow?: string
  whyThisAgency?: string
  whyItMatters: string
  recommendedAction: string
  recommendedPostTiming: string
  signals: string[]
  saferuContentMatch?: {
    contentId: string
    title: string
    imageUrl?: string
    matchReason?: string
  }
  doNotClaim: string[]
  caption?: string
  scores?: {
    agencyRelevance: number
    geographicRelevance: number
    timeliness: number
    residentValue: number
    actionability: number
    sourceConfidence: number
    communicationNecessity: number
    saferuContentMatch: number
  }
  approve?: boolean
  rejectionReason?: string
  /** Original external input for ranking compatibility. */
  external: ExternalOpportunityInput
}

function inferSourceType(input: ExternalOpportunityInput): NormalizedSourceType {
  if (input.id.startsWith("saferu-followup-") || input.sourceName?.includes("SaferU")) {
    if (input.id.startsWith("saferu-followup-")) return "agency_content"
  }
  if (input.sourceLabel === "Weather Alert" || input.sourceLabel === "Weather Analysis") {
    return "weather"
  }
  if (input.sourceLabel === "Seasonal Recommendation" || input.category === "holiday_safety") {
    return "holiday"
  }
  if (input.sourceLabel === "Upcoming Event") return "agency_event"
  if (input.sourceLabel === "SaferU Curated Content") return "saferu_content"
  if (input.sourceLabel === "Weather Alert") return "weather"
  if (/\b(warning|watch|advisory|alert)\b/i.test(input.title)) return "official_alert"
  return "current_event"
}

function extractSourceContentId(input: ExternalOpportunityInput): string | undefined {
  const match = /^saferu-followup-([^-]+(?:-[^-]+)*)-/.exec(input.id)
  // id format: saferu-followup-{sourceId}-{slug}
  const parts = input.id.match(/^saferu-followup-(.+)-[a-z0-9-]+$/)
  if (parts?.[1]) return parts[1]
  void match
  return undefined
}

/**
 * Convert an ExternalOpportunityInput into the normalized candidate structure.
 * Does not invent source URLs for agency-content follow-ups.
 */
export function normalizeCandidate(input: ExternalOpportunityInput): NormalizedCandidate {
  const sourceType = inferSourceType(input)
  const sourceContentId =
    sourceType === "agency_content" ? extractSourceContentId(input) : undefined

  return {
    id: input.id,
    sourceType,
    title: input.title,
    summary: input.summary,
    category: input.category,
    location: undefined,
    eventDate: (input.eventStart || "").slice(0, 10) || undefined,
    sourceName: input.sourceName,
    sourceUrl: sourceType === "agency_content" ? undefined : input.sourceUrl,
    sourceContentId,
    verifiedFacts: input.verifiedFacts ?? [],
    whyNow: input.whyNow,
    whyThisAgency: input.whyThisAgency,
    whyItMatters: input.whyItMatters,
    recommendedAction: input.recommendedAction,
    recommendedPostTiming: input.recommendedPostTiming,
    signals: input.signals ?? [],
    doNotClaim: input.doNotClaim ?? [],
    caption: input.suggestedMessage,
    external: input,
  }
}

export function normalizeCandidates(
  inputs: ExternalOpportunityInput[]
): NormalizedCandidate[] {
  return inputs.map(normalizeCandidate)
}

/** Map 0-100 dimension scores onto the product 0-5 (or 0-3) scales. */
export function toProductDimensionScores(opts: {
  agencyRelevance: number
  geographicRelevance: number
  timeliness: number
  residentValue: number
  actionability: number
  sourceConfidence: number
  communicationNecessity: number
  saferuContentMatch: number
}): NonNullable<NormalizedCandidate["scores"]> {
  const scale5 = (n: number) => Math.max(0, Math.min(5, Math.round(n / 20)))
  const scale3 = (n: number) => Math.max(0, Math.min(3, Math.round(n / (100 / 3))))
  return {
    agencyRelevance: scale5(opts.agencyRelevance),
    geographicRelevance: scale5(opts.geographicRelevance),
    timeliness: scale5(opts.timeliness),
    residentValue: scale5(opts.residentValue),
    actionability: scale5(opts.actionability),
    sourceConfidence: scale5(opts.sourceConfidence),
    communicationNecessity: scale5(opts.communicationNecessity),
    saferuContentMatch: scale3(opts.saferuContentMatch),
  }
}

export type { SourceLabel }