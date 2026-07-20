/**
 * Claim-to-source matching for evidence verification.
 * Kept pure so official fire/weather feeds can survive paraphrased discovery claims.
 */

/** Common filler words in discovery-authored claims that rarely appear on source pages. */
const CLAIM_STOPWORDS = new Set([
  "lists",
  "listed",
  "listing",
  "active",
  "activity",
  "report",
  "reported",
  "reports",
  "county",
  "state",
  "incident",
  "fire",
  "wildland",
  "wildfire",
  "acres",
  "percent",
  "contained",
  "containment",
  "fully",
  "yet",
  "with",
  "from",
  "that",
  "this",
  "near",
  "area",
  "local",
  "official",
  "officials",
  "residents",
  "should",
  "monitor",
  "about",
  "after",
  "before",
  "during",
  "while",
  "their",
  "there",
  "these",
  "those",
  "have",
  "been",
  "were",
  "was",
  "are",
  "may",
  "affect",
  "nearby",
  "public",
  "safety",
  "update",
  "updates",
  "source",
  "sources",
  "available",
  "current",
  "recent",
  "today",
  "nifc",
  "inciweb",
  "national",
  "interagency",
  "center",
])

export function claimTokens(claim: string): string[] {
  return [
    ...new Set(
      claim
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((token) => token.length >= 4)
    ),
  ]
}

export function distinctiveClaimTokens(claim: string): string[] {
  return claimTokens(claim).filter((token) => !CLAIM_STOPWORDS.has(token) && !/^\d+$/.test(token))
}

export function claimAppearsInSource(
  claim: string,
  sourceText: string,
  options?: { softOfficial?: boolean }
): boolean {
  if (!sourceText) return false
  const tokens = claimTokens(claim)
  if (tokens.length === 0) return false
  const matched = tokens.filter((token) => sourceText.includes(token)).length
  const ratio = matched / tokens.length
  if (ratio >= 0.5) return true

  if (!options?.softOfficial) return false

  const distinctive = distinctiveClaimTokens(claim)
  if (distinctive.length === 0) return ratio >= 0.35
  const distMatched = distinctive.filter((token) => sourceText.includes(token)).length
  if (distinctive.length <= 2) return distMatched === distinctive.length && ratio >= 0.25
  return distMatched / distinctive.length >= 0.6 && ratio >= 0.3
}

/** Registry / class combinations where paraphrased official claims should not wipe evidence. */
export function allowsSoftOfficialClaimMatch(
  sourceClass: string,
  registryId?: string
): boolean {
  if (
    sourceClass === "official_operational_authority" ||
    sourceClass === "trusted_operational_intelligence"
  ) {
    return true
  }
  return Boolean(
    registryId &&
      [
        "nifc",
        "nifc_wfigs",
        "inciweb",
        "wildfire_gov",
        "nws",
        "noaa",
        "watch_duty",
        "usgs",
        "ic3",
        "fbi",
        "ncmec",
      ].includes(registryId)
  )
}
