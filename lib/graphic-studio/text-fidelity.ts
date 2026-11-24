/**
 * Programmatic approved-text comparison for Graphic Studio QA.
 * Separates confirmed mismatch from uncertain recognition.
 */

export type TextFidelityStatus =
  | "match"
  | "mismatch"
  | "missing"
  | "unreadable"
  | "uncertain"

export type TextFidelityCompareResult = {
  headlineStatus: TextFidelityStatus
  messageStatus: TextFidelityStatus
  headlineNormalizedExpected: string
  messageNormalizedExpected: string
  headlineNormalizedExtracted: string | null
  messageNormalizedExtracted: string | null
}

/** Collapse whitespace / smart quotes for tolerant comparison. */
export function normalizeApprovedText(s: string): string {
  return s
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

const MEANING_WORDS_RE =
  /\b(don't|dont|do not|never|not|no|always|must|must not|cannot|can't|avoid|stop|leave|install|call|hang up)\b/gi

/** Extract meaning-bearing tokens that punctuation stripping must not erase. */
export function meaningKeywords(s: string): string[] {
  const n = normalizeApprovedText(s)
  return [...n.matchAll(MEANING_WORDS_RE)].map((m) => m[0])
}

/**
 * Minor punctuation/case-only differences are ignored for meaning match.
 * Meaning-changing punctuation or dropped negation words are NOT equal
 * (e.g. "Don't pay" vs "Pay", or missing "never").
 */
export function meaningEqual(a: string, b: string): boolean {
  const strip = (x: string) =>
    normalizeApprovedText(x).replace(/[.,;:!?—–\-'"()]/g, "").replace(/\s+/g, " ").trim()
  if (strip(a) !== strip(b)) return false
  const ka = meaningKeywords(a).sort().join("|")
  const kb = meaningKeywords(b).sort().join("|")
  return ka === kb
}

export function compareExtractedText(opts: {
  expectedHeadline: string
  expectedMessage: string
  extractedHeadline?: string | null
  extractedMessage?: string | null
  headlineConfidence?: "high" | "medium" | "low" | null
  messageConfidence?: "high" | "medium" | "low" | null
}): TextFidelityCompareResult {
  const headlineNormalizedExpected = normalizeApprovedText(opts.expectedHeadline)
  const messageNormalizedExpected = normalizeApprovedText(opts.expectedMessage)

  const hRaw = opts.extractedHeadline?.trim() || null
  const mRaw = opts.extractedMessage?.trim() || null

  const headlineStatus = classifyOne(hRaw, opts.expectedHeadline, opts.headlineConfidence)
  const messageStatus = classifyOne(mRaw, opts.expectedMessage, opts.messageConfidence)

  return {
    headlineStatus,
    messageStatus,
    headlineNormalizedExpected,
    messageNormalizedExpected,
    headlineNormalizedExtracted: hRaw ? normalizeApprovedText(hRaw) : null,
    messageNormalizedExtracted: mRaw ? normalizeApprovedText(mRaw) : null,
  }
}

function classifyOne(
  extracted: string | null,
  expected: string,
  confidence?: "high" | "medium" | "low" | null
): TextFidelityStatus {
  if (!extracted) return "missing"
  if (confidence === "low") return "uncertain"
  if (/^[.\-_\s□■?]+$/.test(extracted) || extracted.length < 2) return "unreadable"
  if (meaningEqual(extracted, expected)) return "match"
  if (confidence === "medium" && !meaningEqual(extracted, expected)) return "uncertain"
  return "mismatch"
}

/** Critical only when mismatch/missing/unreadable is confirmed — not uncertain. */
export function textFidelityBlocksPublish(result: TextFidelityCompareResult): boolean {
  const bad: TextFidelityStatus[] = ["mismatch", "missing", "unreadable"]
  return bad.includes(result.headlineStatus) || bad.includes(result.messageStatus)
}

export function textFidelityNeedsHumanReview(result: TextFidelityCompareResult): boolean {
  return (
    result.headlineStatus === "uncertain" || result.messageStatus === "uncertain"
  )
}
