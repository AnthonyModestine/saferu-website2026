import { createHash } from "node:crypto"
import { findSourceRecord } from "@/lib/post-generator/source-registry"
import type {
  PipelineJurisdictionStatus,
  SourceClass,
  VerifiedEvidenceRecord,
} from "@/lib/post-generator/pipeline-types"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"

const FETCH_TIMEOUT_MS = 8_000
const MAX_SOURCE_BYTES = 750_000

function cleanText(value: string, max = 400): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
}

function titleFromContent(text: string, contentType: string): string {
  if (contentType.includes("html")) {
    const match = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    return match ? cleanText(match[1], 180) : ""
  }
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>
    return cleanText(String(parsed.title || parsed.name || ""), 180)
  } catch {
    return ""
  }
}

function jurisdictionStatus(
  fit: RankedExternalOpportunity["jurisdictionFit"]
): PipelineJurisdictionStatus {
  if (fit === "own") return "inside_jurisdiction"
  if (fit === "nearby") return "adjacent_travel_impact"
  if (fit === "regional") return "regional_impact"
  return "unclear"
}

function fallbackSourceClass(url: string): SourceClass {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.endsWith(".gov") || hostname.endsWith(".mil")) {
      return "official_operational_authority"
    }
  } catch {
    // Invalid URLs are rejected before this point.
  }
  return "established_local_media"
}

function factId(sourceUrl: string, claim: string, index: number): string {
  return `fact_${createHash("sha256")
    .update(`${sourceUrl}|${claim}|${index}`)
    .digest("hex")
    .slice(0, 12)}`
}

