import { hasRealAgencyName } from "./caption-voice"

export type WeatherAlertMessageInput = {
  title: string
  summary?: string
  verifiedFacts?: string[]
  publicCallToAction?: string[]
  eventStart?: string
  eventEnd?: string
  sourceName?: string
  issuingAuthority?: string
  sourceLabel?: string
}

export type WeatherMessageContext = {
  agencyName?: string | null
  city?: string
  county?: string
  state?: string
}

/** Short, practical safety line matched to the alert type. */
export function weatherSafetyReminder(alertTitle: string): string {
  const haystack = alertTitle.toLowerCase()

  if (/flash flood warning/.test(haystack)) {
    return "Move to higher ground and never drive through floodwater."
  }
  if (/flood warning/.test(haystack)) {
    return "Avoid flooded roads and be ready to move to higher ground if water rises near you."
  }
  if (/flood watch|flood advisory/.test(haystack)) {
    return "Avoid flooded roads and stay ready if a Flash Flood Warning is issued."
  }
  if (/tornado warning/.test(haystack)) {
    return "Move to an interior room on the lowest floor, away from windows."
  }
  if (/tornado watch/.test(haystack)) {
    return "Know where you would shelter and keep your phone charged for updates."
  }
  if (/severe thunderstorm warning|thunderstorm warning/.test(haystack)) {
    return "Move indoors and stay away from windows until the storm passes."
  }
  if (/severe thunderstorm watch|thunderstorm watch/.test(haystack)) {
    return "Be ready to move indoors quickly if a warning is issued."
  }
  if (/heat advisory|excessive heat|heat warning/.test(haystack)) {
    return "Limit time outdoors, drink water, and check on vulnerable neighbors."
  }
  if (/winter storm|ice storm|blizzard|freezing rain/.test(haystack)) {
    return "Allow extra travel time and avoid unnecessary driving in poor conditions."
  }
  if (/wind advisory|high wind/.test(haystack)) {
    return "Secure outdoor items and use extra caution while driving."
  }
  if (/snow|ice/.test(haystack)) {
    return "Slow down on slick roads and leave extra stopping distance."
  }
  if (/hurricane|tropical storm/.test(haystack)) {
    return "Review your emergency supplies and follow official guidance if orders are issued."
  }
  return "Stay tuned to official forecasts and be ready to adjust your plans."
}

function normalizeCountyName(county?: string): string | undefined {
  if (!county?.trim()) return undefined
  return county.replace(/\bcounty\b/gi, "").trim() || undefined
}

function nwsZoneMatchesPlace(nwsArea: string, place: string): boolean {
  const placeNorm = place.toLowerCase().replace(/\bcounty\b/g, "").trim()
  if (!placeNorm) return false
  const zones = nwsArea.split(/;\s*/).map((zone) => zone.trim().toLowerCase())
  return zones.some((zone) => {
    const zoneCore = zone.replace(/\s+(county|parish)$/i, "").trim()
    return (
      zone === placeNorm ||
      zone.includes(placeNorm) ||
      placeNorm.includes(zoneCore) ||
      zoneCore.includes(placeNorm)
    )
  })
}

/**
 * Focus NWS multi-county area descriptions on the agency's community — not the full zone list.
 */
export function localizeAlertArea(
  _nwsAreaRaw: string | undefined,
  serviceArea: Pick<WeatherMessageContext, "city" | "county" | "state">
): string {
  const city = serviceArea.city?.trim()
  const county = normalizeCountyName(serviceArea.county?.trim())
  const state = serviceArea.state?.trim()

  if (city && state) return `${city}, ${state}`
  if (county && state) return `${county} County, ${state}`
  if (city) return city
  if (county) return `${county} County`
  return "our area"
}

function extractRawNwsArea(facts: string[], summary?: string): string | undefined {
  for (const fact of facts) {
    const match = fact.match(/^Affected area:\s*(.+)$/i)
    if (match?.[1]?.trim()) return match[1].trim()
  }
  const summaryMatch = summary?.match(/\bfor\s+(.+?)\.?$/i)
  if (summaryMatch?.[1]?.trim() && summaryMatch[1].includes(";")) {
    return summaryMatch[1].trim()
  }
  return undefined
}

function extractNwsOffice(facts: string[], summary?: string): string | undefined {
  const sources = [...facts, summary || ""]
  for (const text of sources) {
    const match = text.match(/\bby\s+(NWS\s+[^.]+)/i)
    if (match?.[1]?.trim()) return match[1].trim()
  }
  return undefined
}

function formatNwsOfficeShort(office: string): string {
  return office.replace(/\s+[A-Z]{2}$/, "").trim()
}

function extractUntilTiming(
  title: string,
  facts: string[],
  summary?: string,
  eventEnd?: string
): string | undefined {
  for (const fact of facts) {
    const match = fact.match(/\buntil\s+(.+?)(?:\s+by\s+NWS|$)/i)
    if (match?.[1]?.trim()) return match[1].trim()
  }
  if (summary) {
    const match = summary.match(/\buntil\s+(.+?)(?:\s+by\s+NWS|$)/i)
    if (match?.[1]?.trim()) return match[1].trim()
  }
  if (eventEnd) {
    const end = formatNwsDate(eventEnd)
    if (end) return end
  }
  return undefined
}

