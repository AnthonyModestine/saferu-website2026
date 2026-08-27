import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { generatePostOpportunityGraphicImage } from "@/lib/pio-graphic-studio-ai"
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

  const message = messageResult.data
  const headline = opts.title.trim() || message.split(/[.!?]/)[0]?.trim() || "Community update"
  const visualConcept =
    opts.visualConcept?.trim() ||
    `A clear public-safety social graphic illustrating: ${opts.title}. Match the tone of a ${opts.sourceLabel || "community"} post.`

  const image = await generatePostOpportunityGraphicImage({
    title: opts.title,
    category: opts.category || opts.sourceLabel || "Community",
    sourceLabel: opts.sourceLabel || "Community post",
    headline,
    mainMessage: message,
    visualConcept,
    agencyLogoUrl: opts.agencyLogoUrl,
  })

  if (!image.ok) {
    return {
      ok: false,
      reason: image.reason,
      detail: image.detail || "Could not generate a paired graphic for this post.",
    }
  }

  return {
    ok: true,
    data: {
      message,
      imageDataUrl: image.data.dataUrl,
      generationModel: image.data.model,
    },
  }
}
