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

function isOfficialAlertTemplateTopic(input: ExternalOpportunityInput): boolean {
  return (
    input.sourceLabel === "Weather Alert" ||
    input.sourceLabel === "Weather Analysis" ||
    /road_closure|boil_water|utility|public_works/i.test(input.category || "")
  )
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

  // Official alerts use the premade Weather Alert / public-info canvas template
  // (client-side). Do not invent or attach unrelated SaferU safety graphics.
  // For all other topics, only attach real SaferU library images (never placeholders).
  const useAlertTemplate = isOfficialAlertTemplateTopic(input)
  const libraryGraphic =
    !useAlertTemplate &&
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
    whyThisAgency: input.whyThisAgency,
    whyThisCommunity: input.whyThisCommunity,
    residentValue: input.residentValue,
    relationshipValue: input.relationshipValue,
    issuingAuthority: input.issuingAuthority,
    supportingSources: input.supportingSources,
    qualityGateStatus: input.qualityGateStatus,
    signals: input.signals,
    curated: useAlertTemplate ? undefined : curated,
    // External facts drive the message; a curated match supplies the optional graphic/reference.
    curatedMessage: input.suggestedMessage,
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
    curatedMatchScore: useAlertTemplate ? 0 : match?.score ?? 0,
    freshnessScore: input.internalScores?.freshness ?? 85,
    totalScore:
      input.internalScores?.composite ??
      ((input.priority === "urgent" ? 95 : input.priority === "recommended_today" ? 82 : 65) +
        (!useAlertTemplate && match ? 20 : 0)),
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
    const curatedMatch = rankCuratedPosts(posts, ctx, input.signals ?? [], used, 1, true)[0]
    built.push(buildExternalFromInput(input, curatedMatch, true))
  }

  const demo = posts.every((p) => p.contentId.startsWith("demo::"))
  const cleaned = filterDismissed(dedupeByTitle(built), dismissed).sort(
    (a, b) => b.totalScore - a.totalScore
  )

  // Quality over quantity: only scored 4–5 star opportunities reach this stage.
  const topRecommended = cleaned
    .filter((opp) => (opp.recommendationTier || "top_recommended") === "top_recommended")
    .slice(0, 4)
  const couldPost = cleaned
    .filter((opp) => opp.recommendationTier === "could_post")
    .slice(0, 4)
  const uncertain: PostOpportunity[] = []

  // Legacy priority buckets still used by older UI paths.
  const dailySet = [...topRecommended, ...couldPost]
  const urgent = dailySet.filter((opp) => opp.priority === "urgent")
  const recommendedToday = dailySet.filter(
    (opp) => opp.priority === "recommended_today" && opp.opportunitySource !== "saferu_curated"
  )
  const planAhead = dailySet.filter(
    (opp) =>
      (opp.priority === "plan_ahead" || opp.priority === "optional") &&
      opp.opportunitySource !== "saferu_curated"
  )

  // Curated graphics attach to scored recommendations above. If nothing scored
  // high enough, always surface SaferU safety content so the briefing is never empty.
  let saferuSet: PostOpportunity[] = []
  if (dailySet.length === 0) {
    const curatedFallback = rankCuratedPosts(posts, ctx, ctx.signals, used, 2, false)
    saferuSet = curatedFallback.map((scored) =>
      buildCuratedOpportunity(
        scored,
        ctx,
        scored.matchReason,
        "Optional — share when it supports your agency’s communication calendar."
      )
    )
  }

  return {
    urgent,
    recommendedToday,
    planAhead,
    topRecommended,
    couldPost,
    uncertain,
    fromSaferU: saferuSet,
    emptyState:
      topRecommended.length === 0 &&
      couldPost.length === 0 &&
      uncertain.length === 0 &&
      saferuSet.length === 0,
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
