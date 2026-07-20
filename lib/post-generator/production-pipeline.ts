import { runStage1Discovery } from "@/lib/post-generator/stage-1-discovery"
import { runStage2Writer } from "@/lib/post-generator/stage-2-writer"
import { runStage3QualityGate } from "@/lib/post-generator/stage-3-quality-gate"
import { verifyRankedEvidence } from "@/lib/post-generator/evidence"
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

function deterministicMessage(opportunity: RankedExternalOpportunity): string {
  if (opportunity.suggestedMessage?.trim()) return opportunity.suggestedMessage.trim()
  const actions = (opportunity.publicCallToAction ?? []).slice(0, 2)
  return [opportunity.summary, ...actions].filter(Boolean).join("\n\n")
}

/**
 * Keep already-ranked, evidence-verified opportunities when the AI stages fail.
 * Uses only discovery-time verified facts — does not invent new incident details.
 */
function buildDeterministicApproved(
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
    suggestedMessage: deterministicMessage(opportunity),
    qualityGateStatus: "approved",
    confidenceLevel: opportunity.confidenceLevel === "low" ? "medium" : opportunity.confidenceLevel,
  }
}

/**
 * Production three-stage pipeline. Unverified inventable claims stay fail-closed.
 * Verified official/trusted ranked items are preserved when Stage 1/2/3 fail so
 * the briefing does not collapse to SaferU curated-only.
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
    return { approved: [], rejectedCount: 0, diagnostics: emptyDiagnostics() }
  }

  const candidates = await verifyRankedEvidence(ranked)
  const verified = candidates.filter((candidate) => hasVerifiedEvidence(candidate.evidence))
  const droppedAtEvidence = candidates
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
    `[production-pipeline] Evidence: ${verified.length}/${candidates.length} verified; ` +
      `dropped=${droppedAtEvidence.map((item) => `${item.id}:${item.status}`).join(", ") || "none"}`
  )

  const stage1 = await runStage1Discovery(context, candidates)
  if (!stage1.ok) {
    console.error(
      "[production-pipeline] Stage 1 failed:",
      stage1.reason,
      stage1.detail || "",
      `verifiedEvidence=${verified.length}`
    )
    if (verified.length > 0) {
      const approved = verified
        .slice(0, 4)
        .map((candidate) =>
          buildDeterministicApproved(candidate.opportunity, candidate.evidence)
        )
      console.warn(
        `[production-pipeline] Keeping ${approved.length} verified ranked item(s) after Stage 1 failure (${stage1.reason}).`
      )
      return {
        approved,
        rejectedCount: ranked.length - approved.length,
        diagnostics: emptyDiagnostics({
          verifiedEvidence: verified.length,
          droppedAtEvidence,
          stage1Reason: stage1.reason,
          stage1Detail: stage1.detail,
          approvedCount: approved.length,
          usedDeterministicFallback: true,
          fallbackReason: `stage1_${stage1.reason}`,
        }),
      }
    }
    return {
      approved: [],
      rejectedCount: ranked.length,
      diagnostics: emptyDiagnostics({
        verifiedEvidence: 0,
        droppedAtEvidence,
        stage1Reason: stage1.reason,
        stage1Detail: stage1.detail,
        approvedCount: 0,
        usedDeterministicFallback: false,
        fallbackReason: "stage1_failed_no_verified_evidence",
      }),
    }
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

  if (approved.length === 0 && verified.length > 0) {
    const fallback = verified
      .slice(0, 4)
      .map((candidate) => buildDeterministicApproved(candidate.opportunity, candidate.evidence))
    console.warn(
      `[production-pipeline] AI stages approved 0; keeping ${fallback.length} verified ranked item(s).`
    )
    return {
      approved: fallback,
      rejectedCount: ranked.length - fallback.length,
      diagnostics: emptyDiagnostics({
        verifiedEvidence: verified.length,
        droppedAtEvidence,
        approvedCount: fallback.length,
        usedDeterministicFallback: true,
        fallbackReason: "ai_stages_empty_verified_kept",
      }),
      stage1Summary: stage1.data.runSummary,
    }
  }

  return {
    approved,
    rejectedCount: ranked.length - approved.length,
    diagnostics: emptyDiagnostics({
      verifiedEvidence: verified.length,
      droppedAtEvidence,
      approvedCount: approved.length,
      usedDeterministicFallback: false,
    }),
    stage1Summary: stage1.data.runSummary,
  }
}
