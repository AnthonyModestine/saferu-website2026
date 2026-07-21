import type { RankedExternalOpportunity } from "@/lib/post-generator/types"

export type CommunicationPillar =
  | "urgent_alert"
  | "operational_update"
  | "timely_prevention"
  | "incident_followup"
  | "public_safety_education"
  | "emergency_preparedness"
  | "service_explainer"
  | "community_relationship"
  | "agency_event"
  | "seasonal_safety"
  | "community_resource"
  | "reassurance_update"

export type PipelineRecommendationStatus =
  | "recommend_today"
  | "schedule_this_week"
  | "needs_human_review"

export type PipelineJurisdictionStatus =
  | "inside_jurisdiction"
  | "directly_affects_jurisdiction"
  | "adjacent_travel_impact"
  | "regional_impact"
  | "unclear"

export type SourceClass =
  | "official_operational_authority"
  | "trusted_operational_intelligence"
  | "authoritative_data"
  | "official_guidance"
  | "established_local_media"
  | "saferu_internal"

export type SourceUsageMode =
  | "trigger_recommendation"
  | "verify_facts"
  | "geospatial_context"
  | "education"
  | "supporting_context"

export interface SourceRegistryRecord {
  id: string
  name: string
  domainPatterns: string[]
  sourceCategory: string
  sourceClass: SourceClass
  usageModes: SourceUsageMode[]
  agencyTypes: string[]
  geographicCoverage: "national" | "state" | "regional" | "local" | "supported_regions"
  requiresOriginalAuthorityAttribution: boolean
  canIndependentlySurfaceCandidate: boolean
  requiresSecondaryConfirmation: boolean
  conflictPriority: number
  active: boolean
}

export interface AgencySourceCatalog {
  agencyOfficialSources: SourceRegistryRecord[]
  municipalSources: SourceRegistryRecord[]
  countySources: SourceRegistryRecord[]
  stateSources: SourceRegistryRecord[]
  emergencyManagementSources: SourceRegistryRecord[]
  transportationSources: SourceRegistryRecord[]
  utilitySources: SourceRegistryRecord[]
  schoolSources: SourceRegistryRecord[]
  publicHealthSources: SourceRegistryRecord[]
  wildfireSources: SourceRegistryRecord[]
  localMediaSources: SourceRegistryRecord[]
  gisSources: SourceRegistryRecord[]
  nationalSources: SourceRegistryRecord[]
}

export interface VerifiedEvidenceFact {
  factId: string
  claim: string
}

export interface VerifiedEvidenceRecord {
  sourceId: string
  sourceName: string
  sourceUrl: string
  sourceClass: SourceClass
  issuingAuthority: string
  publishedAt: string
  updatedAt: string
  expiresAt: string
  retrievedAt: string
  location: string
  geometry: null
  jurisdictionMatch: PipelineJurisdictionStatus
  active: boolean
  facts: VerifiedEvidenceFact[]
  /** Internal only; never sent to the model or client. */
  verificationStatus: "verified" | "unverified" | "fetch_failed"
}

export interface SupportingSource {
  sourceName: string
  sourceUrl: string
  sourceClass: SourceClass
}

export interface RecommendationFact {
  factId: string
  claim: string
  sourceName: string
  sourceUrl: string
  publishedAt: string
  updatedAt: string
  expiresAt: string
}

export interface Stage1Recommendation {
  id: string
  status: PipelineRecommendationStatus
  title: string
  communicationPillar: CommunicationPillar
  priority: "critical" | "high" | "normal"
  category: string
  communicationGoal: string
  whyNow: string
  whyThisAgency: string
  whyThisCommunity: string
  residentValue: string
  relationshipValue: string
  agencyAngle: string
  recommendedAction: string
  recommendedPostTiming: string
  jurisdictionStatus: PipelineJurisdictionStatus
  issuingAuthority: string
  primarySourceName: string
  primarySourceUrl: string
  sourceClass: SourceClass
  supportingSources: SupportingSource[]
  verifiedFacts: RecommendationFact[]
  doNotClaim: string[]
  graphicSignals: string[]
  sourceConfidence: "high" | "medium"
  humanReviewReason: string
}

export interface Stage1Result {
  recommendations: Stage1Recommendation[]
  runSummary: {
    urgentInformationFound: boolean
    proactiveOpportunityIncluded: boolean
    sourcesChecked: string[]
    sourceFamiliesWithNoResults: string[]
    notes: string
  }
}

export interface Stage2Draft {
  status: "ready" | "needs_human_review"
  postText: string
  usedFactIds: string[]
  sourceAttribution: string
  humanReviewReason: string
}

export interface Stage3Decision {
  status: "approved" | "edited" | "needs_human_review"
  finalPostText: string
  changed: boolean
  changeReasons: string[]
  checks: {
    factsSupported: boolean
    statusAndUrgencyPreserved: boolean
    agencyPerspectiveCorrect: boolean
    publicActionClear: boolean
    naturalPioVoice: boolean
    safeToPublish: boolean
  }
  /** @deprecated Use changeReasons */
  changesMade: string[]
  /** @deprecated Use changeReasons when changed */
  flags: string[]
  humanReviewReason: string
}

export interface PipelineAgencyContext {
  agencyName: string
  agencyType: string
  agencyTypeOther?: string
  agencyRoleProfile: string
  agencyVoiceProfile: string
  agencyServices: string[]
  city: string
  county: string
  state: string
  serviceAreaType: string
  serviceZips: string[]
  todayIso: string
  localDateTime: string
  timezone: string
  recentAgencyPosts: unknown[]
  recentRecommendations: unknown[]
  dismissedRecommendations: unknown[]
  recentSaferUContent: unknown[]
  upcomingEvents: unknown[]
  availableSaferUContent: unknown[]
  recentSignals: string[]
  recentCommunicationPillars: string[]
  knownActiveConditions: unknown[]
  excludedTopics: string[]
}

export interface PipelineCandidate {
  opportunity: RankedExternalOpportunity
  evidence: VerifiedEvidenceRecord[]
}

export interface PipelineApprovedRecommendation {
  recommendation: Stage1Recommendation
  draft: Stage2Draft
  qualityGate: Stage3Decision
}
