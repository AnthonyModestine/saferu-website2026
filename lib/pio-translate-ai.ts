/**
 * Translate Facebook post to U.S. Spanish. Does not consume generation quota.
 */

import type { AiResult } from "./ai-result"
import { TRANSLATE_SYSTEM_PROMPT } from "./pio-prompts"

export async function translateToAmericanSpanish(text: string): Promise<AiResult<string>> {
  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: false, reason: "empty_input" }
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" }
  }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: TRANSLATE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Translate this Facebook post to U.S. Spanish:\n\n${trimmed}`,
        },
      ],
      max_tokens: 1200,
      temperature: 0,
    })

    const translated = completion.choices?.[0]?.message?.content?.trim()
    if (!translated) {
      return { ok: false, reason: "empty_response" }
    }
    return { ok: true, data: translated }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[pio-translate-ai] OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