async function fetchSource(url: string): Promise<{
  finalUrl: string
  title: string
  searchableText: string
  ok: boolean
}> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "SaferU-Source-Verification/1.0 (+https://saferu.com)",
        Accept: "text/html,application/json,text/plain;q=0.8,*/*;q=0.5",
      },
      cache: "no-store",
    })
    if (!response.ok) {
      return { finalUrl: response.url || url, title: "", searchableText: "", ok: false }
    }
    const contentLength = Number(response.headers.get("content-length") || 0)
    if (contentLength > MAX_SOURCE_BYTES) {
      return { finalUrl: response.url || url, title: "", searchableText: "", ok: false }
    }
    const text = (await response.text()).slice(0, MAX_SOURCE_BYTES)
    const searchableText = cleanText(text, 120_000)
      // Keep JSON attribute values searchable when keys/punctuation otherwise glue tokens.
      .replace(/["_{}:\[\],]/g, " ")
      .replace(/([a-zA-Z])(\d)/g, "$1 $2")
      .replace(/(\d)([a-zA-Z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
    return {
      finalUrl: response.url || url,
      title: titleFromContent(text, response.headers.get("content-type") || ""),
      searchableText,
      ok: true,
    }
  } catch {
    return { finalUrl: url, title: "", searchableText: "", ok: false }
  } finally {
    clearTimeout(timeout)
  }
}

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

/**
 * Returns true when enough claim tokens appear in retrieved source text.
 * softOfficial: for NIFC/NWS/Watch Duty-class sources, require distinctive
 * identity tokens (incident/place names) rather than brittle 50% filler match.
 */
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

export function allowsSoftOfficialClaimMatch(sourceClass: SourceClass, registryId?: string): boolean {
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

/**
 * Retrieves and normalizes a candidate's source before any strategy/writing model sees it.
 * Raw page text is intentionally discarded; models receive only sanitized evidence records.
 */
export async function verifyOpportunityEvidence(
  opportunity: RankedExternalOpportunity
): Promise<VerifiedEvidenceRecord[]> {
  const sourceUrl = opportunity.sourceUrl?.trim()
  const claims = (opportunity.verifiedFacts ?? [])
    .map((claim) => cleanText(claim, 500))
    .filter(Boolean)
    .slice(0, 8)
  if (claims.length === 0) return []

  const internalSource =
    /saferu/i.test(opportunity.sourceName || "") ||
    /^(saferu-|calendar-)/i.test(opportunity.id)
  if (!sourceUrl && internalSource) {
    const internalUrl = "https://saferu.com"
    const sourceName = cleanText(opportunity.sourceName || "SaferU internal content", 180)
    return [
      {
        sourceId: "saferu_internal",
        sourceName,
        sourceUrl: internalUrl,
        sourceClass: "saferu_internal",
        issuingAuthority: "",
        publishedAt: opportunity.eventStart || "",
        updatedAt: "",
        expiresAt: opportunity.expiresAt || opportunity.eventEnd || "",
        retrievedAt: new Date().toISOString(),
        location: "",
        geometry: null,
        jurisdictionMatch: jurisdictionStatus(opportunity.jurisdictionFit),
        active: true,
        facts: claims.map((claim, index) => ({
          factId: factId(internalUrl, claim, index),
          claim,
        })),
        verificationStatus: "verified",
      },
    ]
  }
  if (!sourceUrl) return []

  let parsed: URL
  try {
    parsed = new URL(sourceUrl)
    if (!["http:", "https:"].includes(parsed.protocol)) return []
  } catch {
    return []
  }

  const fetched = await fetchSource(parsed.toString())
  const registryRecord = findSourceRecord(fetched.finalUrl) || findSourceRecord(sourceUrl)
  const sourceName = cleanText(
    opportunity.sourceName || registryRecord?.name || fetched.title || parsed.hostname,
    180
  )
  const sourceClass = registryRecord?.sourceClass || fallbackSourceClass(fetched.finalUrl)
  const softOfficial = allowsSoftOfficialClaimMatch(sourceClass, registryRecord?.id)
  const retrievedAt = new Date().toISOString()

  let supportedClaims = fetched.ok
    ? claims.filter((claim) =>
        claimAppearsInSource(claim, fetched.searchableText, { softOfficial })
      )
    : []

  // Official/trusted feeds often paraphrase discovery claims. If the retrieved
  // source still matches the opportunity identity, keep the discovery claims
  // rather than wiping Stage 1 input and collapsing to SaferU curated fill.
  if (fetched.ok && supportedClaims.length === 0 && softOfficial) {
    const identity = `${opportunity.title} ${opportunity.summary || ""}`
    if (claimAppearsInSource(identity, fetched.searchableText, { softOfficial: true })) {
      supportedClaims = claims
      console.info(
        `[evidence] Accepted paraphrased official claims for ${opportunity.id} via identity match (${registryRecord?.id || sourceClass})`
      )
    }
  }

  const verificationStatus: VerifiedEvidenceRecord["verificationStatus"] =
    fetched.ok && supportedClaims.length > 0
      ? "verified"
      : fetched.ok
        ? "unverified"
        : "fetch_failed"

  if (verificationStatus !== "verified") {
    console.warn(
      `[evidence] Dropped ${opportunity.id} (${opportunity.category || "unknown"}): ` +
        `${verificationStatus}; source=${fetched.finalUrl || sourceUrl}; ` +
        `claims=${claims.length}; softOfficial=${softOfficial}`
    )
  }

  return [
    {
      sourceId:
        registryRecord?.id ||
        `source_${createHash("sha256").update(parsed.hostname).digest("hex").slice(0, 10)}`,
      sourceName,
      sourceUrl: fetched.finalUrl,
      sourceClass,
      issuingAuthority:
        sourceClass === "official_operational_authority" ? sourceName : "",
      publishedAt: opportunity.eventStart || "",
      updatedAt: "",
      expiresAt: opportunity.expiresAt || opportunity.eventEnd || "",
      retrievedAt,
      location: "",
      geometry: null,
      jurisdictionMatch: jurisdictionStatus(opportunity.jurisdictionFit),
      active: verificationStatus === "verified",
      facts: supportedClaims.map((claim, index) => ({
        factId: factId(fetched.finalUrl, claim, index),
        claim,
      })),
      verificationStatus,
    },
  ]
}

export async function verifyRankedEvidence(
  opportunities: RankedExternalOpportunity[]
): Promise<Array<{ opportunity: RankedExternalOpportunity; evidence: VerifiedEvidenceRecord[] }>> {
  return Promise.all(
    opportunities.slice(0, 8).map(async (opportunity) => ({
      opportunity,
      evidence: await verifyOpportunityEvidence(opportunity),
    }))
  )
}
