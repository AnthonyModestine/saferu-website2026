import { runStage1Discovery } from "@/lib/post-generator/stage-1-discovery"
import { verifyRankedEvidence } from "@/lib/post-generator/evidence"
import {
  isKeepableWithoutPerfectEvidence,
  provisionalEvidenceFromOpportunity,
} from "@/lib/post-generator/source-retention"
import {
  MAX_RECOMMENDATIONS,
  selectFinalRecommendations,
} from "@/lib/post-generator/recommendation"
import type {
  PipelineAgencyContext,
  Stage1Recommendation,
  VerifiedEvidenceRecord,
} from "@/lib/post-generator/pipeline-types"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"

export interface PipelineDiagnostics {
  rankedIn: number
  verifiedEvidence: number
  droppedAtEvidence: Array<{
    id: string
    category: string
    sourceUrl?: string
    status: string
  }>
  stage1Reason?: string
  stage1Detail?: string
  approvedCount: number
  usedDeterministicFallback: boolean
  fallbackReason?: string
}

export interface ProductionPipelineResult {
  approved: RankedExternalOpportunity[]
  rejectedCount: number
  selectionSummary?: string
  noRecommendationReason?: string | null
  diagnostics: PipelineDiagnostics
  stage1Summary?: {
    urgentInformationFound: boolean
    proactiveOpportunityIncluded: boolean
    sourcesChecked: string[]
    sourceFamiliesWithNoResults: string[]
    notes: string
  }
}

function priorityFor(recommendation: Stage1Recommendation): RankedExternalOpportunity["priority"] {
  if (recommendation.priority === "critical") return "urgent"
  if (recommendation.status === "schedule_this_week") return "plan_ahead"
  return "recommended_today"
}

function jurisdictionFor(
  recommendation: Stage1Recommendation
): RankedExternalOpportunity["jurisdictionFit"] {
  if (
    recommendation.jurisdictionStatus === "inside_jurisdiction" ||
    recommendation.jurisdictionStatus === "directly_affects_jurisdiction"
  ) {
    return "own"
  }
  if (recommendation.jurisdictionStatus === "adjacent_travel_impact") return "nearby"
  if (recommendation.jurisdictionStatus === "regional_impact") return "regional"
  return "unknown"
}

function hasVerifiedEvidence(evidence: VerifiedEvidenceRecord[]): boolean {
  return evidence.some((record) => record.verificationStatus === "verified" && record.active)
}

function mapStage1Recommendation(
  source: RankedExternalOpportunity,
  recommendation: Stage1Recommendation
): RankedExternalOpportunity {
  return {
    ...source,
    title: recommendation.title,
    summary: recommendation.residentValue,
    whyItMatters: recommendation.whyThisCommunity,
    surfacedReason: recommendation.whyNow,
    recommendedAction: recommendation.recommendedAction,
    recommendedPostTiming: recommendation.recommendedPostTiming,
    priority: priorityFor(recommendation),
    jurisdictionFit: jurisdictionFor(recommendation),
    sourceName: recommendation.primarySourceName,
    sourceUrl: recommendation.primarySourceUrl,
    verifiedFacts: recommendation.verifiedFacts.map((fact) => fact.claim),
    doNotClaim: recommendation.doNotClaim,
    signals: [...new Set([...source.signals, ...recommendation.graphicSignals])],
    communicationPillar: recommendation.communicationPillar,
    communicationGoal: recommendation.communicationGoal,
    whyNow: recommendation.whyNow,
    whyThisAgency: recommendation.whyThisAgency,
    whyThisCommunity: recommendation.whyThisCommunity,
    residentValue: recommendation.residentValue,
    relationshipValue: recommendation.relationshipValue,
    issuingAuthority: recommendation.issuingAuthority,
    supportingSources: recommendation.supportingSources,
    qualityGateStatus: "approved",
    confidenceLevel: recommendation.sourceConfidence,
    suggestedMessage: undefined,
  }
}

function mapVerifiedFallback(
  opportunity: RankedExternalOpportunity,
  evidence: VerifiedEvidenceRecord[]
): RankedExternalOpportunity {
  const facts = evidence.flatMap((record) => record.facts.map((fact) => fact.claim))
  const primary = evidence.find((record) => record.verificationStatus === "verified")
  return {
    ...opportunity,
    sourceName: primary?.sourceName || opportunity.sourceName,
    sourceUrl: primary?.sourceUrl || opportunity.sourceUrl,
    verifiedFacts: facts.length ? facts : opportunity.verifiedFacts,
    issuingAuthority:
      primary?.issuingAuthority || opportunity.issuingAuthority || opportunity.sourceName,
    whyNow: opportunity.whyNow || opportunity.surfacedReason || opportunity.whyItMatters,
    surfacedReason:
      opportunity.surfacedReason || opportunity.whyNow || opportunity.whyItMatters,
    suggestedMessage: undefined,
    qualityGateStatus: "approved",
    confidenceLevel: opportunity.confidenceLevel === "low" ? "medium" : opportunity.confidenceLevel,
  }
}

function recentTopicKeysFromContext(context: PipelineAgencyContext): string[] {
  return (context.recentSignals ?? []).map(String)
}

/**
 * Recommendation pipeline: verify evidence, editorial Stage 1 selection, PIO scoring.
 * Captions are generated only when the user clicks Generate Post.
 */
