/**
 * Ranked recommendations that already passed PIO scoring should not all die
 * just because claim-token evidence matching is imperfect — especially for
 * official feeds and established local media with a specific article/alert URL.
 */

import { isLikelyHomepageUrl } from "./source-standards"
import type { RankedExternalOpportunity } from "./types"
import type { VerifiedEvidenceRecord } from "./pipeline-types"

export function isKeepableWithoutPerfectEvidence(
  opportunity: RankedExternalOpportunity
): boolean {
  const url = opportunity.sourceUrl?.trim()
  if (!url || isLikelyHomepageUrl(url)) return false

  if (opportunity.confidenceLevel === "high") return true
  if (
    opportunity.sourceLabel === "Weather Alert" ||
    opportunity.sourceLabel === "Federal Advisory" ||
    opportunity.sourceLabel === "National Safety Alert"
  ) {
    return true
  }

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

  const official =
    opportunity.sourceLabel === "Weather Alert" ||
    opportunity.sourceLabel === "Federal Advisory" ||
    opportunity.sourceLabel === "National Safety Alert" ||
    opportunity.confidenceLevel === "high"

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
