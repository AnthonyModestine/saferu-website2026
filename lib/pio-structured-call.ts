import type OpenAI from "openai"
import type { ZodType } from "zod"
import type { AiResult } from "./ai-result"

export async function runPioStructuredCall<T>(
  openai: OpenAI,
  systemPrompt: string,
  payload: unknown,
  responseFormat: object,
  schema: ZodType<T>,
  maxTokens: number,
  temperature = 0
): Promise<AiResult<T>> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(payload, null, 2) },
      ],
      response_format: responseFormat as never,
      max_tokens: maxTokens,
      temperature,
    })
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
    return { ok: true, data: parsed.data }
  } catch (error) {
    return {
      ok: false,
      reason: "openai_error",
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}