export async function runProductionPostPipeline(
  context: PipelineAgencyContext,
  ranked: RankedExternalOpportunity[]
): Promise<ProductionPipelineResult> {
  const emptyDiagnostics = (extra: Partial<PipelineDiagnostics> = {}): PipelineDiagnostics => ({
    rankedIn: ranked.length,
    verifiedEvidence: 0,
    droppedAtEvidence: [],
    approvedCount: 0,
    usedDeterministicFallback: false,
    ...extra,
  })

  if (!ranked.length) {
    const empty = selectFinalRecommendations([])
    return {
      approved: [],
      rejectedCount: 0,
      selectionSummary: empty.selectionSummary,
      noRecommendationReason: empty.noRecommendationReason,
      diagnostics: emptyDiagnostics(),
    }
  }

  const candidates = await verifyRankedEvidence(ranked)
  const enriched = candidates.map((candidate) => {
    if (hasVerifiedEvidence(candidate.evidence)) return candidate
    if (!isKeepableWithoutPerfectEvidence(candidate.opportunity)) return candidate
    const provisional = provisionalEvidenceFromOpportunity(candidate.opportunity)
    if (!provisional.length) return candidate
    console.info(
      `[production-pipeline] Retaining ranked source with provisional evidence: ${candidate.opportunity.id} (${candidate.opportunity.sourceLabel})`
    )
    return { ...candidate, evidence: provisional }
  })

  const verified = enriched.filter((candidate) => hasVerifiedEvidence(candidate.evidence))
  const droppedAtEvidence = enriched
    .filter((candidate) => !hasVerifiedEvidence(candidate.evidence))
    .map((candidate) => {
      const status =
        candidate.evidence[0]?.verificationStatus ||
        (candidate.opportunity.sourceUrl ? "unverified" : "missing_source_url")
      return {
        id: candidate.opportunity.id,
        category: candidate.opportunity.category || "unknown",
        sourceUrl: candidate.opportunity.sourceUrl,
        status,
      }
    })

  console.info(
    `[production-pipeline] Evidence: ${verified.length}/${enriched.length} usable; ` +
      `dropped=${droppedAtEvidence.map((item) => `${item.id}:${item.status}`).join(", ") || "none"}`
  )

  const selectionContext = { recentTopicKeys: recentTopicKeysFromContext(context) }
  const stage1 = await runStage1Discovery(context, enriched)

  if (!stage1.ok) {
    console.error(
      "[production-pipeline] Stage 1 failed:",
      stage1.reason,
      stage1.detail || "",
      `verifiedEvidence=${verified.length}`
    )
    if (verified.length > 0) {
      const fallbackCandidates = verified
        .slice(0, MAX_RECOMMENDATIONS * 3)
        .map((candidate) => mapVerifiedFallback(candidate.opportunity, candidate.evidence))
      const selection = selectFinalRecommendations(fallbackCandidates, selectionContext)
      console.warn(
        `[production-pipeline] Stage 1 fallback: ${selection.recommendations.length} recommendation(s) (${stage1.reason}).`
      )
      return {
        approved: selection.recommendations,
        rejectedCount: ranked.length - selection.recommendations.length,
        selectionSummary: selection.selectionSummary,
        noRecommendationReason: selection.noRecommendationReason,
        diagnostics: emptyDiagnostics({
          verifiedEvidence: verified.length,
          droppedAtEvidence,
          stage1Reason: stage1.reason,
          stage1Detail: stage1.detail,
          approvedCount: selection.recommendations.length,
          usedDeterministicFallback: true,
          fallbackReason: `stage1_${stage1.reason}`,
        }),
      }
    }
    const empty = selectFinalRecommendations([])
    return {
      approved: [],
      rejectedCount: ranked.length,
      selectionSummary: empty.selectionSummary,
      noRecommendationReason: empty.noRecommendationReason,
      diagnostics: emptyDiagnostics({
        verifiedEvidence: 0,
        droppedAtEvidence,
        stage1Reason: stage1.reason,
        stage1Detail: stage1.detail,
        fallbackReason: "stage1_failed_no_verified_evidence",
      }),
    }
  }

  const sourceById = new Map(ranked.map((opportunity) => [opportunity.id, opportunity]))
  const stage1Candidates: RankedExternalOpportunity[] = []
  for (const recommendation of stage1.data.recommendations) {
    if (recommendation.status === "needs_human_review") continue
    const source = sourceById.get(recommendation.id)
    if (!source) continue
    stage1Candidates.push(mapStage1Recommendation(source, recommendation))
  }

  let selection = selectFinalRecommendations(stage1Candidates, selectionContext)

  if (selection.recommendations.length === 0 && verified.length > 0) {
    const fallbackCandidates = verified
      .slice(0, MAX_RECOMMENDATIONS * 3)
      .map((candidate) => mapVerifiedFallback(candidate.opportunity, candidate.evidence))
    selection = selectFinalRecommendations(fallbackCandidates, selectionContext)
    console.warn(
      `[production-pipeline] Stage 1 approved 0; fallback kept ${selection.recommendations.length} verified item(s).`
    )
    return {
      approved: selection.recommendations,
      rejectedCount: ranked.length - selection.recommendations.length,
      selectionSummary: selection.selectionSummary,
      noRecommendationReason: selection.noRecommendationReason,
      diagnostics: emptyDiagnostics({
        verifiedEvidence: verified.length,
        droppedAtEvidence,
        approvedCount: selection.recommendations.length,
        usedDeterministicFallback: true,
        fallbackReason: "stage1_empty_verified_kept",
      }),
      stage1Summary: stage1.data.runSummary,
    }
  }

  return {
    approved: selection.recommendations,
    rejectedCount: ranked.length - selection.recommendations.length,
    selectionSummary: selection.selectionSummary,
    noRecommendationReason: selection.noRecommendationReason,
    diagnostics: emptyDiagnostics({
      verifiedEvidence: verified.length,
      droppedAtEvidence,
      approvedCount: selection.recommendations.length,
      usedDeterministicFallback: false,
    }),
    stage1Summary: stage1.data.runSummary,
  }
}
