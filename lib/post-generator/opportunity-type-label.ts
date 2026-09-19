import type { PostOpportunity } from "./types"
import { cleanDisplayTitle } from "./display-text"
import { isActualRoadClosure, trafficPostTypeLabel } from "./traffic-post-label"

type OpportunityTypeInput = Pick<
  PostOpportunity,
  "category" | "title" | "sourceLabel" | "signals" | "opportunitySource"
>

const PREFIX_TYPES = new Set([
  "Road Closure",
  "Traffic Advisory",
  "Water Notice",
  "Utility Notice",
  "Weather Alert",
  "Heat Alert",
  "Tornado Alert",
  "Thunderstorm Alert",
  "Flood Alert",
  "Winter Weather Alert",
  "Scam Alert",
  "Fire Alert",
  "Police Alert",
  "Public Safety Alert",
  "Health Notice",
  "Missing Person",
])

function haystack(opp: OpportunityTypeInput): string {
  return `${opp.category} ${opp.title} ${(opp.signals ?? []).join(" ")}`.toLowerCase()
}

export function opportunityPostTypeLabel(opp: OpportunityTypeInput): string {
  if (opp.opportunitySource === "saferu_curated") return "Safety Reminder"

  const text = haystack(opp)

  if (opp.sourceLabel === "Weather Alert" || opp.sourceLabel === "Weather Analysis") {
    if (/tornado/.test(text)) return "Tornado Alert"
    if (/thunderstorm|severe storm/.test(text)) return "Thunderstorm Alert"
    if (/flood/.test(text)) return "Flood Alert"
    if (/heat|excessive heat/.test(text)) return "Heat Alert"
    if (/winter|snow|ice|blizzard/.test(text)) return "Winter Weather Alert"
    return "Weather Alert"
  }

  const trafficLabel = trafficPostTypeLabel(text)
  if (trafficLabel) return trafficLabel

  if (isActualRoadClosure(text)) return "Road Closure"
  if (/traffic|crash|collision|congestion/.test(text)) return "Traffic Advisory"
  if (/boil water|water main|water outage|hydrant|sewer/.test(text)) return "Water Notice"
  if (/power outage|utility|electric|gas leak/.test(text)) return "Utility Notice"
  if (/scam|fraud|phish|ic3/.test(text)) return "Scam Alert"
  if (/missing person|amber|endangered/.test(text)) return "Missing Person"
  if (/wildfire|structure fire|fire department|smoke/.test(text)) return "Fire Alert"
  if (/police|suspect|crime|shooting|robbery|theft/.test(text)) return "Police Alert"
  if (/school|student|district/.test(text)) return "School Notice"
  if (/health|air quality|outbreak/.test(text)) return "Health Notice"

  if (opp.sourceLabel === "National Safety Alert" || opp.sourceLabel === "Federal Advisory") {
    return "Public Safety Alert"
  }

  const category = (opp.category || "")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

  if (category === "Community Event") return "Event"
  if (category === "Road Closure") return "Road Closure"
  if (category === "Traffic Advisory") return "Traffic Advisory"
  if (category === "Crime Prevention") return "Police Alert"
  if (category === "Fire Safety") return "Fire Alert"
  if (category) return category

  return "Community Update"
}

/** One clear headline — name for events, type + detail for closures/alerts. */
export function opportunityPrimaryLine(opp: OpportunityTypeInput): string {
  const title = cleanDisplayTitle(opp.title)
  if (!title) return opportunityPostTypeLabel(opp)
  if (opp.opportunitySource === "saferu_curated") return title

  const typeLabel = opportunityPostTypeLabel(opp)
  const titleLower = title.toLowerCase()
  const typeLower = typeLabel.toLowerCase()

  if (!PREFIX_TYPES.has(typeLabel)) return title
  if (titleLower.startsWith(typeLower)) return title

  return `${typeLabel} — ${title}`
}
