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
    return {
      finalUrl: response.url || url,
      title: titleFromContent(text, response.headers.get("content-type") || ""),
      searchableText: cleanText(text, 120_000).toLowerCase(),
      ok: true,
    }
  } catch {
    return { finalUrl: url, title: "", searchableText: "", ok: false }
  } finally {
    clearTimeout(timeout)
  }
}

function claimAppearsInSource(claim: string, sourceText: string): boolean {
  if (!sourceText) return false
  const tokens = [...new Set(
    claim
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4)
  )]
  if (tokens.length === 0) return false
  const matched = tokens.filter((token) => sourceText.includes(token)).length
  return matched / tokens.length >= 0.5
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
  const retrievedAt = new Date().toISOString()
  const supportedClaims = fetched.ok
    ? claims.filter((claim) => claimAppearsInSource(claim, fetched.searchableText))
    : []

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
      active: fetched.ok && supportedClaims.length > 0,
      facts: supportedClaims.map((claim, index) => ({
        factId: factId(fetched.finalUrl, claim, index),
        claim,
      })),
      verificationStatus:
        fetched.ok && supportedClaims.length > 0
          ? "verified"
          : fetched.ok
            ? "unverified"
            : "fetch_failed",
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
