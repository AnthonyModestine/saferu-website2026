import type { AiResult } from "@/lib/ai-result"
import type { PipelineAgencyContext } from "@/lib/post-generator/pipeline-types"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"
import { buildWriterBriefFromOpportunity } from "@/lib/post-generator/build-writer-brief"
import { writePioFacebookPost } from "@/lib/post-generator/write-pio-facebook-post"
import { hasRealAgencyName } from "./caption-voice"
import {
  buildWeatherAlertPost,
  isWeatherAlertOpportunity,
  localizeAlertArea,
  type WeatherAlertMessageInput,
  type WeatherMessageContext,
  weatherSafetyReminder,
} from "./weather-alert-message"

export type WeatherMessageBrief = {
  agencyName: string
  agencyType: string
  agencyRoleProfile: string
  communityFocus: string
  alertType: string
  issuingOffice: string
  effectiveThrough?: string
  officialGuidance?: string
  safetyAngle: string
}

function extractRawNwsArea(facts: string[], summary?: string): string | undefined {
  for (const fact of facts) {
    const match = fact.match(/^Affected area:\s*(.+)$/i)
    if (match?.[1]?.trim()) return match[1].trim()
  }
  const community = facts.find((f) => /^Community focus:/i.test(f))
  if (community) return undefined
  const summaryMatch = summary?.match(/\bfor\s+(.+?)\.?$/i)
  if (summaryMatch?.[1]?.trim() && summaryMatch[1].includes(";")) {
    return summaryMatch[1].trim()
  }
  return undefined
}

function extractNwsOffice(facts: string[], summary?: string): string | undefined {
  for (const text of [...facts, summary || ""]) {
    const match = text.match(/\bby\s+(NWS\s+[^.]+)/i)
    if (match?.[1]?.trim()) return match[1].trim().replace(/\s+[A-Z]{2}$/, "").trim()
  }
  return undefined
}

function extractEffectiveThrough(
  facts: string[],
  summary?: string,
  eventEnd?: string
): string | undefined {
  for (const text of [...facts, summary || ""]) {
    const match = text.match(/\buntil\s+(.+?)(?:\s+by\s+NWS|$)/i)
    if (match?.[1]?.trim()) return match[1].trim()
  }
  if (eventEnd) {
    const date = new Date(eventEnd)
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    }
  }
  return undefined
}

export function buildWeatherMessageBrief(
  opportunity: WeatherAlertMessageInput,
  context: Pick<
    PipelineAgencyContext,
    "agencyName" | "agencyType" | "agencyRoleProfile" | "city" | "county" | "state"
  >
): WeatherMessageBrief {
  const facts = opportunity.verifiedFacts ?? []
  const communityFocus = localizeAlertArea(extractRawNwsArea(facts, opportunity.summary), {
    city: context.city,
    county: context.county,
    state: context.state,
  })
  const communityFact = facts.find((f) => /^Community focus:/i.test(f))
  const focus =
    communityFact?.replace(/^Community focus:\s*/i, "").trim() || communityFocus

  return {
    agencyName: hasRealAgencyName(context.agencyName)
      ? context.agencyName.trim()
      : "the public safety agency",
    agencyType: context.agencyType || "public safety",
    agencyRoleProfile: context.agencyRoleProfile || "",
    communityFocus: focus,
    alertType: opportunity.title.trim(),
    issuingOffice: extractNwsOffice(facts, opportunity.summary) || "National Weather Service",
    effectiveThrough: extractEffectiveThrough(
      facts,
      opportunity.summary,
      opportunity.eventEnd
    ),
    officialGuidance: opportunity.publicCallToAction?.find((item) => item.trim())?.trim(),
    safetyAngle: weatherSafetyReminder(opportunity.title),
  }
}

