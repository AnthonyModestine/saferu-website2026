import type { RankedExternalOpportunity } from "./types"

/** Official or high-trust items that already passed initial ranking should not disappear entirely. */
export function isRescuableOfficialCandidate(
  opportunity: RankedExternalOpportunity
): boolean {
  const label = opportunity.sourceLabel || ""
  const url = (opportunity.sourceUrl || "").trim()
  const facts = opportunity.verifiedFacts?.length ?? 0

  if (label === "Weather Alert" || label === "Federal Advisory") return true
  if (opportunity.priority === "urgent") return facts > 0
  if (/\.gov(\/|$)/i.test(url) && facts > 0) return true
  if (
    label === "Current Local Opportunity" &&
    facts > 0 &&
    (opportunity.confidenceLevel === "high" ||
      (opportunity.internalScores?.sourceTrust ?? 0) >= 70)
  ) {
    return true
  }
  return false
}

export function rescueOfficialRankedCandidates(
  candidates: RankedExternalOpportunity[],
  limit = 4
): RankedExternalOpportunity[] {
  const seen = new Set<string>()
  const rescued: RankedExternalOpportunity[] = []

  for (const opportunity of candidates) {
    if (!isRescuableOfficialCandidate(opportunity)) continue
    const key = opportunity.id || opportunity.title
    if (seen.has(key)) continue
    seen.add(key)
    rescued.push({
      ...opportunity,
      whyNow:
        opportunity.whyNow ||
        opportunity.surfacedReason ||
        opportunity.whyItMatters ||
        "Verified update relevant to residents in your service area.",
      surfacedReason:
        opportunity.surfacedReason ||
        opportunity.whyNow ||
        opportunity.whyItMatters,
      qualityGateStatus: "approved",
      recommendationTier: opportunity.recommendationTier || "top_recommended",
      suggestedMessage: undefined,
    })
    if (rescued.length >= limit) break
  }

  return rescued
}
