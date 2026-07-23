import type { RankedExternalOpportunity } from "@/lib/post-generator/types"
import { MIN_RECOMMENDATION_SCORE } from "./constants"

export interface CandidateScoringContext {
  recentTopicKeys?: string[]
  postedFingerprints?: string[]
}

export interface ScoredCandidate {
  opportunity: RankedExternalOpportunity
  score: number
  eligible: boolean
  rejectReason?: string
  breakdown: {
    geographicRelevance: number
    urgencyAndImpact: number
    postValueToday: number
    timeliness: number
    sourceAuthority: number
    agencyRelevance: number
    actionability: number
    saferuContentMatch: number
    penalties: number
  }
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function scale(value: number | undefined, maxPoints: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0
  return (clamp(value) / 100) * maxPoints
}

function geographicPoints(opp: RankedExternalOpportunity): number {
  const fit = opp.jurisdictionFit
  if (fit === "own") return 20
  if (fit === "nearby") return 10
  if (fit === "regional") return 4
  return scale(opp.internalScores?.geographicRelevance, 20)
}

function urgencyPoints(opp: RankedExternalOpportunity): number {
  if (opp.priority === "urgent") return 15
  const urgency = opp.internalScores?.urgency ?? 0
  if (urgency >= 90) return 15
  if (urgency >= 70) return 12
  if (urgency >= 50) return 8
  if (urgency >= 30) return 4
  return 0
}

function postValueTodayPoints(opp: RankedExternalOpportunity): number {
  if (opp.priority === "urgent") return 20
  const whyToday = (opp.whyNow || opp.surfacedReason || opp.whyItMatters || "").trim()
  if (whyToday.length >= 40) return 17
  if (opp.recommendedPostTiming?.toLowerCase().includes("immediate")) return 20
  if (opp.priority === "recommended_today") return 14
  if (opp.priority === "plan_ahead") return 10
  if (whyToday) return 10
  return 5
}

function topicFamily(category: string): string {
  const normalized = category.toLowerCase()
  if (/weather|storm|tornado|flood|heat|cold|wind|hurricane|winter/.test(normalized)) {
    return "weather"
  }
  if (/road|traffic|closure|transit|construction/.test(normalized)) return "traffic"
  if (/crime|police|theft|scam|missing/.test(normalized)) return "crime"
  if (/fire|wildfire|smoke|evacuation/.test(normalized)) return "fire"
  if (/water|boil|sewer/.test(normalized)) return "water"
  if (/utility|power|outage|gas/.test(normalized)) return "utility"
  if (/health|air.?quality/.test(normalized)) return "health"
  if (/prevent|safety|routine/.test(normalized)) return "prevention"
  return normalized.split(/\s+/)[0] || "other"
}

export function scorePioCandidate(
  opportunity: RankedExternalOpportunity,
  ctx: CandidateScoringContext = {}
): ScoredCandidate {
  const scores = opportunity.internalScores
  let penalties = 0

  if (opportunity.jurisdictionFit === "regional") penalties += 8
  if (opportunity.jurisdictionFit === "unknown") penalties += 15

  const whyToday = (
    opportunity.whyNow ||
    opportunity.surfacedReason ||
    opportunity.whyItMatters ||
    ""
  ).trim()
  if (!whyToday || whyToday.length < 20) penalties += 15

  const topic = topicFamily(opportunity.category || "")
  if ((ctx.recentTopicKeys ?? []).some((key) => key.includes(topic))) penalties += 10
  if ((ctx.postedFingerprints ?? []).includes(opportunity.id)) penalties += 10

  if (
    opportunity.recommendationTier === "uncertain" ||
    (scores?.pioRating ?? 0) < 4
  ) {
    penalties += 20
  }

  const breakdown = {
    geographicRelevance: geographicPoints(opportunity),
    urgencyAndImpact: urgencyPoints(opportunity),
    postValueToday: postValueTodayPoints(opportunity),
    timeliness: scale(scores?.freshness, 10),
    sourceAuthority: scale(scores?.sourceTrust, 15),
    agencyRelevance: scale(scores?.agencyRelevance, 10),
    actionability: scale(scores?.actionability, 5),
    saferuContentMatch: 0,
    penalties,
  }

  const raw =
    breakdown.geographicRelevance +
    breakdown.urgencyAndImpact +
    breakdown.postValueToday +
    breakdown.timeliness +
    breakdown.sourceAuthority +
    breakdown.agencyRelevance +
    breakdown.actionability +
    breakdown.saferuContentMatch

  const score = clamp(raw - penalties)
  let eligible = score >= MIN_RECOMMENDATION_SCORE
  let rejectReason: string | undefined

  if (!opportunity.verifiedFacts?.length && !opportunity.sourceUrl) {
    eligible = false
    rejectReason = "missing_verified_facts"
  } else if (!whyToday) {
    eligible = false
    rejectReason = "no_why_today"
  } else if (
    opportunity.sourceLabel === "Weather Alert" ||
    opportunity.sourceLabel === "Federal Advisory"
  ) {
    eligible = score >= 50
    if (!eligible) rejectReason = "below_score_threshold"
  } else if (score < MIN_RECOMMENDATION_SCORE) {
    eligible = false
    rejectReason = "below_score_threshold"
  }

  return {
    opportunity,
    score,
    eligible,
    rejectReason,
    breakdown,
  }
}

export { topicFamily }
