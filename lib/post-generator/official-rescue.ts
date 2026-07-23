import type {
  ExternalOpportunityInput,
  OpportunityInternalScores,
  RankedExternalOpportunity,
} from "./types"

function isSeasonalFiller(input: ExternalOpportunityInput): boolean {
  if (input.sourceLabel === "Seasonal Recommendation") return true
  if (input.id.startsWith("calendar-")) return true
  if ((input.category || "").toLowerCase() === "holiday_safety") return true
  return false
}

function hasTrustedDiscoverySource(input: ExternalOpportunityInput): boolean {
  const url = (input.sourceUrl || "").trim().toLowerCase()
  if (!url) return false
  if (/\.gov(\/|$)/i.test(url)) return true
  if (/api\.weather\.gov/i.test(url)) return true
  if (/ic3\.gov|fbi\.gov|ftc\.gov|cisa\.gov|usgs\.gov/i.test(url)) return true
  return false
}

/** Raw discovery item worth surfacing when strict ranking returns zero. */
export function isPromotableDiscoveryCandidate(input: ExternalOpportunityInput): boolean {
  const facts = input.verifiedFacts?.length ?? 0
  const url = (input.sourceUrl || "").trim()
  if (!url || facts === 0) return false
  if (isSeasonalFiller(input)) return false

  const label = input.sourceLabel || ""
  if (
    label === "Weather Alert" ||
    label === "Federal Advisory" ||
    label === "National Safety Alert" ||
    label === "Current Local Opportunity"
  ) {
    return true
  }
  if (hasTrustedDiscoverySource(input)) return true
  if (input.confidenceLevel === "high" && facts >= 2) return true
  return false
}

function syntheticScores(input: ExternalOpportunityInput): OpportunityInternalScores {
  const urgent = input.priority === "urgent"
  const national =
    input.sourceLabel === "National Safety Alert" ||
    input.sourceLabel === "Federal Advisory" ||
    /ic3\.gov|fbi\.gov/i.test(input.sourceUrl || "")
  return {
    agencyRelevance: national ? 72 : 78,
    geographicRelevance: national ? 58 : 82,
    residentValue: 82,
    actionability: 76,
    urgency: urgent ? 92 : 70,
    sourceTrust: 90,
    seasonalRelevance: 55,
    engagementPotential: 68,
    freshness: 80,
    composite: 74,
    pioRating: 4,
    agencyFitReason: "Verified official source discovered for this briefing.",
    messagingAngle: national
      ? "Share as a federal public-safety advisory relevant to residents."
      : "Share as a verified local public-safety update.",
  }
}

function jurisdictionFor(input: ExternalOpportunityInput): RankedExternalOpportunity["jurisdictionFit"] {
  const label = input.sourceLabel || ""
  if (label === "Weather Alert" || label === "Current Local Opportunity") return "own"
  if (label === "National Safety Alert" || label === "Federal Advisory") return "regional"
  if (/\.gov(\/|$)/i.test(input.sourceUrl || "")) return "own"
  return input.jurisdictionFit || "unknown"
}

/** Official or high-trust items that already passed initial ranking should not disappear entirely. */
export function isRescuableOfficialCandidate(
  opportunity: RankedExternalOpportunity
): boolean {
  return isPromotableDiscoveryCandidate(opportunity)
}

export function promoteDiscoveryCandidates(
  candidates: ExternalOpportunityInput[],
  limit = 4
): RankedExternalOpportunity[] {
  const seen = new Set<string>()
  const promoted: RankedExternalOpportunity[] = []

  const ordered = [...candidates].sort((a, b) => {
    const priority = { urgent: 0, recommended_today: 1, plan_ahead: 2, optional: 3 }
    return (priority[a.priority] ?? 9) - (priority[b.priority] ?? 9)
  })

  for (const input of ordered) {
    if (!isPromotableDiscoveryCandidate(input)) continue
    const key = input.id || input.title.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const whyNow =
      input.whyNow ||
      input.surfacedReason ||
      input.whyItMatters ||
      "Verified update residents in your service area should know about."

    promoted.push({
      ...input,
      jurisdictionFit: jurisdictionFor(input),
      recommendationTier: "top_recommended",
      whyNow,
      surfacedReason: input.surfacedReason || whyNow,
      qualityGateStatus: "approved",
      suggestedMessage: undefined,
      internalScores: input.internalScores ?? syntheticScores(input),
    })
    if (promoted.length >= limit) break
  }

  return promoted
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
