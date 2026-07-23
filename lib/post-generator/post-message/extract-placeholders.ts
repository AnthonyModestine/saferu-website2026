import { localizeAlertArea } from "@/lib/post-generator/weather-alert-message"
import type { PostMessageInput, PostMessagePlaceholders } from "./types"

function joinFacts(input: PostMessageInput): string {
  return input.verifiedFacts.map((f) => f.text).join("\n")
}

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]?.trim()) return match[1].trim()
  }
  return null
}

function listFromFacts(text: string, patterns: RegExp[]): string[] {
  const items: string[] = []
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]?.trim()) items.push(match[1].trim())
  }
  for (const line of text.split(/\n+/)) {
    if (/mph|hail|wind gust|tornado|flooding|downed tree|power outage/i.test(line) && line.length < 120) {
      const cleaned = line.replace(/^[-*•]\s*/, "").trim()
      if (cleaned && !items.includes(cleaned)) items.push(cleaned)
    }
  }
  return items.slice(0, 4)
}

function formatEventEnd(iso?: string): string | null {
  if (!iso?.trim()) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso.trim()
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
}

export function extractPostMessagePlaceholders(
  input: PostMessageInput,
  serviceArea?: { city?: string; county?: string; state?: string }
): PostMessagePlaceholders {
  const factsText = joinFacts(input)
  const allText = `${input.title}\n${factsText}\n${(input.publicCallToAction ?? []).join("\n")}`

  const rawArea = firstMatch(allText, [
    /Affected area:\s*(.+)$/im,
    /for\s+(.+?)\s+until\b/i,
    /customers in\s+(.+?)\s+due to/i,
    /issued for\s+(.+?)\s+until/i,
  ])

  const affectedArea =
    rawArea && rawArea.includes(";")
      ? localizeAlertArea(rawArea, serviceArea ?? {})
      : rawArea ||
        [serviceArea?.city, serviceArea?.state].filter(Boolean).join(", ") ||
        input.serviceArea ||
        null

  const expirationTime =
    firstMatch(allText, [
      /\buntil\s+(.+?)(?:\s+by\s+NWS|$)/i,
      /\bthrough\s+(.+?)(?:\s+by\s+NWS|$)/i,
      /expires?\s+at\s+(.+?)(?:\.|$)/i,
      /in effect through\s+(.+?)(?:\.|$)/i,
    ]) || formatEventEnd(input.eventEnd)

  const issuedTime =
    firstMatch(allText, [/issued\s+at\s+([\d:]+\s*[AP]M)/i, /at\s+([\d:]+\s*[AP]M)\s+until/i]) ||
    null

  const primaryThreats = listFromFacts(allText, [
    /capable of producing\s+(.+?)(?:\.|$)/i,
    /may produce\s+(.+?)(?:\.|$)/i,
    /producing\s+(.+?)(?:\.|$)/i,
  ])

  const publicActions = (input.publicCallToAction ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4)

  const localImpacts = listFromFacts(allText, [
    /local impacts?:\s*(.+)/i,
    /may occur throughout the area[:\s]*(.+)/i,
  ])

  const agencyLocalAction = input.verifiedAgencyAction?.trim() || null

  const roadName =
    firstMatch(allText, [
      /^([A-Z0-9][\w\s.'-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Highway|Hwy|Route|Lane|Ln|Drive|Dr))\b/im,
      /road closure[:\s]+(.+?)(?:\s+is closed|\s+due to|$)/i,
    ]) || null

  const closureBoundaries = firstMatch(allText, [
    /closed\s+(between\s+.+?)(?:\s+due to|\s+until|\.|$)/i,
    /closed\s+(.+?)\s+due to/i,
  ])

  const closureCause = firstMatch(allText, [/due to\s+(.+?)(?:\.|$)/i, /because of\s+(.+?)(?:\.|$)/i])

  const alternateRoute = firstMatch(allText, [/use\s+(.+?)(?:,|\.|$)/i, /alternate route[:\s]+(.+?)(?:\.|$)/i])

  const reopenCondition = firstMatch(allText, [
    /remain closed until\s+(.+?)(?:\.|$)/i,
    /reopen when\s+(.+?)(?:\.|$)/i,
  ])

  const reason = firstMatch(allText, [/due to\s+(.+?)(?:\.|$)/i, /because of\s+(.+?)(?:\.|$)/i])

  const boilDuration = firstMatch(allText, [
    /rolling boil for at least\s+(.+?)(?:\s+before|\.|$)/i,
    /boil.*?for\s+(\d+\s+minutes?)/i,
  ])

  const unaffectedAreaNote = firstMatch(allText, [
    /if you do not live in the affected area[^.]*\./i,
    /unaffected residents[^.]*\./i,
  ])

  const reportingMethod = firstMatch(allText, [
    /report\s+.+?\s+through\s+(.+?)(?:\.|$)/i,
    /call\s+(\d{3}[-\d]*)/i,
    /contact\s+(.+?)(?:\.|$)/i,
  ])

  const subjectDescription = firstMatch(allText, [
    /missing[:\s]+(.+?)(?:\.|last known)/i,
    /described as[:\s]+(.+?)(?:\.|$)/i,
    /(?:male|female|man|woman|child|teen)[^.]+\./i,
  ])

  const lastKnownLocation = firstMatch(allText, [
    /last seen (?:near|at|in)\s+(.+?)(?:\.|$)/i,
    /last known location[:\s]+(.+?)(?:\.|$)/i,
  ])

  const restorationEstimate = firstMatch(allText, [
    /(?:estimated |expected )?restoration[^.]*(?:by|around|at)\s+(.+?)(?:\.|$)/i,
    /power (?:is )?expected to be restored[^.]*(?:by|at)\s+(.+?)(?:\.|$)/i,
  ])

  const caseDetails = input.verifiedFacts
    .map((f) => f.text.trim())
    .filter((text) => text.length > 0 && text.length < 280)
    .slice(0, 3)
    .join(" ")
    || null

  return {
    agencyName: input.agencyName.trim(),
    alertType: input.title.trim() || null,
    issuingAuthority: input.issuingAuthority?.trim() || "National Weather Service",
    affectedArea,
    issuedTime,
    expirationTime,
    primaryThreats: primaryThreats.length ? primaryThreats : null,
    localImpacts: localImpacts.length ? localImpacts : publicActions.length ? null : null,
    publicActions: publicActions.length ? publicActions : null,
    agencyLocalAction,
    reason,
    boilDuration,
    unaffectedAreaNote,
    roadName,
    closureBoundaries,
    closureCause,
    alternateRoute,
    reopenCondition,
    reportingMethod,
    partnerAgencies: null,
    postExpirationImpacts: null,
    updatedStormDetail: firstMatch(allText, [/storm (?:is|continues).+$/im]),
    subjectDescription,
    lastKnownLocation,
    restorationEstimate,
    caseDetails,
  }
}

/** Prefer short watch script when expiration or threats are missing. */
export function shouldUseShortWatchScript(placeholders: PostMessagePlaceholders): boolean {
  return !placeholders.expirationTime || !placeholders.primaryThreats?.length
}
