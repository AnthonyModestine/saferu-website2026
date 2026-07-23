import type { RankedExternalOpportunity } from "@/lib/post-generator/types"
import {
  MAX_RECOMMENDATIONS,
  MIN_RECOMMENDATION_SCORE,
  NO_RECOMMENDATION_MESSAGE,
} from "./constants"
import {
  type CandidateScoringContext,
  scorePioCandidate,
  topicFamily,
} from "./candidate-scoring"

export interface RecommendationSelectionResult {
  recommendations: RankedExternalOpportunity[]
  rejectedCandidateCount: number
  selectionSummary: string
  noRecommendationReason: string | null
}

function priorityRank(opp: RankedExternalOpportunity): number {
  if (opp.priority === "urgent") return 0
  if (opp.priority === "recommended_today") return 1
  if (opp.priority === "plan_ahead") return 2
  return 3
}

function narrowCategory(opp: RankedExternalOpportunity): string {
  return topicFamily(opp.category || opp.sourceLabel || "other")
}

export function selectFinalRecommendations(
  candidates: RankedExternalOpportunity[],
  ctx: CandidateScoringContext = {}
): RecommendationSelectionResult {
  const scored = candidates.map((candidate) => scorePioCandidate(candidate, ctx))
  const eligible = scored
    .filter((item) => item.eligible)
    .sort((a, b) => {
      const priorityDiff = priorityRank(a.opportunity) - priorityRank(b.opportunity)
      if (priorityDiff !== 0) return priorityDiff
      return b.score - a.score
    })

  const rejectedCandidateCount = scored.length - eligible.length
  const selected: RankedExternalOpportunity[] = []
  const categoryCounts = new Map<string, number>()

  for (const item of eligible) {
    if (selected.length >= MAX_RECOMMENDATIONS) break
    const category = narrowCategory(item.opportunity)
    const count = categoryCounts.get(category) ?? 0
    if (count >= 2) continue
    selected.push({
      ...item.opportunity,
      whyNow: item.opportunity.whyNow || item.opportunity.surfacedReason,
      surfacedReason: item.opportunity.surfacedReason || item.opportunity.whyNow,
      suggestedMessage: undefined,
    })
    categoryCounts.set(category, count + 1)
  }

  if (!selected.length) {
    return {
      recommendations: [],
      rejectedCandidateCount: Math.max(rejectedCandidateCount, candidates.length),
      selectionSummary:
        "No candidates met the relevance, timing, verification and post-value-today standards.",
      noRecommendationReason: NO_RECOMMENDATION_MESSAGE,
    }
  }

  const summary =
    selected.length === 1
      ? "One verified topic met the PIO quality threshold for today."
      : `${selected.length} verified topics met the PIO quality threshold (minimum score ${MIN_RECOMMENDATION_SCORE}).`

  return {
    recommendations: selected,
    rejectedCandidateCount,
    selectionSummary: summary,
    noRecommendationReason: null,
  }
}
