/**
 * Generate video request text using OpenAI.
 */

import type { AiResult } from "./ai-result"
import { VIDEO_REQUEST_SYSTEM_PROMPT } from "./pio-prompts"

export async function generateCommunityRequestWithAI(
  userPayload: Record<string, unknown>
): Promise<AiResult<string>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    console.error("[community-request-ai] OPENAI_API_KEY is not set")
    return { ok: false, reason: "missing_api_key" }
  }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: VIDEO_REQUEST_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Write a public video request using only this JSON object:\n\n${JSON.stringify(userPayload, null, 2)}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.1,
    })

    const text = completion.choices?.[0]?.message?.content?.trim()
    if (!text) {
      return { ok: false, reason: "empty_response" }
    }
    return { ok: true, data: text }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[community-request-ai] OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
