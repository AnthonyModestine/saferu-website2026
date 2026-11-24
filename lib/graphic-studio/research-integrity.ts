/**
 * Research integrity helpers — confidence is not verification.
 */

export type ResearchConfidence = "verified" | "partial" | "unavailable"

export type SourceRecord = {
  name?: string
  url?: string
  publisher?: string
  accessedAt?: string
  supportsClaim?: string
}

export type ResearchIntegrityAssessment = {
  confidence: ResearchConfidence | null
  hasAuthoritativeSources: boolean
  sourceCount: number
  /** True only when confidence is verified AND sources exist — still not a substitute for human policy review. */
  treatsAsVerifiedForAutomation: boolean
  warnings: string[]
}

export function assessResearchIntegrity(opts: {
  researchConfidence?: string | null
  sourceRecords?: SourceRecord[] | null
}): ResearchIntegrityAssessment {
  const confidence = (opts.researchConfidence || null) as ResearchConfidence | null
  const sources = (opts.sourceRecords || []).filter(
    (s) => Boolean(s?.name || s?.url || s?.publisher)
  )
  const hasAuthoritativeSources = sources.length > 0
  const warnings: string[] = []

  if (confidence === "verified" && !hasAuthoritativeSources) {
    warnings.push(
      "research_confidence=verified without source_records — treat as unverified; do not auto-publish material safety claims"
    )
  }
  if (confidence === "partial") {
    warnings.push("partial research — material claims need human review or omission")
  }
  if (confidence === "unavailable" || !confidence) {
    warnings.push("research unavailable or missing — prefer conceptual safe visuals; omit unsupported instructions")
  }
  if (!hasAuthoritativeSources) {
    warnings.push("no authoritative source_records attached")
  }

  return {
    confidence,
    hasAuthoritativeSources,
    sourceCount: sources.length,
    // Never treat confidence alone as proof.
    treatsAsVerifiedForAutomation: false,
    warnings,
  }
}

/**
 * Client-supplied creative strategy is untrusted: it may inform art direction
 * but cannot override approved copy, safety requirements, or agency identity.
 */
export function sanitizeClientCreativeStrategyOverride(opts: {
  approvedHeadline: string
  approvedMessage: string
  strategyHeadline?: string | null
  strategyMessage?: string | null
}): { headline: string; message: string; rejectedOverride: boolean } {
  const rejected =
    Boolean(opts.strategyHeadline && opts.strategyHeadline !== opts.approvedHeadline) ||
    Boolean(opts.strategyMessage && opts.strategyMessage !== opts.approvedMessage)
  return {
    headline: opts.approvedHeadline,
    message: opts.approvedMessage,
    rejectedOverride: rejected,
  }
}
