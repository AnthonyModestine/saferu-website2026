/**
 * Infer whether an opportunity is inside the agency's service community
 * or a neighboring / regional impact they might still mention.
 */

export type JurisdictionFit = "own" | "nearby" | "regional" | "unknown"

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractPlaceTokens(city?: string, county?: string): string[] {
  // Coverage comes from Settings jurisdiction fields only — never infer from agency name.
  const tokens = new Set<string>()
  for (const place of [city, county]) {
    const cityNorm = normalize(place || "").replace(/\bcounty\b/g, " ").trim()
    if (!cityNorm) continue
    for (const part of cityNorm.split(" ")) {
      if (part.length > 2) tokens.add(part)
    }
    tokens.add(cityNorm)
  }
  return [...tokens]
}

function textMentionsPlace(text: string, placeTokens: string[]): boolean {
  if (!placeTokens.length) return false
  const blob = normalize(text)
  return placeTokens.some((token) => token.length > 2 && blob.includes(token))
}

function looksLikeNamedOtherPlace(text: string, placeTokens: string[]): boolean {
  const blob = normalize(text)
  // Common pattern: "in Mason", "near Mason", "Mason County" when agency is elsewhere
  const placeHints =
    /\b(?:in|near|outside|around|for)\s+([a-z][a-z]+(?:\s+[a-z][a-z]+)?)\b/g
  let match: RegExpExecArray | null
  while ((match = placeHints.exec(blob))) {
    const named = match[1]
    if (!named || named.length < 3) continue
    if (/\b(the|our|your|area|county|road|street|highway|service)\b/.test(named)) continue
    if (placeTokens.some((token) => named.includes(token) || token.includes(named))) continue
    return true
  }
  return false
}

/**
 * Estimate whether this opportunity is in the agency's home community.
 * Used for messaging tone (own vs neighboring) and recommendation tier.
 */
export function inferJurisdictionFit(opts: {
  agencyName?: string
  city?: string
  county?: string
  title: string
  summary?: string
  whyItMatters?: string
  sourceName?: string
  category?: string
  signals?: string[]
  verifiedFacts?: string[]
  distanceMiles?: number
}): JurisdictionFit {
  const placeTokens = extractPlaceTokens(opts.city, opts.county)
  const text = [
    opts.title,
    opts.summary,
    opts.whyItMatters,
    opts.sourceName,
    ...(opts.verifiedFacts || []),
  ]
    .filter(Boolean)
    .join(" ")

  if (typeof opts.distanceMiles === "number") {
    if (opts.distanceMiles <= 8) return "own"
    if (opts.distanceMiles <= 35) return "nearby"
    return "regional"
  }

  const mentionsHome = textMentionsPlace(text, placeTokens)
  const mentionsOther = looksLikeNamedOtherPlace(text, placeTokens)
  const isRoad = /\b(road|closure|detour|traffic|511)\b/i.test(
    `${opts.category || ""} ${(opts.signals || []).join(" ")} ${text}`
  )

  if (mentionsHome && !mentionsOther) return "own"
  if (mentionsOther && !mentionsHome) return isRoad ? "nearby" : "nearby"
  if (mentionsHome && mentionsOther) return "nearby"
  if (isRoad) return "nearby"
  return "unknown"
}

/** Compact jurisdiction rules for discovery / validation prompts. */
export function jurisdictionRulesBrief(agencyType?: string | null): string {
  const type = (agencyType || "public safety").toLowerCase()
  const isSheriff = type === "sheriff"
  const isMunicipal = /police|fire|ems|municipal|city|town/.test(type)

  const lines = [
    "JURISDICTION RULES:",
    isSheriff
      ? "- Sheriff's office: prioritize the full county jurisdiction; search county-wide sources and communities throughout the county."
      : isMunicipal
        ? "- Municipal agency: prioritize the configured municipality and immediate service area."
        : "- Prioritize the configured service area and communities your residents actually live in or travel through.",
    "- Neighboring or regional items are acceptable ONLY when they have direct resident impact (commute routes, shared highways, evacuation paths, regional hazards).",
    "- Never imply this agency owns, manages, or is performing another jurisdiction's work, investigation, alert, or event.",
    "- Do not say \"our crews,\" \"we apologize for the inconvenience,\" or \"thank you for your understanding\" about another agency's project.",
  ]
  return lines.join("\n")
}

export function jurisdictionMessagingGuidance(
  fit: JurisdictionFit,
  agencyName: string,
  city?: string
): string {
  const home = city?.trim() || "your service area"
  const agency = agencyName.trim() || "your agency"

  if (fit === "own") {
    return `This appears to be in ${agency}'s home community (${home}). You may speak as the local agency when facts support it. Still do not invent ownership of another agency's project.`
  }
  if (fit === "nearby") {
    return `This appears to be in a NEIGHBORING community near ${home}, not clearly inside ${agency}'s own jurisdiction. Frame as a traveler / regional heads-up for your residents. Do NOT say "thank you for your understanding," "our crews," "we apologize for the inconvenience," or imply ${agency} owns or is performing the work. Name ${agency} when sharing the heads-up; never say "our local police" or similar generic stand-ins.`
  }
  if (fit === "regional") {
    return `This is a broader regional update. Share only as awareness for residents who may travel through the area. Do not claim local jurisdiction or operational ownership.`
  }
  return `Jurisdiction is unclear. Prefer neutral awareness language. Do not claim ${agency} owns the situation unless verified facts say so.`
}
