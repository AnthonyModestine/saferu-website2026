/**
 * Post Generator engine — combines calendar context, curated content, and external signals.
 */

import {
  DEFAULT_DAILY_RECOMMENDATION_LIMIT,
  type CuratedContentRef,
  type ExternalOpportunityInput,
  type GeneratorRequest,
  type GeneratorResult,
  type PostOpportunity,
} from "./types"
import { NO_RECOMMENDATION_MESSAGE } from "./recommendation"
import { indexCuratedPosts, type IndexedCuratedPost } from "./content-index"
import { buildGeneratorContext, rankCuratedPosts } from "./scoring"

import {
  isOfficialAlertTemplateTopic,
  resolveSaferuContentMatch,
  shouldAttachSaferuLibraryGraphic,
} from "./saferu-content-match"

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

const SAFERU_LIBRARY_LIMIT = 2

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
    priority: "optional",
    recommendationTier: "could_post",
    surfacedReason: whyItMatters,
    status: "new",
    curated,
    curatedMessage: scored.post.message,
    graphicUrl:
      scored.post.hasGraphic && !isPlaceholderGraphic(scored.post.graphicUrl)
        ? scored.post.graphicUrl
        : undefined,
    graphicThumbnailUrl:
      scored.post.hasGraphic && !isPlaceholderGraphic(scored.post.graphicUrl)
        ? scored.post.graphicUrl
        : undefined,
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

function isPlaceholderGraphic(url?: string): boolean {
  if (!url?.trim()) return true
  return /placeholder-\d+\.jpg/i.test(url)
}

