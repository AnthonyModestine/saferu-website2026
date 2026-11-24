import type OpenAI from "openai"
import type { ZodType } from "zod"
import type { AiResult } from "./ai-result"
import { experimentalPressGateModel } from "./ai-config/phase2"
import { tokensFromOpenAIUsage } from "./openai-usage"

export type PioStructuredCallOptions = {
  /** Override model (e.g. experimental press gate). Default gpt-4o-mini. */
  model?: string
  /** When true and SAFERU_AI_PRESS_GATE_STRONG is on, use the strong gate model. */
  useExperimentalGateModel?: boolean
}

export async function runPioStructuredCall<T>(
  openai: OpenAI,
  systemPrompt: string,
  payload: unknown,
  responseFormat: object,
  schema: ZodType<T>,
  maxTokens: number,
  temperature = 0,
  options?: PioStructuredCallOptions
): Promise<AiResult<T>> {
  const experimental =
    options?.useExperimentalGateModel ? experimentalPressGateModel() : null
  const model = options?.model || experimental || "gpt-4o-mini"

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(payload, null, 2) },
      ],
      response_format: responseFormat as never,
      max_tokens: maxTokens,
      temperature,
    })
    const tokensUsed = tokensFromOpenAIUsage(completion.usage)
    const choice = completion.choices[0]
    const raw = choice?.message?.content
    if (!raw) return { ok: false, reason: "empty_response" }
    if (choice.finish_reason === "length") {
      return { ok: false, reason: "invalid_json", detail: "Structured response was truncated." }
    }
    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      return { ok: false, reason: "invalid_json", detail: "Structured response was not JSON." }
    }
    const parsed = schema.safeParse(json)
    if (!parsed.success) {
      return { ok: false, reason: "invalid_json", detail: parsed.error.message }
    }
    return { ok: true, data: parsed.data, tokensUsed }
  } catch (error) {
    return {
      ok: false,
      reason: "openai_error",
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}
