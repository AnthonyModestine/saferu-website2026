/**
 * Standalone creative strategy planning against frozen approved copy.
 * Used by Phase 4 so all image variants share identical headlines/messages.
 */

import "server-only"

import type { AiResult } from "@/lib/ai-result"
import {
  creativeStrategySchema,
  CREATIVE_STRATEGY_JSON_SCHEMA,
  type CreativeStrategy,
} from "@/lib/ai-intelligence/creative-strategy"
import { ART_DIRECTION_PRINCIPLES } from "@/lib/ai-intelligence/art-direction-principles"
import { CONCEPTUAL_STRATEGY_INSTRUCTIONS } from "@/lib/ai-intelligence/conceptual-strategy-instructions"
import { researchModel } from "@/lib/graphic-studio/constants"

export async function planCreativeStrategyForApprovedCopy(opts: {
  topic: string
  audience: string
  style: string
  approvedHeadline: string
  approvedMessage: string
  visualConceptHint?: string
}): Promise<AiResult<CreativeStrategy & { tokensUsed?: number }>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const model = researchModel()

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.45,
      messages: [
        {
          role: "system",
          content: `You are SaferU's creative strategist for public-safety graphics — an experienced creative director for public awareness campaigns.

Approved headline and message are LOCKED. Do not rewrite them. Do not invent safety instructions or misleading visuals beyond them.

Return structured creative_strategy JSON only. Keep every string concise (1–2 sentences max per field). Rate executionFeasibility high|medium|low on every conceptOption with brief feasibilityNotes.

${CONCEPTUAL_STRATEGY_INSTRUCTIONS}

${ART_DIRECTION_PRINCIPLES}`,
        },
        {
          role: "user",
          content: JSON.stringify(
            {
              topic: opts.topic,
              audience: opts.audience,
              style: opts.style,
              approvedHeadline: opts.approvedHeadline,
              approvedMessage: opts.approvedMessage,
              visualConceptHint: opts.visualConceptHint || null,
              instruction:
                "Develop 2–3 fundamentally different creative approaches, select the best balance of clarity/originality/accuracy/feasibility, and return a concise direction for the image model.",
            },
            null,
            2
          ),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "creative_strategy_only",
          schema: CREATIVE_STRATEGY_JSON_SCHEMA,
          strict: true,
        },
      } as never,
      max_tokens: 3500,
    })

    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) return { ok: false, reason: "empty_response" }
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch (parseErr) {
      return {
        ok: false,
        reason: "invalid_json",
        detail: parseErr instanceof Error ? parseErr.message : String(parseErr),
      }
    }
    const parsed = creativeStrategySchema.safeParse(json)
    if (!parsed.success) {
      return { ok: false, reason: "invalid_json", detail: parsed.error.message }
    }
    const tokens =
      (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0)
    return { ok: true, data: { ...parsed.data, tokensUsed: tokens } }
  } catch (err) {
    return {
      ok: false,
      reason: "openai_error",
      detail: err instanceof Error ? err.message : String(err),
    }
  }
}

/** Retry wrapper for flaky model JSON. */
export async function planCreativeStrategyForApprovedCopyWithRetry(
  opts: Parameters<typeof planCreativeStrategyForApprovedCopy>[0],
  attempts = 3
): Promise<AiResult<CreativeStrategy & { tokensUsed?: number }>> {
  let last: AiResult<CreativeStrategy & { tokensUsed?: number }> | null = null
  let totalTokens = 0
  for (let i = 0; i < attempts; i++) {
    last = await planCreativeStrategyForApprovedCopy(opts)
    if (last.ok) {
      return {
        ok: true,
        data: { ...last.data, tokensUsed: (last.data.tokensUsed || 0) + totalTokens },
      }
    }
    if (last.ok === false && "detail" in last) {
      // accumulate nothing on failure
    }
    if (last.reason !== "invalid_json" && last.reason !== "empty_response") return last
  }
  return last || { ok: false, reason: "invalid_json", detail: "All strategy attempts failed." }
}
