/**
 * Ranked recommendations that already passed PIO scoring should not all die
 * just because claim-token evidence matching is imperfect — especially for
 * official feeds and established local media with a specific article/alert URL.
 */

import { isLikelyHomepageUrl } from "./source-standards"
import { isNationalValueSource } from "./trusted-sources"
import type { RankedExternalOpportunity } from "./types"
import type { VerifiedEvidenceRecord } from "./pipeline-types"

/** Naked national IC3/FBI filler must not occupy slots via provisional keep. */
function isNakedNationalFiller(opportunity: RankedExternalOpportunity): boolean {
  if (typeof opportunity.distanceMiles === "number" && Number.isFinite(opportunity.distanceMiles)) {
    return false
  }
  if (
    opportunity.sourceLabel === "Weather Alert" ||
    opportunity.sourceLabel === "Weather Analysis"
  ) {
    return false
  }

  const name = (opportunity.sourceName || "").toLowerCase()
  if (/\bic3\b|internet crime complaint/.test(name)) return true

  if (
    (opportunity.sourceLabel === "National Safety Alert" ||
      opportunity.sourceLabel === "Federal Advisory") &&
    isNationalValueSource(opportunity.sourceUrl, opportunity.sourceName) &&
    (opportunity.priority === "optional" || opportunity.priority === "plan_ahead")
  ) {
    return true
  }

  return false
}

export function isKeepableWithoutPerfectEvidence(
  opportunity: RankedExternalOpportunity
): boolean {
  const url = opportunity.sourceUrl?.trim()
  if (!url || isLikelyHomepageUrl(url)) return false

  // Demoted national fillers must not resurrect as top_recommended via
  // high-confidence provisional evidence when local weather exists (or not).
  if (isNakedNationalFiller(opportunity)) return false

  if (
    opportunity.sourceLabel === "Weather Alert" ||
    opportunity.sourceLabel === "Federal Advisory" ||
    opportunity.sourceLabel === "National Safety Alert"
  ) {
    // Label-based keep is for geo-relevant federal/weather items only —
    // optional national PSAs already excluded above.
    if (
      opportunity.sourceLabel === "National Safety Alert" &&
      (opportunity.priority === "optional" || opportunity.priority === "plan_ahead")
    ) {
      return false
    }
    return true
  }

  if (
    opportunity.sourceLabel === "Current Local Opportunity" &&
    /\.gov(\/|$)/i.test(url) &&
    (opportunity.verifiedFacts?.length ?? 0) > 0
  ) {
    return true
  }

  if (opportunity.confidenceLevel === "high") return true

  const trust = opportunity.internalScores?.sourceTrust ?? 0
  const composite = opportunity.internalScores?.composite ?? 0
  if (trust >= 70 && composite >= 68) return true
  if (composite >= 75 && Boolean(opportunity.sourceName?.trim())) return true

  // SaferU / calendar internal follow-ups may omit external URLs (handled elsewhere).
  return false
}

/**
 * Build provisional evidence from ranked discovery facts when the source document
 * exists but token matching failed. Captions must still attribute the source.
 */
export function provisionalEvidenceFromOpportunity(
  opportunity: RankedExternalOpportunity
): VerifiedEvidenceRecord[] {
  const sourceUrl = opportunity.sourceUrl?.trim() || ""
  const claims = (opportunity.verifiedFacts ?? [])
    .map((claim) => claim.trim())
    .filter(Boolean)
    .slice(0, 8)
  if (!sourceUrl || claims.length === 0) return []
  if (isNakedNationalFiller(opportunity)) return []

  const official =
    opportunity.sourceLabel === "Weather Alert" ||
    opportunity.sourceLabel === "Federal Advisory" ||
    (opportunity.sourceLabel === "National Safety Alert" &&
      opportunity.priority !== "optional" &&
      opportunity.priority !== "plan_ahead") ||
    (opportunity.sourceLabel === "Current Local Opportunity" &&
      /\.gov(\/|$)/i.test(sourceUrl)) ||
    (opportunity.confidenceLevel === "high" && !isNakedNationalFiller(opportunity))

  return [
    {
      sourceId: `provisional_${opportunity.id}`.slice(0, 64),
      sourceName: opportunity.sourceName || opportunity.sourceLabel || "Ranked source",
      sourceUrl,
      sourceClass: official ? "official_operational_authority" : "established_local_media",
      issuingAuthority: opportunity.issuingAuthority || opportunity.sourceName || "",
      publishedAt: opportunity.eventStart || "",
      updatedAt: "",
      expiresAt: opportunity.expiresAt || opportunity.eventEnd || "",
      retrievedAt: new Date().toISOString(),
      location: "",
      geometry: null,
      jurisdictionMatch:
        opportunity.jurisdictionFit === "own"
          ? "inside_jurisdiction"
          : opportunity.jurisdictionFit === "nearby"
            ? "adjacent_travel_impact"
            : opportunity.jurisdictionFit === "regional"
              ? "regional_impact"
              : "unclear",
      active: true,
      facts: claims.map((claim, index) => ({
        factId: `prov_${index}_${opportunity.id}`.slice(0, 40),
        claim,
      })),
      verificationStatus: "verified",
    },
  ]
}
