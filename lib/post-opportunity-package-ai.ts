import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { generateMessageFromOpportunity } from "@/lib/post-generator-ai"

export type PostOpportunityPackage = {
  message: string
  imageDataUrl: string
  generationModel: string
}

export async function generatePostOpportunityPackage(opts: {
  title: string
  whyItMatters: string
  verifiedFacts: string[]
  doNotClaim: string[]
  publicCallToAction: string[]
  recommendedAction: string
  summary?: string
  sourceLabel?: string
  category?: string
  messagingAngle?: string
  jurisdictionFit?: "own" | "nearby" | "regional" | "unknown"
  visualConcept?: string
  agencyName?: string
  agencyType?: string
  agencyTypeOther?: string
  city?: string
  state?: string
  agencyLogoUrl?: string | null
  seedMessage?: string
}): Promise<AiResult<PostOpportunityPackage>> {
  const messageResult = await generateMessageFromOpportunity(
    opts.title,
    opts.whyItMatters,
    opts.verifiedFacts,
    opts.doNotClaim,
    opts.publicCallToAction,
    opts.recommendedAction,
    opts.agencyName,
    opts.city,
    opts.state,
    opts.summary || opts.seedMessage,
    opts.sourceLabel,
    opts.agencyType,
    opts.agencyTypeOther,
    opts.messagingAngle,
    opts.jurisdictionFit
  )
  if (!messageResult.ok) return messageResult

  return {
    ok: false,
    reason: "openai_error",
    detail:
      "Graphic generation is temporarily unavailable while Graphic Studio is rebuilt.",
  }
}
