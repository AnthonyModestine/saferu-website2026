import type { ExternalOpportunityInput, PostOpportunity } from "./types"
import { DEFAULT_DAILY_RECOMMENDATION_LIMIT } from "./types"
import { topicKey } from "./rank-opportunities"

/** Snapshot enough fields to restore a live briefing card on refresh. */
export function postOpportunityToRetainInput(opp: PostOpportunity): ExternalOpportunityInput {
  return {
    id: opp.id,
    title: opp.title,
    summary: opp.summary || opp.whyItMatters || "",
    category: opp.category || "community_update",
    sourceLabel: (opp.sourceLabel || "Current Local Opportunity") as ExternalOpportunityInput["sourceLabel"],
    whyItMatters: opp.whyItMatters || opp.surfacedReason || opp.summary || "",
    recommendedAction: opp.recommendedAction || "Share the verified update with residents.",
    recommendedPostTiming: opp.recommendedPostTiming || "Post today while still timely.",
    priority: opp.priority === "urgent" ? "urgent" : "recommended_today",
    signals: opp.signals ?? [],
    sourceName: opp.sourceName || opp.issuingAuthority || opp.sourceLabel,
    sourceUrl: opp.sourceUrl,
    issuingAuthority: opp.issuingAuthority,
    eventStart: opp.eventStart,
    eventEnd: opp.eventEnd,
    verifiedFacts: opp.verifiedFacts ?? [],
    publicCallToAction: opp.publicCallToAction ?? [],
    doNotClaim: opp.doNotClaim ?? [],
    confidenceLevel: opp.confidenceLevel || "medium",
    jurisdictionFit: opp.jurisdictionFit,
    recommendationTier: opp.recommendationTier,
    suggestedMessage: opp.curatedMessage || opp.curated?.message,
    qualityGateStatus: opp.qualityGateStatus,
  }
}

/**
 * When the user regenerates, keep still-valid cards that discovery would have
 * dropped due to non-deterministic AI / pipeline variance.
 */
export function mergeRetainedBriefingItems(
  current: ExternalOpportunityInput[],
  retained: ExternalOpportunityInput[],
  dismissedIds: string[] = []
): ExternalOpportunityInput[] {
  const dismissed = new Set(dismissedIds.map(String))
  const result = [...current]
  const ids = new Set(current.map((opp) => opp.id))
  const families = new Set(current.map((opp) => topicKey(opp)))

  for (const kept of retained) {
    if (!kept.id || dismissed.has(kept.id)) continue
    if (ids.has(kept.id)) continue
    const family = topicKey(kept)
    if (families.has(family)) continue
    if (!kept.title?.trim()) continue
    const hasSource = Boolean(kept.sourceUrl?.trim())
    const hasSubstance =
      Boolean(kept.summary?.trim()) ||
      Boolean(kept.whyItMatters?.trim()) ||
      Boolean(kept.verifiedFacts?.length) ||
      Boolean(kept.suggestedMessage?.trim())
    if (!hasSource && !hasSubstance) continue
    result.push(kept)
    ids.add(kept.id)
    families.add(family)
    if (result.length >= DEFAULT_DAILY_RECOMMENDATION_LIMIT) break
  }

  return result.slice(0, DEFAULT_DAILY_RECOMMENDATION_LIMIT)
}

export function parseRetainBriefingInput(
  raw: unknown
): ExternalOpportunityInput[] {
  if (!Array.isArray(raw)) return []
  const items: ExternalOpportunityInput[] = []
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue
    const opp = entry as Record<string, unknown>
    const title = String(opp.title || "").trim()
    const sourceUrl = String(opp.sourceUrl || "").trim()
    const summary = String(opp.summary || opp.whyItMatters || "").trim()
    const verifiedFacts = Array.isArray(opp.verifiedFacts)
      ? opp.verifiedFacts.map(String).filter(Boolean)
      : []
    const suggestedMessage = String(opp.suggestedMessage || "").trim()
    if (!title) continue
    if (!sourceUrl && !summary && !verifiedFacts.length && !suggestedMessage) continue
    items.push({
      id: String(opp.id || `retain-${title.slice(0, 40)}`),
      title,
      summary,
      category: String(opp.category || "community_update").trim(),
      sourceLabel: (String(opp.sourceLabel || "Current Local Opportunity") ||
        "Current Local Opportunity") as ExternalOpportunityInput["sourceLabel"],
      whyItMatters: String(opp.whyItMatters || opp.summary || title).trim(),
      recommendedAction: String(
        opp.recommendedAction || "Share the verified update with residents."
      ).trim(),
      recommendedPostTiming: String(
        opp.recommendedPostTiming || "Post today while still timely."
      ).trim(),
      priority:
        opp.priority === "urgent" ? "urgent" : ("recommended_today" as const),
      signals: Array.isArray(opp.signals) ? opp.signals.map(String) : [],
      sourceName: String(opp.sourceName || opp.issuingAuthority || "Official source").trim(),
      sourceUrl: sourceUrl || undefined,
      issuingAuthority: opp.issuingAuthority
        ? String(opp.issuingAuthority)
        : undefined,
      eventStart: opp.eventStart ? String(opp.eventStart) : undefined,
      eventEnd: opp.eventEnd ? String(opp.eventEnd) : undefined,
      verifiedFacts,
      publicCallToAction: Array.isArray(opp.publicCallToAction)
        ? opp.publicCallToAction.map(String).filter(Boolean)
        : [],
      doNotClaim: Array.isArray(opp.doNotClaim)
        ? opp.doNotClaim.map(String).filter(Boolean)
        : [],
      suggestedMessage: suggestedMessage || undefined,
      recommendationTier:
        opp.recommendationTier === "could_post" ? "could_post" : "top_recommended",
      confidenceLevel:
        opp.confidenceLevel === "high" || opp.confidenceLevel === "low"
          ? opp.confidenceLevel
          : "medium",
      jurisdictionFit:
        opp.jurisdictionFit === "own" ||
        opp.jurisdictionFit === "nearby" ||
        opp.jurisdictionFit === "regional" ||
        opp.jurisdictionFit === "unknown"
          ? opp.jurisdictionFit
          : undefined,
    })
  }
  return items
}
