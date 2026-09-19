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
  confidenceLevel?: string
  sourceName?: string
  suggestedMessage?: string
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
    input.suggestedMessage,
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

const ROUTINE_WEATHER =
  /\b(nice (?:day|weather)|pleasant|beautiful day|great weather|mostly sunny|partly cloudy|clear skies|mild|comfortable|seasonal temps|fair weather|light shower|chance of rain|high of \d|low of \d|enjoy the sunshine|perfect weather)\b/i

export function isSeriousWeatherRecommendation(input: WeatherCandidateLike): boolean {
  // Official NWS alert products are serious by definition — do not require
  // the event title to restate "warning/watch/advisory" when sourceLabel already says so.
  if (
    input.sourceLabel === "Weather Alert" &&
    (input.confidenceLevel === "high" ||
      /\bnational weather service\b/i.test(input.sourceName || ""))
  ) {
    return true
  }
  const text = weatherBlob(input)
  if (ROUTINE_WEATHER.test(text) && !SERIOUS_WEATHER.test(text)) return false
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
- Never recommend a weather post for a routine or pleasant forecast. Do not post "nice weather," seasonal highs/lows, partly cloudy skies, or ordinary rain chances.
- Only recommend weather when there is a verified hazard or official NWS watch, warning, advisory, or statement — or conditions that clearly affect travel, outdoor safety, outages, flooding, extreme heat/cold, air quality, or event plans.
- Residents should need to change behavior: alter travel, prepare property, limit outdoor activity, protect vulnerable people/pets, prepare for outages, avoid flooding, shelter, or cancel/postpone plans.
- Official watches/warnings/advisories/statements should come from NWS or another official weather authority.
- If tomorrow's weather is normal and unremarkable, exclude it from recommendations and list it under Items Reviewed but Not Recommended.
- Tropical Tidbits may provide situational awareness but must never be treated as an alert-issuing authority.`
}