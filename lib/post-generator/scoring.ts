import type { GeneratorContext } from "./types"
import type { IndexedCuratedPost } from "./content-index"
import { getActiveCalendarEntries } from "./calendar"

export type ScoredPost = {
  post: IndexedCuratedPost
  score: number
  matchReason: string
}

export function buildGeneratorContext(todayIso: string): GeneratorContext {
  const date = new Date(todayIso + "T12:00:00")
  const month = date.getMonth() + 1
  const calendar = getActiveCalendarEntries(date)
  const signals = new Set<string>()
  for (const entry of calendar) {
    for (const s of entry.signals) signals.add(s)
  }
  const season =
    month === 12 || month <= 2
      ? "winter"
      : month <= 5
        ? "spring"
        : month <= 8
          ? "summer"
          : "fall"

  const seasonSignals: Record<string, string[]> = {
    winter: ["cold_exposure", "heating_safety", "carbon_monoxide"],
    spring: ["flooding", "severe_storms"],
    summer: ["extreme_heat", "hot_vehicle", "water_safety"],
    fall: ["fire_safety", "school_safety"],
  }
  for (const s of seasonSignals[season] ?? []) signals.add(s)

  return {
    todayIso,
    month,
    season,
    holidays: calendar.filter((e) => e.id.includes("day") || e.id.includes("holiday")).map((e) => e.label),
    observances: calendar.map((e) => e.label),
    signals: [...signals],
  }
}

export function scoreCuratedPost(
  post: IndexedCuratedPost,
  ctx: GeneratorContext,
  targetSignals: string[],
  usedContentIds: Set<string>
): ScoredPost {
  let score = post.priority

  const signalOverlap = post.signals.filter((s) => targetSignals.includes(s)).length
  score += signalOverlap * 18

  if (post.relevantMonths.includes(ctx.month)) score += 12
  if (post.relevantSeasons.includes(ctx.season)) score += 8
  if (post.evergreen) score += 5
  if (post.hasGraphic) score += 15
  if (post.hasMessage) score += 10

  if (usedContentIds.has(post.contentId)) score -= 40

  const matchSignals = post.signals.filter((s) => targetSignals.includes(s))
  const matchReason =
    matchSignals.length > 0
      ? `Tagged for ${matchSignals.slice(0, 3).join(", ").replace(/_/g, " ")}.`
      : post.evergreen
        ? "Evergreen safety reminder useful year-round."
        : `Timely for ${ctx.season} and this time of year.`

  return { post, score, matchReason }
}

export function rankCuratedPosts(
  posts: IndexedCuratedPost[],
  ctx: GeneratorContext,
  targetSignals: string[],
  usedContentIds: Set<string>,
  limit = 5,
  requireSignalMatch = false
): ScoredPost[] {
  const scored = posts
    .map((p) => scoreCuratedPost(p, ctx, targetSignals, usedContentIds))
    .filter(
      (s) =>
        s.score > 30 &&
        (!requireSignalMatch || s.post.signals.some((signal) => targetSignals.includes(signal)))
    )
    .sort((a, b) => b.score - a.score)

  const seenSignals = new Set<string>()
  const diverse: ScoredPost[] = []
  for (const item of scored) {
    const primary = item.post.signals[0] ?? item.post.title
    if (seenSignals.has(primary) && diverse.length >= 2) continue
    seenSignals.add(primary)
    diverse.push(item)
    if (diverse.length >= limit) break
  }
  return diverse
}
