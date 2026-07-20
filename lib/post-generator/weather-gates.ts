/**
 * Weather recommendation gates: ordinary forecasts are not posts.
 */

export type WeatherCandidateLike = {
  title: string
  summary?: string
  whyItMatters?: string
  category?: string
  sourceLabel?: string
  signals?: string[]
  verifiedFacts?: string[]
  priority?: string
}

const SERIOUS_WEATHER =
  /\b(warning|watch|advisory|statement|flash flood|tornado|hurricane|tropical storm|blizzard|ice storm|extreme (?:heat|cold)|heat (?:warning|advisory)|wind chill|severe thunderstorm|red flag|storm surge|evacuation)\b/i

const RESIDENT_ACTION_NEED =
  /\b(alter travel|prepare property|limit outdoor|vulnerable|outage|flooding|avoid|shelter|cancel|postpone|protect pets|heat illness|turn around)\b/i

function weatherBlob(input: WeatherCandidateLike): string {
  return [
    input.title,
    input.summary,
    input.whyItMatters,
    input.category,
    input.sourceLabel,
    ...(input.signals || []),
    ...(input.verifiedFacts || []),
  ]
    .filter(Boolean)
    .join(" ")
}

export function looksLikeWeatherTopic(input: WeatherCandidateLike): boolean {
  const text = weatherBlob(input)
  const category = (input.category || "").toLowerCase()
  return (
    input.sourceLabel === "Weather Alert" ||
    input.sourceLabel === "Weather Analysis" ||
    category.includes("weather") ||
    /\b(forecast|thunderstorm|heat|cold|flood|wind|snow|ice|hurricane|storm)\b/i.test(text)
  )
}

export function isSeriousWeatherRecommendation(input: WeatherCandidateLike): boolean {
  const text = weatherBlob(input)
  if (SERIOUS_WEATHER.test(text)) return true
  if (input.priority === "urgent" && RESIDENT_ACTION_NEED.test(text)) return true
  if (RESIDENT_ACTION_NEED.test(text) && /\b(nws|national weather service|weather\.gov)\b/i.test(text)) {
    return true
  }
  return false
}

/** Reject ordinary seasonal forecasts with no meaningful hazard. */
export function shouldRejectOrdinaryWeather(input: WeatherCandidateLike): boolean {
  if (!looksLikeWeatherTopic(input)) return false
  return !isSeriousWeatherRecommendation(input)
}

export function weatherGateBrief(): string {
  return `WEATHER RULES:
- Do not recommend ordinary seasonal weather merely because a forecast exists.
- Recommend weather when residents may need to alter travel, prepare property, limit outdoor activity, protect vulnerable people/pets, prepare for outages, avoid flooding, adjust event plans, or understand warning timing.
- Official watches/warnings/advisories/statements should come from NWS or another official weather authority.
- Tropical Tidbits may provide situational awareness but must never be treated as an alert-issuing authority.`
}