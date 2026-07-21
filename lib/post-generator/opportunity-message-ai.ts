import type { PipelineAgencyContext } from "@/lib/post-generator/pipeline-types"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"
import { buildWriterBriefFromOpportunity } from "@/lib/post-generator/build-writer-brief"
import { writePioFacebookPost } from "@/lib/post-generator/write-pio-facebook-post"
import { withPioAgencyAttribution } from "./caption-voice"
import { isWeatherAlertOpportunity } from "./weather-alert-message"
import { resolveWeatherOpportunityMessage } from "./weather-message-ai"

export type ExternalMessageBrief = {
  agencyName: string
  agencyType: string
  communityFocus: string
  title: string
  summary: string
  whyItMatters: string
  issuingAuthority?: string
  sourceName?: string
  verifiedFacts: string[]
  callsToAction: string[]
  safetyAngle?: string
}

export function buildExternalMessageBrief(
  opportunity: RankedExternalOpportunity,
  context: PipelineAgencyContext
): ExternalMessageBrief {
  const communityFocus =
    [context.city, context.state].filter(Boolean).join(", ") ||
    [context.county, context.state].filter(Boolean).join(", ") ||
    context.state ||
    "our community"

  return {
    agencyName: context.agencyName,
    agencyType: context.agencyType,
    communityFocus,
    title: opportunity.title,
    summary: opportunity.summary,
    whyItMatters: opportunity.whyItMatters,
    issuingAuthority: opportunity.issuingAuthority || opportunity.sourceName,
    sourceName: opportunity.sourceName,
    verifiedFacts: (opportunity.verifiedFacts ?? []).slice(0, 5),
    callsToAction: (opportunity.publicCallToAction ?? []).slice(0, 2),
  }
}

function templateFallback(
  opportunity: RankedExternalOpportunity,
  context: PipelineAgencyContext
): string {
  const body = [
    opportunity.summary,
    ...(opportunity.verifiedFacts ?? []).slice(0, 2),
    ...(opportunity.publicCallToAction ?? []).slice(0, 1),
  ]
    .filter(Boolean)
    .join(" ")
  return withPioAgencyAttribution(body || opportunity.title, context.agencyName, {
    title: opportunity.title,
    sourceName: opportunity.sourceName,
    issuingAuthority: opportunity.issuingAuthority,
    sourceLabel: opportunity.sourceLabel,
  })
}

/** AI-written social post for any ranked opportunity; weather uses the dedicated weather writer. */
export async function resolveOpportunityMessage(
  opportunity: RankedExternalOpportunity,
  context: PipelineAgencyContext
): Promise<string> {
  if (isWeatherAlertOpportunity(opportunity)) {
    return resolveWeatherOpportunityMessage(opportunity, context)
  }

  const writerBrief = buildWriterBriefFromOpportunity(opportunity, context)
  const ai = await writePioFacebookPost(writerBrief)
  if (ai.ok && ai.data.status === "ready" && ai.data.postText.trim()) {
    return ai.data.postText.trim()
  }
  return templateFallback(opportunity, context)
}
