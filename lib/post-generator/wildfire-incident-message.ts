import { hasRealAgencyName } from "./caption-voice"

export function isWildfireIncidentOpportunity(opp: {
  title?: string
  category?: string
  sourceName?: string
  issuingAuthority?: string
  signals?: string[]
}): boolean {
  const haystack = [
    opp.category,
    opp.sourceName,
    opp.issuingAuthority,
    opp.title,
    ...(opp.signals ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return /wildfire|nifc|inciweb|fire_weather|watch duty/.test(haystack)
}

function parseIncidentFromTitle(title: string): { incidentName?: string; county?: string } {
  const active = title.match(/wildfire activity:\s*(.+?)\s+in\s+(.+?)(?:\s+county)?\.?$/i)
  if (active) {
    return { incidentName: active[1].trim(), county: active[2].trim() }
  }
  const recent = title.match(/recent wildfire:\s*(.+?)\s+in\s+(.+?)(?:\s+county)?\.?$/i)
  if (recent) {
    return { incidentName: recent[1].trim(), county: recent[2].trim() }
  }
  return {}
}

function extractAcres(facts: string[]): string | null {
  for (const fact of facts) {
    const match = fact.match(/\(~?(\d[\d,]*)\s*acres?\)/i)
    if (!match) continue
    const acres = Number(match[1].replace(/,/g, ""))
    if (acres > 0) return `about ${acres.toLocaleString("en-US")} acres`
  }
  return null
}

function pickWildfireActions(actions: string[]): string {
  const useful = actions
    .map((line) => line.trim())
    .filter((line) => line.length > 15)
    .slice(0, 3)
    .map((line) => line.replace(/\.$/, ""))

  if (!useful.length) {
    return "Follow official fire and emergency management channels, be ready to evacuate if ordered, and limit outdoor exertion if you see smoke."
  }

  return `${useful.join(". ")}.`
}

/** PIO-style post for NIFC/InciWeb wildfire incidents relayed to a local audience. */
export function buildWildfireIncidentPost(
  opportunity: {
    title: string
    verifiedFacts?: string[]
    publicCallToAction?: string[]
    sourceName?: string
  },
  agencyName?: string | null,
  serviceArea?: { city?: string; county?: string; state?: string }
): string {
  const parsed = parseIncidentFromTitle(opportunity.title)
  const county =
    parsed.county ||
    serviceArea?.county?.replace(/\bcounty\b/gi, "").trim() ||
    undefined
  const state = serviceArea?.state?.trim()
  const city = serviceArea?.city?.trim()
  const incidentName = parsed.incidentName
  const acres = extractAcres(opportunity.verifiedFacts ?? [])
  const issuer = /inciweb/i.test(opportunity.sourceName || "")
    ? "NIFC/InciWeb"
    : "the National Interagency Fire Center"

  const locationPhrase =
    county && state
      ? `${county} County, ${state}`
      : county
        ? `${county} County`
        : state || "the region"
  const audiencePlace =
    city && state ? `${city}, ${state}` : county && state ? `${county} County, ${state}` : locationPhrase

  const incidentLabel = incidentName ? `the ${incidentName} fire` : "active wildfire activity"
  const sizeClause = acres ? ` (${acres})` : ""

  const paragraphs: string[] = []

  if (hasRealAgencyName(agencyName)) {
    paragraphs.push(
      `${agencyName} is sharing an update from ${issuer} on ${incidentLabel} in ${locationPhrase}${sizeClause}.`
    )
    paragraphs.push(
      `We're passing this along for residents in ${audiencePlace}. Smoke, travel impacts, and conditions can change quickly — follow your local fire department and emergency management for evacuation orders and official updates.`
    )
  } else {
    paragraphs.push(
      `${issuer} is tracking ${incidentLabel} in ${locationPhrase}${sizeClause}.`
    )
    paragraphs.push(
      `Residents in the area should stay alert for smoke, road impacts, and any evacuation guidance from local officials.`
    )
  }

  paragraphs.push(pickWildfireActions(opportunity.publicCallToAction ?? []))

  return paragraphs.join("\n\n")
}
