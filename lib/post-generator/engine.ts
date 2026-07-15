/**
 * Post Generator engine — combines calendar context, curated content, and external signals.
 */

import type {
  CuratedContentRef,
  ExternalOpportunityInput,
  GeneratorRequest,
  GeneratorResult,
  PostOpportunity,
} from "./types"
import { indexCuratedPosts, type IndexedCuratedPost } from "./content-index"
import { buildGeneratorContext, rankCuratedPosts } from "./scoring"

function toCuratedRef(post: IndexedCuratedPost, matchReason: string): CuratedContentRef {
  return {
    contentId: post.contentId,
    postId: post.postId,
    categoryId: post.categoryId,
    subcategoryId: post.subcategoryId,
    articleId: post.articleId,
    title: post.title,
    category: post.category,
    message: post.message,
    graphicUrl: post.graphicUrl,
    graphicThumbnailUrl: post.graphicUrl,
    matchReason,
  }
}

function makeId(prefix: string, seed: string): string {
  return `${prefix}-${seed.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}`
}

function buildCuratedOpportunity(
  scored: { post: IndexedCuratedPost; score: number; matchReason: string },
  ctx: ReturnType<typeof buildGeneratorContext>,
  whyItMatters: string,
  timing: string
): PostOpportunity {
  const curated = toCuratedRef(scored.post, scored.matchReason)
  const now = new Date().toISOString()
  return {
    id: makeId("saferu", scored.post.contentId),
    title: scored.post.title,
    summary: scored.post.articleDescription || scored.post.message.slice(0, 120),
    category: scored.post.signals[0]?.replace(/_/g, " ") || "safety",
    sourceLabel: "SaferU Curated Content",
    whyItMatters,
    recommendedAction: `Share the existing SaferU post: "${scored.post.title}".`,
    recommendedPostTiming: timing,
    opportunitySource: "saferu_curated",
    priority: scored.post.evergreen ? "optional" : "recommended_today",
    status: "new",
    curated,
    curatedMessage: scored.post.message,
    graphicUrl: scored.post.graphicUrl,
    graphicThumbnailUrl: scored.post.graphicUrl,
    signals: scored.post.signals,
    timelinessScore: scored.post.relevantMonths.includes(ctx.month) ? 85 : 60,
    safetyValueScore: 80,
    actionabilityScore: 75,
    sourceReliabilityScore: 95,
    curatedMatchScore: scored.score,
    freshnessScore: 70,
    totalScore: scored.score,
    confidenceLevel: "high",
    discoveredAt: now,
    updatedAt: now,
  }
}

function buildExternalFromInput(
  input: ExternalOpportunityInput,
  match: { post: IndexedCuratedPost; score: number; matchReason: string } | undefined,
  allowGraphic: boolean
): PostOpportunity {
  const now = new Date().toISOString()
  const curated = match ? toCuratedRef(match.post, match.matchReason) : undefined
  const externalGraphic = allowGraphic ? input.graphicUrl : undefined
  const externalThumbnail = allowGraphic ? input.graphicThumbnailUrl : undefined

  return {
    id: input.id,
    title: input.title,
    summary: input.summary,
    category: input.category,
    sourceLabel: input.sourceLabel,
    whyItMatters: input.whyItMatters,
    recommendedAction: input.recommendedAction,
    recommendedPostTiming: input.recommendedPostTiming,
    opportunitySource: curated ? "external_with_saferu_match" : "external",
    priority: input.priority,
    status: "new",
    eventStart: input.eventStart,
    eventEnd: input.eventEnd,
    expiresAt: input.expiresAt,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    verifiedFacts: input.verifiedFacts,
    publicCallToAction: input.publicCallToAction,
    doNotClaim: input.doNotClaim,
    signals: input.signals,
    curated,
    // External facts drive the message; a curated match supplies the optional graphic/reference.
    curatedMessage: input.suggestedMessage,
    graphicUrl: externalGraphic ?? match?.post.graphicUrl,
    graphicThumbnailUrl: externalThumbnail ?? externalGraphic ?? match?.post.graphicUrl,
    graphicSourceName: externalGraphic ? input.graphicSourceName : undefined,
    graphicSourceUrl: externalGraphic ? input.graphicSourceUrl : undefined,
    graphicAltText: externalGraphic ? input.graphicAltText : undefined,
    timelinessScore: input.internalScores?.urgency ??
      (input.priority === "urgent" ? 95 : input.priority === "recommended_today" ? 88 : 70),
    safetyValueScore: input.internalScores?.residentValue ?? (input.category.includes("road") ? 75 : 85),
    actionabilityScore:
      input.internalScores?.actionability ?? (input.publicCallToAction?.length ? 90 : 75),
    sourceReliabilityScore:
      input.internalScores?.sourceTrust ?? (input.sourceName ? 85 : 70),
    curatedMatchScore: match?.score ?? 0,
    freshnessScore: input.internalScores?.freshness ?? 85,
    totalScore:
      input.internalScores?.composite ??
      ((input.priority === "urgent" ? 95 : input.priority === "recommended_today" ? 82 : 65) +
        (match ? 20 : 0)),
    confidenceLevel: input.confidenceLevel ?? "medium",
    discoveredAt: now,
    updatedAt: now,
  }
}

