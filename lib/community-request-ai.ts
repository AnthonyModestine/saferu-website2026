/**
 * Generate video request text using OpenAI.
 */

import type { AiResult } from "./ai-result"
import { ASSISTANCE_DRAFT_PROMPT } from "./pio-prompts"
import {
  ASSISTANCE_RESPONSE_FORMAT,
  assistanceDraftSchema,
  type AssistanceDraft,
} from "./pio-structured-schemas"
import { runPioStructuredCall } from "./pio-structured-call"

export async function generateStructuredCommunityRequest(
  userPayload: Record<string, unknown>
): Promise<AiResult<AssistanceDraft>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    console.error("[community-request-ai] OPENAI_API_KEY is not set")
    return { ok: false, reason: "missing_api_key" }
  }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    return runPioStructuredCall(
      openai,
      ASSISTANCE_DRAFT_PROMPT,
      userPayload,
      ASSISTANCE_RESPONSE_FORMAT,
      assistanceDraftSchema,
      1600,
      0.1
    )
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[community-request-ai] OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

export function renderAssistanceRequest(draft: AssistanceDraft): string {
  return [draft.headline, ...draft.paragraphs, draft.safetyLine]
    .map((value) => value.trim())
    .filter(Boolean)
    .join("\n\n")
}

export async function generateCommunityRequestWithAI(
  userPayload: Record<string, unknown>
): Promise<AiResult<string>> {
  const result = await generateStructuredCommunityRequest(userPayload)
  if (!result.ok) return result
  if (result.data.status === "needs_human_review") {
    return { ok: false, reason: "invalid_json", detail: result.data.humanReviewReason }
  }
  return { ok: true, data: renderAssistanceRequest(result.data) }
}
