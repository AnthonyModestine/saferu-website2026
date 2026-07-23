import type { AiResult } from "@/lib/ai-result"
import type { PioWriterResult, WriterBrief } from "@/lib/post-generator/pio-writer-types"
import {
  generatePostMessage,
  type PostMessageInput,
} from "@/lib/post-generator/post-message"

function writerBriefToPostMessageInput(brief: WriterBrief): PostMessageInput {
  return {
    agencyName: brief.agency.name,
    agencyType: brief.agency.type,
    serviceArea: brief.agency.serviceArea,
    title: brief.title || brief.category,
    category: brief.category,
    issuingAuthority: brief.requiredAttribution,
    verifiedFacts: brief.verifiedFacts,
    publicCallToAction: brief.requestedPublicAction
      ? [brief.requestedPublicAction]
      : undefined,
    verifiedAgencyAction: brief.verifiedAgencyAction,
    eventEnd: brief.timing,
  }
}

/** Single shared writer for Stage 2, pipeline fallback, and Generate Post. */
export async function writePioFacebookPost(
  writerBrief: WriterBrief,
  serviceArea?: { city?: string; county?: string; state?: string }
): Promise<AiResult<PioWriterResult>> {
  if (!writerBrief.verifiedFacts.length) {
    return { ok: false, reason: "empty_input", detail: "WriterBrief has no verified facts." }
  }
  return generatePostMessage(writerBriefToPostMessageInput(writerBrief), serviceArea)
}
