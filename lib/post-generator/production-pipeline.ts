import { runStage1Discovery } from "@/lib/post-generator/stage-1-discovery"
import { runStage2Writer } from "@/lib/post-generator/stage-2-writer"
import { runStage3QualityGate } from "@/lib/post-generator/stage-3-quality-gate"
import { verifyRankedEvidence } from "@/lib/post-generator/evidence"
import type {
  PipelineAgencyContext,
  Stage1Recommendation,
} from "@/lib/post-generator/pipeline-types"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"

export interface ProductionPipelineResult {
  approved: RankedExternalOpportunity[]
  rejectedCount: number
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

/**
 * Production three-stage pipeline. Failures are fail-closed: no draft is surfaced
 * unless it passes evidence retrieval, strategy, writing, and final quality review.
 */
export async function runProductionPostPipeline(
  context: PipelineAgencyContext,
  ranked: RankedExternalOpportunity[]
): Promise<ProductionPipelineResult> {
  if (!ranked.length) return { approved: [], rejectedCount: 0 }

  const candidates = await verifyRankedEvidence(ranked)
  const stage1 = await runStage1Discovery(context, candidates)
  if (!stage1.ok) {
    console.error("[production-pipeline] Stage 1 failed closed:", stage1.reason, stage1.detail || "")
    return { approved: [], rejectedCount: ranked.length }
  }

  const sourceById = new Map(ranked.map((opportunity) => [opportunity.id, opportunity]))
  const approved: RankedExternalOpportunity[] = []
  for (const recommendation of stage1.data.recommendations) {
    if (recommendation.status === "needs_human_review") continue
    const source = sourceById.get(recommendation.id)
    if (!source) continue

    const stage2 = await runStage2Writer(context, recommendation)
    if (!stage2.ok || stage2.data.status !== "approved" || !stage2.data.postText.trim()) {
      console.warn(
        `[production-pipeline] Stage 2 rejected ${recommendation.id}:`,
        stage2.ok ? stage2.data.humanReviewReason : stage2.reason
      )
      continue
    }

    const stage3 = await runStage3QualityGate(context, recommendation, stage2.data)
    if (!stage3.ok) {
      console.warn(
        `[production-pipeline] Stage 3 failed ${recommendation.id}:`,
        stage3.reason,
        stage3.detail || ""
      )
      continue
    }
    const qualityGate = stage3.data
    if (
      (qualityGate.status !== "approved" && qualityGate.status !== "approved_with_revision") ||
      !qualityGate.finalPostText.trim()
    ) {
      console.warn(
        `[production-pipeline] Stage 3 rejected ${recommendation.id}:`,
        qualityGate.humanReviewReason
      )
      continue
    }

    approved.push({
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
      suggestedMessage: qualityGate.finalPostText,
      communicationPillar: recommendation.communicationPillar,
      communicationGoal: recommendation.communicationGoal,
      whyNow: recommendation.whyNow,
      whyThisAgency: recommendation.whyThisAgency,
      whyThisCommunity: recommendation.whyThisCommunity,
      residentValue: recommendation.residentValue,
      relationshipValue: recommendation.relationshipValue,
      issuingAuthority: recommendation.issuingAuthority,
      supportingSources: recommendation.supportingSources,
      qualityGateStatus: qualityGate.status,
      confidenceLevel: recommendation.sourceConfidence,
    })
  }
  return {
    approved,
    rejectedCount: ranked.length - approved.length,
    stage1Summary: stage1.data.runSummary,
  }
}
