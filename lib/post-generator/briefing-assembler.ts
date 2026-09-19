import type { ExternalOpportunityInput, RankedExternalOpportunity } from "./types"
import { topicKey } from "./rank-opportunities"
import { isTrustedSourceUrl } from "./trusted-sources"
import {
  isRescuableOfficialCandidate,
  promoteDiscoveryCandidates,
  rescueOfficialRankedCandidates,
} from "./official-rescue"
import type { PipelineAgencyContext } from "./pipeline-types"
import { runProductionPostPipeline } from "./production-pipeline"
import { MAX_RECOMMENDATIONS } from "./recommendation/constants"

function isFastPathBriefingCandidate(opp: RankedExternalOpportunity): boolean {
  if (isRescuableOfficialCandidate(opp)) return true
  const url = opp.sourceUrl?.trim()
  const facts = opp.verifiedFacts?.length ?? 0
  if (!url || facts < 1) return false
  if (
    opp.sourceLabel === "Current Local Opportunity" ||
    opp.sourceLabel === "Weather Analysis"
  ) {
    return isTrustedSourceUrl(url, opp.sourceName)
  }
  return false
}

export function mergeBriefingRecommendations(
  primary: RankedExternalOpportunity[],
  extra: RankedExternalOpportunity[],
  limit = MAX_RECOMMENDATIONS
): RankedExternalOpportunity[] {
  const seenFamilies = new Set(primary.map((opp) => topicKey(opp)))
  const seenIds = new Set(primary.map((opp) => opp.id))
  const merged = [...primary]

  for (const opp of extra) {
    if (merged.length >= limit) break
    if (seenIds.has(opp.id)) continue
    const family = topicKey(opp)
    if (seenFamilies.has(family)) continue
    merged.push(opp)
    seenIds.add(opp.id)
    seenFamilies.add(family)
  }

  return merged
}

export type BriefingAssemblyResult = {
  approved: RankedExternalOpportunity[]
  pipelineSummary?: Awaited<ReturnType<typeof runProductionPostPipeline>>["stage1Summary"]
  pipelineDiagnostics?: Awaited<ReturnType<typeof runProductionPostPipeline>>["diagnostics"]
  selectionSummary?: string
  noRecommendationReason?: string | null
  rejectedCount?: number
  usedFastPath: boolean
}

/**
 * Official scanner results (NWS, .gov, NIFC, etc.) skip the heavy Stage-1 pipeline.
 * Raw discovery always tops up the briefing so verified sources are not lost to variance.
 */
export async function assembleBriefingRecommendations(
  context: PipelineAgencyContext,
  ranked: RankedExternalOpportunity[],
  rawCandidates: ExternalOpportunityInput[]
): Promise<BriefingAssemblyResult> {
  const fastPath = ranked.filter((opp) => isFastPathBriefingCandidate(opp))
  const pipelineInput = ranked.filter((opp) => !isFastPathBriefingCandidate(opp))

  let approved: RankedExternalOpportunity[] = []
  let pipelineSummary: BriefingAssemblyResult["pipelineSummary"]
  let pipelineDiagnostics: BriefingAssemblyResult["pipelineDiagnostics"]
  let selectionSummary: string | undefined
  let noRecommendationReason: string | null | undefined
  let rejectedCount = 0

  if (fastPath.length > 0) {
    approved = rescueOfficialRankedCandidates(fastPath, MAX_RECOMMENDATIONS)
    selectionSummary = `Surfaced ${approved.length} verified official source(s) for your area.`
    noRecommendationReason = approved.length > 0 ? null : undefined
  }

  if (pipelineInput.length > 0) {
    const pipeline = await runProductionPostPipeline(context, pipelineInput)
    approved = mergeBriefingRecommendations(approved, pipeline.approved)
    pipelineSummary = pipeline.stage1Summary
    pipelineDiagnostics = pipeline.diagnostics
    if (pipeline.selectionSummary) selectionSummary = pipeline.selectionSummary
    if (pipeline.noRecommendationReason !== undefined) {
      noRecommendationReason = pipeline.noRecommendationReason
    }
    rejectedCount += pipeline.rejectedCount
  }

  if (approved.length < MAX_RECOMMENDATIONS) {
    const rescued = rescueOfficialRankedCandidates(
      [...fastPath, ...pipelineInput],
      MAX_RECOMMENDATIONS
    )
    approved = mergeBriefingRecommendations(approved, rescued)
  }

  if (approved.length < MAX_RECOMMENDATIONS) {
    const promoted = promoteDiscoveryCandidates(
      rawCandidates,
      MAX_RECOMMENDATIONS - approved.length
    )
    if (promoted.length > 0) {
      approved = mergeBriefingRecommendations(approved, promoted)
      selectionSummary =
        approved.length > 0
          ? `Surfaced ${approved.length} verified source(s) for your area.`
          : selectionSummary
      noRecommendationReason = approved.length > 0 ? null : noRecommendationReason
    }
  }

  return {
    approved: approved.slice(0, MAX_RECOMMENDATIONS),
    pipelineSummary,
    pipelineDiagnostics,
    selectionSummary,
    noRecommendationReason: approved.length > 0 ? null : noRecommendationReason,
    rejectedCount,
    usedFastPath: fastPath.length > 0,
  }
}
