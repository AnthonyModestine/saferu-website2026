import type { IndexedCuratedPost } from "@/lib/post-generator/content-index"
import { buildGeneratorContext, rankCuratedPosts } from "@/lib/post-generator/scoring"
import type { ExternalOpportunityInput } from "@/lib/post-generator/types"
import { isNationalValueSource } from "@/lib/post-generator/trusted-sources"

const GENERIC_CURATED_SIGNALS = new Set([
  "public_safety",
  "safety",
  "community",
  "community_engagement",
  "awareness",
])

export type SaferuContentMatch = {
  post: IndexedCuratedPost
  score: number
  matchReason: string
}

export function isOfficialAlertTemplateTopic(input: ExternalOpportunityInput): boolean {
  return (
    input.sourceLabel === "Weather Alert" ||
    input.sourceLabel === "Weather Analysis" ||
    /road_closure|boil_water|utility|public_works/i.test(input.category || "")
  )
}

export function expandSignalsForSaferuMatch(input: ExternalOpportunityInput): string[] {
  const signals = new Set(input.signals ?? [])
  const text = `${input.title} ${input.summary} ${input.category} ${input.whyItMatters}`.toLowerCase()
  const mappings: Array<[RegExp, string[]]> = [
    [/hurricane|tropical/, ["hurricane", "tropical_weather", "emergency_preparedness"]],
    [/tornado/, ["tornado", "severe_weather"]],
    [/thunder|severe storm/, ["severe_weather", "severe_thunderstorm"]],
    [/flood|flash flood/, ["flooding", "flood"]],
    [/winter|snow|ice|blizzard/, ["winter_storm", "cold_exposure", "heating_safety"]],
    [/heat|excessive heat/, ["extreme_heat", "heat"]],
    [/wind chill|high wind/, ["wind", "severe_weather"]],
    [/boil.?water/, ["boil_water", "water"]],
    [/vehicle break|car break|auto burglar/, ["vehicle_security", "9pm_routine", "vehicle_theft"]],
    [/break.?in/, ["vehicle_security", "9pm_routine", "residential_burglary"]],
    [/residential fire|structure fire|house fire/, ["fire_safety", "smoke_alarm", "cooking_fire"]],
    [/power outage|utility outage/, ["power_outage", "generator_safety"]],
    [/missing person/, ["missing_person"]],
    [/evacuation/, ["evacuation", "emergency_preparedness"]],
  ]
  for (const [pattern, tokens] of mappings) {
    if (pattern.test(text)) tokens.forEach((token) => signals.add(token))
  }
  return [...signals]
}

function meaningfulSignalOverlap(
  input: ExternalOpportunityInput,
  match: { post: IndexedCuratedPost }
): string[] {
  const targets = new Set(expandSignalsForSaferuMatch(input))
  return match.post.signals.filter(
    (signal) => targets.has(signal) && !GENERIC_CURATED_SIGNALS.has(signal)
  )
}

export function shouldAttachSaferuLibraryGraphic(
  input: ExternalOpportunityInput,
  match: { post: IndexedCuratedPost; score: number } | undefined,
  isPlaceholderGraphic: (url?: string) => boolean
): boolean {
  if (!match?.post.hasGraphic || isPlaceholderGraphic(match.post.graphicUrl)) return false
  if (isOfficialAlertTemplateTopic(input)) return false

  const overlap = meaningfulSignalOverlap(input, match)
  const hasLocalDistance =
    typeof input.distanceMiles === "number" && Number.isFinite(input.distanceMiles)
  const nationalWithoutLocal =
    (input.sourceLabel === "National Safety Alert" ||
      input.sourceLabel === "Federal Advisory" ||
      isNationalValueSource(input.sourceUrl, input.sourceName)) &&
    !hasLocalDistance

  if (nationalWithoutLocal) {
    return match.score >= 70 && overlap.length >= 2
  }
  return match.score >= 55 && overlap.length >= 1
}

export function shouldAttachSaferuSafetyMessaging(
  input: ExternalOpportunityInput,
  match: { post: IndexedCuratedPost; score: number } | undefined
): boolean {
  if (!match?.post.hasMessage || !match.post.message.trim()) return false
  if (match.score < 40) return false

  const expanded = new Set(expandSignalsForSaferuMatch(input))
  const overlap = match.post.signals.filter(
    (signal) => expanded.has(signal) && !GENERIC_CURATED_SIGNALS.has(signal)
  )
  if (overlap.length >= 1) return true

  if (isOfficialAlertTemplateTopic(input)) {
    return keywordSignalOverlap(input, match).length >= 1 && match.score >= 42
  }

  return match.score >= 52 && keywordSignalOverlap(input, match).length >= 1
}

function keywordSignalOverlap(
  input: ExternalOpportunityInput,
  match: { post: IndexedCuratedPost }
): string[] {
  const text = `${input.title} ${input.summary} ${input.category}`.toLowerCase()
  return match.post.signals.filter((signal) => {
    const spaced = signal.replace(/_/g, " ")
    return text.includes(spaced) || text.includes(signal.replace(/_/g, ""))
  })
}

export function resolveSaferuContentMatch(
  input: ExternalOpportunityInput,
  posts: IndexedCuratedPost[],
  todayIso: string,
  usedContentIds: Set<string> = new Set(),
  isPlaceholderGraphic: (url?: string) => boolean = (url) =>
    !url?.trim() || /placeholder-\d+\.jpg/i.test(url)
): SaferuContentMatch | undefined {
  const ctx = buildGeneratorContext(todayIso)
  const matchSignals = expandSignalsForSaferuMatch(input)
  const candidates = rankCuratedPosts(posts, ctx, matchSignals, usedContentIds, 5, false)
  const graphicMatch = candidates.find((candidate) =>
    shouldAttachSaferuLibraryGraphic(input, candidate, isPlaceholderGraphic)
  )
  if (graphicMatch) return graphicMatch
  return candidates.find((candidate) => shouldAttachSaferuSafetyMessaging(input, candidate))
}

/** SaferU library posts appear as their own recommendation card — never woven into another caption. */
export function shouldOfferSeparateSaferuCard(
  input: ExternalOpportunityInput,
  match: { post: IndexedCuratedPost; score: number } | undefined,
  isPlaceholderGraphic: (url?: string) => boolean = (url) =>
    !url?.trim() || /placeholder-\d+\.jpg/i.test(url)
): boolean {
  if (!match || !shouldAttachSaferuSafetyMessaging(input, match)) return false
  // Active alerts get a separate preparedness card; the alert card keeps the template graphic.
  if (isOfficialAlertTemplateTopic(input)) return true
  // Prevention topics that already use the SaferU graphic as the primary card do not need a duplicate.
  if (shouldAttachSaferuLibraryGraphic(input, match, isPlaceholderGraphic)) return false
  return true
}
