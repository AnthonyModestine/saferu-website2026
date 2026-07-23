import type { AiResult } from "@/lib/ai-result"
import { buildWriterBriefFromRecommendation } from "@/lib/post-generator/build-writer-brief"
import type {
  PipelineAgencyContext,
  Stage1Recommendation,
  Stage2Draft,
} from "@/lib/post-generator/pipeline-types"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"
import {
  buildPostMessageInputFromRecommendation,
  generatePostMessage,
} from "@/lib/post-generator/post-message"

export async function runStage2Writer(
  context: PipelineAgencyContext,
  recommendation: Stage1Recommendation,
  source?: RankedExternalOpportunity
): Promise<AiResult<Stage2Draft>> {
  const input = buildPostMessageInputFromRecommendation(recommendation, context, source)
  const result = await generatePostMessage(input, {
    city: context.city,
    county: context.county,
    state: context.state,
  })
  if (!result.ok) return result

  return {
    ok: true,
    data: {
      status: result.data.status,
      postText: result.data.postText,
      usedFactIds: result.data.usedFactIds,
      sourceAttribution: result.data.sourceAttribution ?? "",
      humanReviewReason: result.data.humanReviewReason ?? "",
    },
  }
}
