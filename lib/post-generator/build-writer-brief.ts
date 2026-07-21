import type { PipelineAgencyContext, Stage1Recommendation } from "@/lib/post-generator/pipeline-types"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"
import { WEATHER_CATEGORY_INSTRUCTIONS } from "@/lib/post-generator/category-instructions/weather"
import { isWeatherAlertOpportunity } from "@/lib/post-generator/weather-alert-message"
import type { WriterBrief, WriterFact, WriterPurpose, WriterUrgency } from "./pio-writer-types"

function serviceAreaLabel(context: Pick<PipelineAgencyContext, "city" | "county" | "state">): string {
  const city = context.city?.trim()
  const county = context.county?.trim()
  const state = context.state?.trim()
  if (city && state) return `${city}, ${state}`
  if (county && state) return `${county} County, ${state}`
  return state || "the service area"
}

export function inferWriterCategory(
  opportunity: Pick<RankedExternalOpportunity, "title" | "category" | "sourceLabel" | "communicationPillar">
): string {
  const haystack = `${opportunity.title} ${opportunity.category} ${opportunity.sourceLabel || ""}`.toLowerCase()

  if (isWeatherAlertOpportunity(opportunity)) {
    if (/warning/.test(haystack)) return "weather_warning"
    if (/watch|outlook/.test(haystack)) return "weather_watch"
    return "weather_advisory"
  }
  if (/boil water|drinking water|water advisory|water notice/i.test(haystack)) return "boil_water"
  if (/missing person|endangered|at-risk person/i.test(haystack)) return "missing_person"
  if (/scam|fraud|impersonat/i.test(haystack)) return "scam_alert"
  if (/evacuat|wildfire|brush fire/i.test(haystack)) return "evacuation"
  if (/road closure|lane closure|detour|traffic alert/i.test(haystack)) return "road_closure"
  if (/structure fire|working fire|house fire/i.test(haystack)) return "structure_fire"
  if (/flood|flooded road/i.test(haystack)) return "flooding"
  if (/police activity|active incident|barricaded|standoff/i.test(haystack)) return "active_police_incident"
  if (/update|all clear|resolved|reopened/i.test(haystack)) return "incident_update"
  if (/arrest|charged|investigation/i.test(haystack)) return "arrest_investigation"
  if (
    opportunity.communicationPillar === "agency_event" ||
    opportunity.communicationPillar === "community_relationship"
  ) {
    return "community_event"
  }
  if (
    opportunity.communicationPillar === "public_safety_education" ||
    opportunity.communicationPillar === "seasonal_safety" ||
    opportunity.communicationPillar === "timely_prevention"
  ) {
    return "safety_prevention"
  }
  return "informational"
}

function inferWriterUrgency(
  opportunity: Pick<RankedExternalOpportunity, "title" | "priority" | "category">,
  category: string
): WriterUrgency {
  const haystack = `${opportunity.title} ${opportunity.category}`.toLowerCase()
  if (/tornado warning|evacuation order|shelter.in.place order|hazmat/i.test(haystack)) return "critical"
  if (
    opportunity.priority === "urgent" ||
    /warning|active incident|flash flood warning|structure fire/i.test(haystack)
  ) {
    return "urgent"
  }
  if (category.startsWith("weather_") || /watch|advisory|heat advisory/i.test(haystack)) return "advisory"
  if (category === "community_event") return "community"
  return "routine"
}

function inferWriterPurpose(
  category: string,
  pillar?: string,
  priority?: string
): WriterPurpose {
  if (category === "incident_update") return "update"
  if (category === "missing_person") return "request_assistance"
  if (category === "community_event") return "invite"
  if (category === "safety_prevention" || pillar === "public_safety_education") return "safety_reminder"
  if (category.startsWith("weather_") || category === "evacuation" || category === "active_police_incident") {
    return "alert"
  }
  if (priority === "urgent") return "alert"
  return "inform"
}

function factsFromRecommendation(recommendation: Stage1Recommendation): WriterFact[] {
  return recommendation.verifiedFacts.map((fact) => ({
    id: fact.factId,
    text: fact.claim,
  }))
}

function factsFromOpportunity(opportunity: RankedExternalOpportunity): WriterFact[] {
  return (opportunity.verifiedFacts ?? []).map((claim, index) => ({
    id: `fact-${index + 1}`,
    text: claim,
  }))
}