function buildExternalFromInput(
  input: ExternalOpportunityInput,
  match: { post: IndexedCuratedPost; score: number; matchReason: string } | undefined,
  allowGraphic: boolean
): PostOpportunity {
  const now = new Date().toISOString()
  const attachLibraryGraphic = shouldAttachSaferuLibraryGraphic(input, match, isPlaceholderGraphic)
  const curated = attachLibraryGraphic && match ? toCuratedRef(match.post, match.matchReason) : undefined

  // Official alerts use the premade Weather Alert / public-info canvas template (client-side).
  const useAlertTemplate = isOfficialAlertTemplateTopic(input)
  const externalGraphic =
    allowGraphic && !useAlertTemplate ? input.graphicUrl : undefined
  const externalThumbnail =
    allowGraphic && !useAlertTemplate ? input.graphicThumbnailUrl : undefined
  const libraryGraphic =
    !useAlertTemplate &&
    attachLibraryGraphic &&
    match?.post.graphicUrl &&
    match.post.hasGraphic &&
    !isPlaceholderGraphic(match.post.graphicUrl)
      ? match.post.graphicUrl
      : undefined

  return {
    id: input.id,
    title: input.title,
    summary: input.summary,
    category: input.category,
    sourceLabel: input.sourceLabel,
    whyItMatters: input.whyItMatters,
    surfacedReason: input.surfacedReason,
    recommendedAction: input.recommendedAction,
    recommendedPostTiming: input.recommendedPostTiming,
    opportunitySource: curated ? "external_with_saferu_match" : "external",
    priority: input.priority,
    status: "new",
    recommendationTier: input.recommendationTier,
    jurisdictionFit: input.jurisdictionFit,
    eventStart: input.eventStart,
    eventEnd: input.eventEnd,
    expiresAt: input.expiresAt,
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
    verifiedFacts: input.verifiedFacts,
    publicCallToAction: input.publicCallToAction,
    doNotClaim: input.doNotClaim,
    communicationPillar: input.communicationPillar,
    communicationGoal: input.communicationGoal,
    whyNow: input.whyNow,
    whyToday: input.whyNow || input.surfacedReason,
    whyThisAgency: input.whyThisAgency,
    whyThisCommunity: input.whyThisCommunity,
    residentValue: input.residentValue,
    relationshipValue: input.relationshipValue,
    issuingAuthority: input.issuingAuthority,
    supportingSources: input.supportingSources,
    qualityGateStatus: input.qualityGateStatus,
    signals: input.signals,
    curated: useAlertTemplate ? undefined : curated,
    curatedMessage: undefined,
    recommendationScore: input.internalScores?.composite,
    graphicUrl: externalGraphic ?? libraryGraphic,
    graphicThumbnailUrl: externalThumbnail ?? externalGraphic ?? libraryGraphic,
    graphicSourceName: externalGraphic
      ? input.graphicSourceName
      : libraryGraphic
        ? "SaferU"
        : undefined,
    graphicSourceUrl: externalGraphic ? input.graphicSourceUrl : undefined,
    graphicAltText: externalGraphic
      ? input.graphicAltText
      : libraryGraphic
        ? match?.post.title
        : undefined,
    timelinessScore: input.internalScores?.urgency ??
      (input.priority === "urgent" ? 95 : input.priority === "recommended_today" ? 88 : 70),
    safetyValueScore: input.internalScores?.residentValue ?? (input.category.includes("road") ? 75 : 85),
    actionabilityScore:
      input.internalScores?.actionability ?? (input.publicCallToAction?.length ? 90 : 75),
    sourceReliabilityScore:
      input.internalScores?.sourceTrust ?? (input.sourceName ? 85 : 70),
    curatedMatchScore: attachLibraryGraphic ? match?.score ?? 0 : 0,
    freshnessScore: input.internalScores?.freshness ?? 85,
    totalScore:
      input.internalScores?.composite ??
      ((input.priority === "urgent" ? 95 : input.priority === "recommended_today" ? 82 : 65) +
        (attachLibraryGraphic && match ? 12 : 0)),
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

  const built: PostOpportunity[] = []
  for (const input of req.externalOpportunities ?? []) {
    if (posted.has(input.id)) continue
    const curatedMatch = resolveSaferuContentMatch(input, posts, todayIso, used, isPlaceholderGraphic)
    built.push(buildExternalFromInput(input, curatedMatch, true))
  }

  const demo = posts.every((p) => p.contentId.startsWith("demo::"))
  const cleaned = filterDismissed(dedupeByTitle(built), dismissed)
    .filter((opp) => opp.opportunitySource !== "saferu_curated")
    .sort((a, b) => b.totalScore - a.totalScore)

  const dailyLimit = Math.max(
    0,
    Math.min(req.dailyLimit ?? DEFAULT_DAILY_RECOMMENDATION_LIMIT, DEFAULT_DAILY_RECOMMENDATION_LIMIT)
  )

  const selected = cleaned.slice(0, dailyLimit)
  const topRecommended = selected.filter(
    (opp) => (opp.recommendationTier || "top_recommended") === "top_recommended"
  )
  const couldPost = selected.filter((opp) => !topRecommended.includes(opp))
  const dailySet = selected
  const uncertain: PostOpportunity[] = []
  const urgent = dailySet.filter((opp) => opp.priority === "urgent")
  const recommendedToday = dailySet.filter(
    (opp) => opp.priority === "recommended_today" && opp.opportunitySource !== "saferu_curated"
  )
  const planAhead = dailySet.filter(
    (opp) =>
      (opp.priority === "plan_ahead" || opp.priority === "optional") &&
      opp.opportunitySource !== "saferu_curated"
  )

  // SaferU library is always shown separately from live community recommendations.
  const liveSignals = [
    ...new Set(cleaned.flatMap((opp) => opp.signals ?? []).filter(Boolean)),
  ]
  const saferuScored = rankCuratedPosts(
    posts,
    ctx,
    liveSignals.length ? liveSignals : ctx.signals,
    used,
    SAFERU_LIBRARY_LIMIT,
    false
  )
  const saferuSet = filterDismissed(
    saferuScored.map((scored) =>
      buildCuratedOpportunity(
        scored,
        ctx,
        scored.matchReason,
        "Ready-made safety content from the SaferU library — use anytime alongside live updates."
      )
    ),
    dismissed
  )

  const hasLocalRecommendations = dailySet.length > 0

  return {
    urgent,
    recommendedToday,
    planAhead,
    topRecommended,
    couldPost,
    uncertain,
    fromSaferU: saferuSet,
    emptyState: !hasLocalRecommendations && uncertain.length === 0,
    noRecommendationReason: !hasLocalRecommendations ? NO_RECOMMENDATION_MESSAGE : null,
    demo,
    generatedAt: new Date().toISOString(),
  }
}

export function findOpportunityInResult(
  result: GeneratorResult,
  id: string
): PostOpportunity | undefined {
  const all = [
    ...result.topRecommended,
    ...result.couldPost,
    ...result.uncertain,
    ...result.urgent,
    ...result.recommendedToday,
    ...result.planAhead,
    ...result.fromSaferU,
  ]
  return all.find((o) => o.id === id)
}

export function flattenOpportunities(result: GeneratorResult): PostOpportunity[] {
  const seen = new Set<string>()
  const out: PostOpportunity[] = []
  for (const opp of [
    ...result.topRecommended,
    ...result.couldPost,
    ...result.uncertain,
    ...result.urgent,
    ...result.recommendedToday,
    ...result.planAhead,
    ...result.fromSaferU,
  ]) {
    if (seen.has(opp.id)) continue
    seen.add(opp.id)
    out.push(opp)
  }
  return out
}
