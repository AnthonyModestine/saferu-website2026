export type OpportunitySource =
  | "external"
  | "saferu_curated"
  | "external_with_saferu_match"

export type OpportunityPriority =
  | "urgent"
  | "recommended_today"
  | "plan_ahead"
  | "optional"

/**
 * Visible recommendation strength for the briefing UI.
 * `uncertain` is retained for cached-data compatibility but the current engine
 * only returns top_recommended / could_post (internal 4–5 stars).
 */
export type RecommendationTier =
  | "top_recommended"
  | "could_post"
  | "uncertain"

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
  | "Weather Analysis"
  | "Upcoming Event"
  | "SaferU Curated Content"
  | "Seasonal Recommendation"
  | "National Safety Alert"
  | "Federal Advisory"

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
  /** AI-written explanation of why this was surfaced now for this agency/community. */
  surfacedReason?: string
  recommendedAction: string
  recommendedPostTiming: string
  opportunitySource: OpportunitySource
  priority: OpportunityPriority
  status: OpportunityStatus
  /** How strongly we recommend posting this. */
  recommendationTier?: RecommendationTier
  /** own = home community; nearby = neighboring town; regional = broader area. */
  jurisdictionFit?: "own" | "nearby" | "regional" | "unknown"

  eventStart?: string
  eventEnd?: string
  expiresAt?: string

  sourceName?: string
  sourceUrl?: string

  verifiedFacts?: string[]
  publicCallToAction?: string[]
  doNotClaim?: string[]
  /** Production PIO strategy fields generated before the post-writing stage. */
  communicationPillar?: string
  communicationGoal?: string
  whyNow?: string
  whyThisAgency?: string
  whyThisCommunity?: string
  residentValue?: string
  relationshipValue?: string
  issuingAuthority?: string
  supportingSources?: Array<{
    sourceName: string
    sourceUrl: string
    sourceClass: string
  }>
  qualityGateStatus?: "approved" | "approved_with_revision" | "needs_human_review" | "rejected"
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
  /** County-wide service area, primarily used by sheriff's offices. */
  county?: string
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

/** Recent content created inside SaferU, supplied for preventative follow-up analysis. */
export interface RecentAgencyContent {
  id: string
  kind: "press_release" | "video_request" | "event_campaign"
  title: string
  content: string
  createdAt: string
  eventDate?: string
  agencyRole?: string
}

export interface GeneratorResult {
  urgent: PostOpportunity[]
  recommendedToday: PostOpportunity[]
  planAhead: PostOpportunity[]
  /** Strong fits — post these first. */
  topRecommended: PostOpportunity[]
  /** Solid options that may still be useful. */
  couldPost: PostOpportunity[]
  /** Found, but weaker fit / neighboring / lower confidence. */
  uncertain: PostOpportunity[]
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
  surfacedReason?: string
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
  communicationPillar?: string
  communicationGoal?: string
  whyNow?: string
  whyThisAgency?: string
  whyThisCommunity?: string
  residentValue?: string
  relationshipValue?: string
  issuingAuthority?: string
  supportingSources?: Array<{
    sourceName: string
    sourceUrl: string
    sourceClass: string
  }>
  qualityGateStatus?: "approved" | "approved_with_revision" | "needs_human_review" | "rejected"
  suggestedMessage?: string
  graphicUrl?: string
  graphicThumbnailUrl?: string
  graphicSourceName?: string
  graphicSourceUrl?: string
  graphicAltText?: string
  confidenceLevel?: ConfidenceLevel
  /** Optional distance hint in miles when known (lower = closer = higher score). */
  distanceMiles?: number
  recommendationTier?: RecommendationTier
  jurisdictionFit?: "own" | "nearby" | "regional" | "unknown"
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
