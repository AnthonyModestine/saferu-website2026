import type { AiResult } from "@/lib/ai-result"
import { buildWriterBriefFromRecommendation } from "@/lib/post-generator/build-writer-brief"
import type {
  PipelineAgencyContext,
  Stage1Recommendation,
  Stage2Draft,
  Stage3Decision,
} from "@/lib/post-generator/pipeline-types"
import type { PioWriterResult } from "@/lib/post-generator/pio-writer-types"
import type { RankedExternalOpportunity } from "@/lib/post-generator/types"
import { reviewPioFacebookPost } from "@/lib/post-generator/review-pio-facebook-post"

function toPioWriterResult(draft: Stage2Draft): PioWriterResult {
  return {
    status: draft.status,
    postText: draft.postText,
    usedFactIds: draft.usedFactIds,
    sourceAttribution: draft.sourceAttribution || null,
    humanReviewReason: draft.humanReviewReason || null,
  }
}

export async function runStage3QualityGate(
  context: PipelineAgencyContext,
  recommendation: Stage1Recommendation,
  draft: Stage2Draft,
  source?: RankedExternalOpportunity
): Promise<AiResult<Stage3Decision>> {
  const writerBrief = buildWriterBriefFromRecommendation(recommendation, context, source)
  const reviewed = await reviewPioFacebookPost(writerBrief, toPioWriterResult(draft))
  if (!reviewed.ok) return reviewed

  const data = reviewed.data
  return {
    ok: true,
    data: {
      status: data.status,
      finalPostText: data.finalPostText,
      changed: data.changed,
      changeReasons: data.changeReasons,
      checks: data.checks,
      humanReviewReason: data.humanReviewReason ?? "",
      changesMade: data.changeReasons,
      flags: data.changed ? data.changeReasons : [],
    },
  }
}
