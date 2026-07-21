import { runStage1Discovery } from "@/lib/post-generator/stage-1-discovery"
import { runStage2Writer } from "@/lib/post-generator/stage-2-writer"
import { runStage3QualityGate } from "@/lib/post-generator/stage-3-quality-gate"
import { verifyRankedEvidence } from "@/lib/post-generator/evidence"
import {
  isKeepableWithoutPerfectEvidence,
  provisionalEvidenceFromOpportunity,
} from "@/lib/post-generator/source-retention"
import { withPioAgencyAttribution } from "@/lib/post-generator/caption-voice"
import { isWeatherAlertOpportunity } from "@/lib/post-generator/weather-alert-message"
import { resolveOpportunityMessage } from "@/lib/post-generator/opportunity-message-ai"
import type {
  PipelineAgencyContext,
  Stage1Recommendation,
  VerifiedEvidenceRecord,
} from "@/lib/post-generator/pipeline-types"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"

const TARGET_APPROVED = 5

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

function qualityGateStatusForApi(
  status: "approved" | "edited" | "needs_human_review"
): RankedExternalOpportunity["qualityGateStatus"] {
  if (status === "edited") return "approved_with_revision"
  return status
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

function attributionContext(
  opportunity: RankedExternalOpportunity
): {
  title: string
  sourceName?: string
  issuingAuthority?: string
  sourceLabel?: string
} {
  return {
    title: opportunity.title,
    sourceName: opportunity.sourceName,
    issuingAuthority: opportunity.issuingAuthority,
    sourceLabel: opportunity.sourceLabel,
  }
}

async function deterministicMessage(
  opportunity: RankedExternalOpportunity,
  context: PipelineAgencyContext
): Promise<string> {
  if (opportunity.suggestedMessage?.trim() && !isWeatherAlertOpportunity(opportunity)) {
    const ctx = attributionContext(opportunity)
    return withPioAgencyAttribution(opportunity.suggestedMessage, context.agencyName, ctx)
  }
  return resolveOpportunityMessage(opportunity, context)
}

async function buildDeterministicApproved(
  opportunity: RankedExternalOpportunity,
  evidence: VerifiedEvidenceRecord[],
  context: PipelineAgencyContext
): Promise<RankedExternalOpportunity> {
  const facts = evidence.flatMap((record) => record.facts.map((fact) => fact.claim))
  const primary = evidence.find((record) => record.verificationStatus === "verified")
  return {
    ...opportunity,
    sourceName: primary?.sourceName || opportunity.sourceName,
    sourceUrl: primary?.sourceUrl || opportunity.sourceUrl,
    verifiedFacts: facts.length ? facts : opportunity.verifiedFacts,
    issuingAuthority:
      primary?.issuingAuthority || opportunity.issuingAuthority || opportunity.sourceName,
    suggestedMessage: await deterministicMessage(opportunity, context),
    qualityGateStatus: "approved",
    confidenceLevel: opportunity.confidenceLevel === "low" ? "medium" : opportunity.confidenceLevel,
  }
}

async function fillApprovedToTarget(
  approved: RankedExternalOpportunity[],
  verified: Array<{ opportunity: RankedExternalOpportunity; evidence: VerifiedEvidenceRecord[] }>,
  context: PipelineAgencyContext
): Promise<RankedExternalOpportunity[]> {
  if (approved.length >= TARGET_APPROVED) return approved
  const seen = new Set(approved.map((item) => item.id))
  const next = [...approved]
  for (const candidate of verified) {
    if (next.length >= TARGET_APPROVED) break
    if (seen.has(candidate.opportunity.id)) continue
    next.push(
      await buildDeterministicApproved(candidate.opportunity, candidate.evidence, context)
    )
    seen.add(candidate.opportunity.id)
  }
  return next
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

  const stage1 = await runStage1Discovery(context, enriched)
  if (!stage1.ok) {
    console.error(
      "[production-pipeline] Stage 1 failed:",
      stage1.reason,
      stage1.detail || "",
      `verifiedEvidence=${verified.length}`
    )
    if (verified.length > 0) {
      let approved = await Promise.all(
        verified
          .slice(0, TARGET_APPROVED)
          .map((candidate) =>
            buildDeterministicApproved(candidate.opportunity, candidate.evidence, context)
          )
      )
      approved = await fillApprovedToTarget(approved, verified, context)
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
  const evidenceById = new Map(
    enriched.map((candidate) => [candidate.opportunity.id, candidate.evidence])
  )
  const approved: RankedExternalOpportunity[] = []
  for (const recommendation of stage1.data.recommendations) {
    if (recommendation.status === "needs_human_review") continue
    const source = sourceById.get(recommendation.id)
    if (!source) continue

    const stage2 = await runStage2Writer(context, recommendation, source)
    if (!stage2.ok || stage2.data.status !== "ready" || !stage2.data.postText.trim()) {
      console.warn(
        `[production-pipeline] Stage 2 rejected ${recommendation.id}:`,
        stage2.ok ? stage2.data.humanReviewReason : stage2.reason
      )
      const evidence = evidenceById.get(source.id) ?? []
      approved.push(await buildDeterministicApproved(source, evidence, context))
      continue
    }

    const stage3 = await runStage3QualityGate(context, recommendation, stage2.data, source)
    if (!stage3.ok) {
      console.warn(
        `[production-pipeline] Stage 3 failed ${recommendation.id}:`,
        stage3.reason,
        stage3.detail || ""
      )
      const evidence = evidenceById.get(source.id) ?? []
      approved.push(await buildDeterministicApproved(source, evidence, context))
      continue
    }
    const qualityGate = stage3.data
    if (
      (qualityGate.status !== "approved" && qualityGate.status !== "edited") ||
      !qualityGate.finalPostText.trim()
    ) {
      console.warn(
        `[production-pipeline] Stage 3 rejected ${recommendation.id}:`,
        qualityGate.humanReviewReason
      )
      const evidence = evidenceById.get(source.id) ?? []
      approved.push(await buildDeterministicApproved(source, evidence, context))
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
      qualityGateStatus: qualityGateStatusForApi(qualityGate.status),
      confidenceLevel: recommendation.sourceConfidence,
    })
  }

  let finalApproved = await fillApprovedToTarget(approved, verified, context)

  if (finalApproved.length === 0 && verified.length > 0) {
    finalApproved = await Promise.all(
      verified
        .slice(0, TARGET_APPROVED)
        .map((candidate) =>
          buildDeterministicApproved(candidate.opportunity, candidate.evidence, context)
        )
    )
    console.warn(
      `[production-pipeline] AI stages approved 0; keeping ${finalApproved.length} verified ranked item(s).`
    )
    return {
      approved: finalApproved,
      rejectedCount: ranked.length - finalApproved.length,
      diagnostics: emptyDiagnostics({
        verifiedEvidence: verified.length,
        droppedAtEvidence,
        approvedCount: finalApproved.length,
        usedDeterministicFallback: true,
        fallbackReason: "ai_stages_empty_verified_kept",
      }),
      stage1Summary: stage1.data.runSummary,
    }
  }

  return {
    approved: finalApproved,
    rejectedCount: ranked.length - finalApproved.length,
    diagnostics: emptyDiagnostics({
      verifiedEvidence: verified.length,
      droppedAtEvidence,
      approvedCount: finalApproved.length,
      usedDeterministicFallback: finalApproved.length > approved.length,
      fallbackReason:
        finalApproved.length > approved.length ? "filled_to_target_from_verified" : undefined,
    }),
    stage1Summary: stage1.data.runSummary,
  }
}