function conciseLocalRelevance(
  recommendation?: Stage1Recommendation,
  opportunity?: RankedExternalOpportunity
): string | undefined {
  const raw =
    recommendation?.whyThisCommunity?.trim() ||
    recommendation?.residentValue?.trim() ||
    opportunity?.whyItMatters?.trim()
  if (!raw) return undefined
  const sentence = raw.split(/[.!?]/)[0]?.trim()
  if (!sentence || sentence.length > 220) return raw.slice(0, 220).trim()
  return sentence
}

export function buildWriterBriefFromRecommendation(
  recommendation: Stage1Recommendation,
  context: PipelineAgencyContext,
  source?: RankedExternalOpportunity
): WriterBrief {
  const oppLike: RankedExternalOpportunity = source ?? {
    id: recommendation.id,
    title: recommendation.title,
    summary: recommendation.residentValue,
    category: recommendation.category,
    sourceLabel: "Current Local Opportunity",
    whyItMatters: recommendation.whyThisCommunity,
    priority: recommendation.priority === "critical" ? "urgent" : "recommended_today",
    communicationPillar: recommendation.communicationPillar,
  }
  const category = inferWriterCategory(oppLike)
  const urgency = inferWriterUrgency(oppLike, category)
  const purpose = inferWriterPurpose(category, recommendation.communicationPillar, recommendation.priority)

  const categoryInstructions = category.startsWith("weather_") ? [...WEATHER_CATEGORY_INSTRUCTIONS] : undefined

  return {
    agency: {
      name: context.agencyName,
      type: context.agencyType,
      serviceArea: serviceAreaLabel(context),
      roleProfile: context.agencyRoleProfile || undefined,
      voiceProfile: context.agencyVoiceProfile || undefined,
    },
    category,
    purpose,
    urgency,
    audience: "residents and motorists in the service area",
    localRelevance: conciseLocalRelevance(recommendation),
    verifiedFacts: factsFromRecommendation(recommendation),
    requiredAttribution: recommendation.issuingAuthority || recommendation.primarySourceName || undefined,
    requestedPublicAction: recommendation.recommendedAction || undefined,
    verifiedAgencyAction: recommendation.whyThisAgency || undefined,
    location: serviceAreaLabel(context),
    timing: recommendation.recommendedPostTiming || undefined,
    sourceLink: recommendation.primarySourceUrl || undefined,
    mustNotSay: recommendation.doNotClaim?.length ? recommendation.doNotClaim : undefined,
    categoryInstructions,
  }
}

export function buildWriterBriefFromOpportunity(
  opportunity: RankedExternalOpportunity,
  context: Pick<
    PipelineAgencyContext,
    "agencyName" | "agencyType" | "agencyRoleProfile" | "agencyVoiceProfile" | "city" | "county" | "state"
  >
): WriterBrief {
  const category = inferWriterCategory(opportunity)
  const urgency = inferWriterUrgency(opportunity, category)
  const purpose = inferWriterPurpose(category, opportunity.communicationPillar, opportunity.priority)

  const categoryInstructions = category.startsWith("weather_") ? [...WEATHER_CATEGORY_INSTRUCTIONS] : undefined

  return {
    agency: {
      name: context.agencyName,
      type: context.agencyType,
      serviceArea: serviceAreaLabel(context),
      roleProfile: context.agencyRoleProfile || undefined,
      voiceProfile: context.agencyVoiceProfile || undefined,
    },
    category,
    purpose,
    urgency,
    audience: "residents and motorists in the service area",
    localRelevance: conciseLocalRelevance(undefined, opportunity),
    verifiedFacts: factsFromOpportunity(opportunity),
    requiredAttribution: opportunity.issuingAuthority || opportunity.sourceName || undefined,
    requestedPublicAction:
      opportunity.recommendedAction ||
      (opportunity.publicCallToAction ?? []).slice(0, 1).join(" ") ||
      undefined,
    verifiedAgencyAction: opportunity.whyThisAgency || undefined,
    location: serviceAreaLabel(context),
    timing: opportunity.recommendedPostTiming || opportunity.eventEnd || undefined,
    sourceLink: opportunity.sourceUrl || undefined,
    mustNotSay: opportunity.doNotClaim?.length ? opportunity.doNotClaim : undefined,
    categoryInstructions,
  }
}

/** Legacy adapter: map postText to facebook_post for callers that still expect it. */
export function legacyFacebookPostField(result: { postText: string }): { facebook_post: string } {
  return { facebook_post: result.postText }
}
