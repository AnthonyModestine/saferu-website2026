export type OpportunitySource =
  | "external"
  | "saferu_curated"
  | "external_with_saferu_match"

export type OpportunityPriority =
  | "urgent"
  | "recommended_today"
  | "plan_ahead"
  | "optional"

export type OpportunityStatus =
  | "new"
  | "viewed"
  | "saved"
  | "generated"
  | "used"
  | "dismissed"
  | "expired"

export type SourceLabel =
  | "Current Local Opportunity"
  | "Weather Alert"
  | "Upcoming Event"
  | "SaferU Curated Content"
  | "Seasonal Recommendation"

export type ConfidenceLevel = "high" | "medium" | "low"

/** Internal 1–5 recommendation rating. Never shown in the UI. */
export type PioRating = 1 | 2 | 3 | 4 | 5

/**
 * Dimension scores used by the intelligence engine.
 * Server-side only — strip before sending to clients.
 */
export interface OpportunityInternalScores {
  agencyRelevance: number
  geographicRelevance: number
  residentValue: number
  actionability: number
  urgency: number
  sourceTrust: number
  seasonalRelevance: number
  engagementPotential: number
  freshness: number
  composite: number
  pioRating: PioRating
  agencyFitReason?: string
  messagingAngle?: string
}

export interface CuratedContentRef {
  contentId: string
  postId: string
  categoryId: string
  subcategoryId: string
  articleId: string
  title: string
  category: string
  message: string
  graphicUrl?: string
  graphicThumbnailUrl?: string
  matchReason?: string
  updatedAt?: string
}

export interface PostOpportunity {
  id: string
  title: string
  summary: string
  category: string
  sourceLabel: SourceLabel
  whyItMatters: string
  recommendedAction: string
  recommendedPostTiming: string
  opportunitySource: OpportunitySource
  priority: OpportunityPriority
  status: OpportunityStatus

  eventStart?: string
  eventEnd?: string
  expiresAt?: string

  sourceName?: string
  sourceUrl?: string

  verifiedFacts?: string[]
  publicCallToAction?: string[]
  doNotClaim?: string[]
  /** Retrieval tags used to match SaferU curated content to this opportunity. */
  signals?: string[]

  curated?: CuratedContentRef
  alternateCurated?: CuratedContentRef[]

  curatedMessage?: string
  graphicUrl?: string
  graphicThumbnailUrl?: string
  graphicSourceName?: string
  graphicSourceUrl?: string
  graphicAltText?: string

  timelinessScore: number
  safetyValueScore: number
  actionabilityScore: number
  sourceReliabilityScore: number
  curatedMatchScore: number
  freshnessScore: number
  totalScore: number

  confidenceLevel: ConfidenceLevel
  discoveredAt: string
  updatedAt: string
}

export interface GeneratorContext {
  todayIso: string
  month: number
  season: "winter" | "spring" | "summer" | "fall"
  holidays: string[]
  observances: string[]
  signals: string[]
}

export interface GeneratorRequest {
  agencyName?: string
  /** Agency/department type from signup (police, fire, ems, …). */
  agencyType?: string
  agencyTypeOther?: string
  city?: string
  state: string
  serviceZips: string[]
  todayIso?: string
  dismissedIds?: string[]
  usedContentIds?: string[]
  /** Fingerprints / ids of opportunities already marked posted. */
  postedFingerprints?: string[]
  /** Recent topic keys (e.g. extreme_heat) to avoid near-duplicate topics. */
  recentTopicKeys?: string[]
  savedIds?: string[]
  externalOpportunities?: ExternalOpportunityInput[]
  /** Override the default 4-post daily briefing cap (localhost testing). */
  dailyLimit?: number
}

export interface GeneratorResult {
  urgent: PostOpportunity[]
  recommendedToday: PostOpportunity[]
  planAhead: PostOpportunity[]
  fromSaferU: PostOpportunity[]
  emptyState: boolean
  demo: boolean
  generatedAt: string
}

export interface ExternalOpportunityInput {
  id: string
  title: string
  summary: string
  category: string
  sourceLabel: SourceLabel
  whyItMatters: string
  recommendedAction: string
  recommendedPostTiming: string
  priority: OpportunityPriority
  signals: string[]
  sourceName?: string
  sourceUrl?: string
  eventStart?: string
  eventEnd?: string
  expiresAt?: string
  verifiedFacts?: string[]
  publicCallToAction?: string[]
  doNotClaim?: string[]
  suggestedMessage?: string
  graphicUrl?: string
  graphicThumbnailUrl?: string
  graphicSourceName?: string
  graphicSourceUrl?: string
  graphicAltText?: string
  confidenceLevel?: ConfidenceLevel
  /** Optional distance hint in miles when known (lower = closer = higher score). */
  distanceMiles?: number
  /** Server-side internal score; never display in UI. */
  internalScores?: OpportunityInternalScores
}

/** External opportunity after ranking/gating. */
export type RankedExternalOpportunity = ExternalOpportunityInput & {
  internalScores: OpportunityInternalScores
}

export type CustomizeMessageMode =
  | "shorten"
  | "conversational"
  | "formal"
  | "facebook"
  | "instagram"
  | "twitter"
  | "add_emojis"
  | "remove_emojis"