/** Clean facts for the 3-stage pipeline — no multi-county dumps. */
export function prepareWeatherOpportunityForPipeline(
  opportunity: RankedExternalOpportunity,
  context: Pick<PipelineAgencyContext, "city" | "county" | "state">
): RankedExternalOpportunity {
  if (!isWeatherAlertOpportunity(opportunity)) return opportunity

  const brief = buildWeatherMessageBrief(opportunity, {
    agencyName: "",
    agencyType: "",
    agencyRoleProfile: "",
    city: context.city,
    county: context.county,
    state: context.state,
  })

  const verifiedFacts = [
    `The ${brief.issuingOffice} issued a ${brief.alertType} affecting ${brief.communityFocus}.`,
    brief.effectiveThrough ? `In effect through ${brief.effectiveThrough}.` : null,
    brief.officialGuidance ? `Official guidance: ${brief.officialGuidance}` : null,
  ].filter((item): item is string => Boolean(item))

  return {
    ...opportunity,
    summary: `A ${brief.alertType} is in effect for ${brief.communityFocus}.`,
    verifiedFacts,
    issuingAuthority: brief.issuingOffice,
    suggestedMessage: undefined,
  }
}

function weatherOpportunityFromBrief(
  brief: WeatherMessageBrief,
  opportunity: WeatherAlertMessageInput
): RankedExternalOpportunity {
  const verifiedFacts = [
    `The ${brief.issuingOffice} issued a ${brief.alertType} affecting ${brief.communityFocus}.`,
    brief.effectiveThrough ? `In effect through ${brief.effectiveThrough}.` : "",
    brief.officialGuidance ? `Official guidance: ${brief.officialGuidance}` : "",
  ].filter(Boolean)

  return {
    id: "weather-fallback",
    title: brief.alertType,
    summary: `A ${brief.alertType} is in effect for ${brief.communityFocus}.`,
    category: "weather",
    sourceLabel: opportunity.sourceLabel || "Weather Alert",
    whyItMatters: `Residents in ${brief.communityFocus} should monitor this ${brief.alertType}.`,
    recommendedAction: brief.officialGuidance || brief.safetyAngle,
    recommendedPostTiming: "as soon as possible",
    priority: /warning/i.test(brief.alertType) ? "urgent" : "recommended_today",
    signals: ["weather"],
    verifiedFacts,
    publicCallToAction: brief.officialGuidance ? [brief.officialGuidance] : [brief.safetyAngle],
    issuingAuthority: brief.issuingOffice,
    internalScores: {
      agencyRelevance: 5,
      geographicRelevance: 5,
      residentValue: 5,
      actionability: 5,
      urgency: /warning/i.test(brief.alertType) ? 5 : 3,
      sourceTrust: 5,
      seasonalRelevance: 3,
      engagementPotential: 3,
      freshness: 5,
      composite: 5,
      pioRating: 5,
    },
  }
}

export async function writeWeatherAlertMessage(
  brief: WeatherMessageBrief,
  context: Pick<
    PipelineAgencyContext,
    "agencyName" | "agencyType" | "agencyRoleProfile" | "agencyVoiceProfile" | "city" | "county" | "state"
  >
): Promise<AiResult<{ message: string }>> {
  const opportunity = weatherOpportunityFromBrief(brief, { title: brief.alertType, sourceLabel: "Weather Alert" })
  const writerBrief = buildWriterBriefFromOpportunity(opportunity, context)
  const ai = await writePioFacebookPost(writerBrief)
  if (ai.ok && ai.data.status === "ready" && ai.data.postText.trim()) {
    return { ok: true, data: { message: ai.data.postText.trim() } }
  }
  return { ok: false, reason: ai.ok ? "empty_response" : ai.reason, detail: ai.ok ? undefined : ai.detail }
}

export async function resolveWeatherOpportunityMessage(
  opportunity: WeatherAlertMessageInput,
  context: Pick<
    PipelineAgencyContext,
    "agencyName" | "agencyType" | "agencyRoleProfile" | "agencyVoiceProfile" | "city" | "county" | "state"
  >
): Promise<string> {
  const brief = buildWeatherMessageBrief(opportunity, context)
  const ai = await writeWeatherAlertMessage(brief, context)
  if (ai.ok && ai.data.message.trim()) return ai.data.message.trim()

  const messageContext: WeatherMessageContext = {
    agencyName: context.agencyName,
    city: context.city,
    county: context.county,
    state: context.state,
  }
  return buildWeatherAlertPost(opportunity, messageContext)
}