function filterDismissed(opps: PostOpportunity[], dismissed: Set<string>): PostOpportunity[] {
  return opps.filter((o) => !dismissed.has(o.id))
}

function dedupeByTitle(opps: PostOpportunity[]): PostOpportunity[] {
  const seen = new Set<string>()
  return opps.filter((o) => {
    const key = o.title.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function generatePostOpportunities(req: GeneratorRequest): GeneratorResult {
  const todayIso = req.todayIso || new Date().toISOString().slice(0, 10)
  const ctx = buildGeneratorContext(todayIso)
  const posts = indexCuratedPosts()
  const used = new Set(req.usedContentIds ?? [])
  const dismissed = new Set(req.dismissedIds ?? [])
  const posted = new Set(req.postedFingerprints ?? [])

  const urgent: PostOpportunity[] = []
  const recommendedToday: PostOpportunity[] = []
  const planAhead: PostOpportunity[] = []
  const fromSaferU: PostOpportunity[] = []

  // Incoming externals are already scored/gated (4–5★ only). Assemble the daily briefing from them.
  for (const input of req.externalOpportunities ?? []) {
    if (posted.has(input.id)) continue
    const opp = buildExternalFromInput(input, undefined, true)
    if (opp.priority === "urgent") urgent.push(opp)
    else if (opp.priority === "recommended_today") recommendedToday.push(opp)
    else planAhead.push(opp)
  }

  const demo = posts.every((p) => p.contentId.startsWith("demo::"))

  const cleanedExternal = [
    ...filterDismissed(dedupeByTitle(urgent), dismissed),
    ...filterDismissed(dedupeByTitle(recommendedToday), dismissed),
    ...filterDismissed(dedupeByTitle(planAhead), dismissed),
  ].sort((a, b) => b.totalScore - a.totalScore)

  // Prefer: up to 4 current recommendations that already cleared the intelligence gate.
  const dailyLimit = Math.max(1, Math.min(4, req.dailyLimit ?? 4))
  const timelyHoliday = cleanedExternal.find((opp) => opp.category === "holiday_safety")
  const nonHolidayLimit = timelyHoliday ? Math.max(0, dailyLimit - 1) : dailyLimit
  const dailySet: PostOpportunity[] = []
  for (const opp of cleanedExternal) {
    if (opp.id === timelyHoliday?.id) continue
    if (dailySet.length >= nonHolidayLimit) break
    dailySet.push(opp)
  }
  if (timelyHoliday && dailySet.length < dailyLimit) dailySet.push(timelyHoliday)
  dailySet.sort((a, b) => b.totalScore - a.totalScore)

  // Match curated safety graphics ONLY to the final selected current events.
  // Preserve both the original curated graphic and original curated message.
  const selectedSignals = [...new Set(dailySet.flatMap((opp) => opp.signals ?? []))]
  const matchedCurated = rankCuratedPosts(posts, ctx, selectedSignals, used, 6, true)
  for (const scored of matchedCurated) {
    if (fromSaferU.length >= 2) break
    if (!scored.post.hasGraphic || !scored.post.graphicUrl || !scored.post.hasMessage) continue
    fromSaferU.push(
      buildCuratedOpportunity(
        scored,
        ctx,
        `${scored.matchReason} Matched to today's local recommendations.`,
        "Use today or save for later this week."
      )
    )
  }
  const saferuSet = filterDismissed(dedupeByTitle(fromSaferU), dismissed).slice(0, 2)

  const result: GeneratorResult = {
    urgent: dailySet.filter((opp) => opp.priority === "urgent"),
    recommendedToday: dailySet.filter(
      (opp) => opp.priority === "recommended_today" && opp.opportunitySource !== "saferu_curated"
    ),
    planAhead: dailySet.filter(
      (opp) =>
        (opp.priority === "plan_ahead" || opp.priority === "optional") &&
        opp.opportunitySource !== "saferu_curated"
    ),
    fromSaferU: saferuSet,
    emptyState: dailySet.length === 0 && saferuSet.length === 0,
    demo,
    generatedAt: new Date().toISOString(),
  }

  return result
}

export function findOpportunityInResult(
  result: GeneratorResult,
  id: string
): PostOpportunity | undefined {
  const all = [...result.urgent, ...result.recommendedToday, ...result.planAhead, ...result.fromSaferU]
  return all.find((o) => o.id === id)
}

export function flattenOpportunities(result: GeneratorResult): PostOpportunity[] {
  return [...result.urgent, ...result.recommendedToday, ...result.planAhead, ...result.fromSaferU]
}