function hazardPhraseForAlert(title: string): string {
  const lower = title.toLowerCase()
  if (/flood/.test(lower)) return "Flooding"
  if (/tornado/.test(lower)) return "Tornadoes"
  if (/thunder/.test(lower)) return "Severe thunderstorms"
  if (/heat/.test(lower)) return "Excessive heat"
  if (/winter|snow|ice/.test(lower)) return "Winter weather"
  if (/wind/.test(lower)) return "Strong winds"
  return title.replace(/\s+(watch|warning|advisory)$/i, "").trim() || "The hazardous condition"
}

function hazardIsPossiblePhrase(hazard: string): string {
  const singular = /^(flooding|excessive heat|winter weather|strong winds)$/i.test(hazard)
  return singular ? `${hazard} is possible` : `${hazard} are possible`
}

function warningActionLabel(title: string, publicAction?: string): string {
  if (publicAction?.trim()) {
    const short = publicAction.trim().replace(/\.$/, "")
    if (short.length <= 48) return short.toUpperCase()
  }
  const lower = title.toLowerCase()
  if (/flood/.test(lower)) return "AVOID FLOODED ROADS"
  if (/tornado/.test(lower)) return "TAKE SHELTER NOW"
  if (/thunder/.test(lower)) return "MOVE INDOORS NOW"
  return "TAKE ACTION NOW"
}

function formatNwsDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

function articleForAlert(title: string): string {
  return /^[aeiou]/i.test(title.trim()) ? "an" : "a"
}

function resolveMessageContext(
  messageContext?: WeatherMessageContext | string | null
): WeatherMessageContext {
  if (typeof messageContext === "string" || messageContext == null) {
    return { agencyName: messageContext || undefined }
  }
  return messageContext
}

/**
 * Build a community-focused weather alert post for a social media manager / PIO.
 * Names the issuer and alert type, focuses on the local service area, and adds one safety line.
 */
export function buildWeatherAlertPost(
  opportunity: WeatherAlertMessageInput,
  messageContext?: WeatherMessageContext | string | null
): string {
  const { agencyName, city, county, state } = resolveMessageContext(messageContext)
  const title = opportunity.title.trim()
  const facts = opportunity.verifiedFacts ?? []
  const rawArea = extractRawNwsArea(facts, opportunity.summary)
  const localArea = localizeAlertArea(rawArea, { city, county, state })
  const nwsOffice = extractNwsOffice(facts, opportunity.summary)
  const officeLabel = nwsOffice ? formatNwsOfficeShort(nwsOffice) : "the National Weather Service"
  const until = extractUntilTiming(title, facts, opportunity.summary, opportunity.eventEnd)
  const safety = weatherSafetyReminder(title)
  const article = articleForAlert(title)
  const publicAction = opportunity.publicCallToAction?.find((item) => item.trim())?.trim()
  const hazard = hazardPhraseForAlert(title)

  const issuer = nwsOffice ? officeLabel : "the National Weather Service"
  const isWarning = /warning/i.test(title)
  const isWatch = /watch|outlook/i.test(title)

  if (isWarning) {
    const actionLabel = warningActionLabel(title, publicAction)
    const timingClause = until ? ` until ${until}` : ""
    const impact = publicAction || safety
    const lines = [
      `${title.toUpperCase()} — ${actionLabel}`,
      "",
      `A ${title} is in effect for ${localArea}${timingClause}. ${impact}`,
    ].filter(Boolean)
    return lines.join("\n")
  }

  if (isWatch) {
    const timingClause = until ? ` until ${until}` : ""
    const prepAction = publicAction || safety
    const lines = [
      title.toUpperCase(),
      "",
      `A ${title} is in effect for ${localArea}${timingClause}. ${hazardIsPossiblePhrase(hazard)}. ${prepAction}`,
    ].filter(Boolean)
    return lines.join("\n")
  }

  if (hasRealAgencyName(agencyName)) {
    const opening = [
      `Heads up, ${localArea} — ${issuer} has issued ${article} ${title}.`,
      `We want you to have time to prepare and stay aware.`,
    ].join(" ")
    const timingLine = until ? `This ${title.toLowerCase()} is in effect through ${until}.` : ""
    const closing = [timingLine, safety].filter(Boolean).join(" ")
    return closing ? `${opening}\n\n${closing}` : opening
  }

  const opening = `${issuer} has issued ${article} ${title} for ${localArea}.`
  const timingLine = until ? `This ${title.toLowerCase()} is in effect through ${until}.` : ""
  const closing = [timingLine, safety].filter(Boolean).join(" ")
  return closing ? `${opening}\n\n${closing}` : opening
}

export function isWeatherAlertOpportunity(
  opportunity: Pick<WeatherAlertMessageInput, "sourceLabel" | "category" | "title">
): boolean {
  if (opportunity.sourceLabel === "Weather Alert" || opportunity.sourceLabel === "Weather Analysis") {
    return true
  }
  return /weather|flood|tornado|thunder|heat|wind|winter|storm|hurricane/i.test(
    `${opportunity.title} ${"category" in opportunity ? opportunity.category || "" : ""}`
  )
}
