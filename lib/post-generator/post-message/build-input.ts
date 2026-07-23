import type { AiResult } from "@/lib/ai-result"
import type { PipelineAgencyContext, Stage1Recommendation } from "@/lib/post-generator/pipeline-types"
import type { PioWriterResult } from "@/lib/post-generator/pio-writer-types"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"
import { classifyPostMessage } from "./classify"
import {
  extractPostMessagePlaceholders,
  shouldUseShortWatchScript,
} from "./extract-placeholders"
import { generatePostMessageFromInput } from "./generate-post-message"
import type { PostMessageInput } from "./types"

export function buildPostMessageInputFromOpportunity(
  opportunity: RankedExternalOpportunity,
  context: Pick<
    PipelineAgencyContext,
    "agencyName" | "agencyType" | "city" | "county" | "state"
  >
): PostMessageInput {
  const serviceArea =
    [context.city, context.state].filter(Boolean).join(", ") ||
    [context.county, context.state].filter(Boolean).join(", ")

  return {
    agencyName: context.agencyName,
    agencyType: context.agencyType,
    serviceArea,
    title: opportunity.title,
    category: opportunity.category,
    sourceLabel: opportunity.sourceLabel,
    issuingAuthority: opportunity.issuingAuthority || opportunity.sourceName,
    verifiedFacts: (opportunity.verifiedFacts ?? []).map((text, index) => ({
      id: `fact-${index + 1}`,
      text,
    })),
    publicCallToAction: opportunity.publicCallToAction,
    verifiedAgencyAction: opportunity.whyThisAgency,
    eventEnd: opportunity.eventEnd,
  }
}

export function buildPostMessageInputFromRecommendation(
  recommendation: Stage1Recommendation,
  context: PipelineAgencyContext,
  source?: RankedExternalOpportunity
): PostMessageInput {
  if (source) return buildPostMessageInputFromOpportunity(source, context)

  return {
    agencyName: context.agencyName,
    agencyType: context.agencyType,
    serviceArea:
      [context.city, context.state].filter(Boolean).join(", ") ||
      [context.county, context.state].filter(Boolean).join(", "),
    title: recommendation.title,
    category: recommendation.category,
    sourceLabel: "Current Local Opportunity",
    issuingAuthority: recommendation.issuingAuthority || recommendation.primarySourceName,
    verifiedFacts: recommendation.verifiedFacts.map((fact) => ({
      id: fact.factId,
      text: fact.claim,
    })),
    publicCallToAction: recommendation.recommendedAction
      ? [recommendation.recommendedAction]
      : undefined,
    verifiedAgencyAction: recommendation.whyThisAgency,
    eventEnd: undefined,
  }
}

export async function generatePostMessage(
  input: PostMessageInput,
  serviceArea?: { city?: string; county?: string; state?: string }
): Promise<AiResult<PioWriterResult>> {
  if (!input.verifiedFacts.length) {
    return { ok: false, reason: "empty_input", detail: "No verified facts supplied." }
  }

  const placeholders = extractPostMessagePlaceholders(input, serviceArea)
  const classification = classifyPostMessage(input, {
    useShortWatch: shouldUseShortWatchScript(placeholders),
  })

  return generatePostMessageFromInput({
    input,
    classification,
    placeholders,
  })
}
