import type { AiResult } from "@/lib/ai-result"
import { buildWriterBriefFromRecommendation } from "@/lib/post-generator/build-writer-brief"
import type {
  PipelineAgencyContext,
  Stage1Recommendation,
  Stage2Draft,
} from "@/lib/post-generator/pipeline-types"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"
import { writePioFacebookPost } from "@/lib/post-generator/write-pio-facebook-post"

export async function runStage2Writer(
  context: PipelineAgencyContext,
  recommendation: Stage1Recommendation,
  source?: RankedExternalOpportunity
): Promise<AiResult<Stage2Draft>> {
  const writerBrief = buildWriterBriefFromRecommendation(recommendation, context, source)
  const result = await writePioFacebookPost(writerBrief)
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
