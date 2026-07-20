/**
 * Translate public-safety copy to U.S. Spanish. Does not consume generation quota.
 * Opt-in only — callers must request translation explicitly (never auto-run on generate).
 */

import type { AiResult } from "./ai-result"
import { EVENT_TRANSLATE_SYSTEM_PROMPT, TRANSLATE_SYSTEM_PROMPT } from "./pio-prompts"

export async function translateToAmericanSpanish(
  text: string,
  options?: { contentType?: "general" | "event" }
): Promise<AiResult<string>> {
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
        {
          role: "system",
          content:
            options?.contentType === "event"
              ? EVENT_TRANSLATE_SYSTEM_PROMPT
              : TRANSLATE_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Translate this ${options?.contentType === "event" ? "event" : "public-safety"} message to U.S. Spanish:\n\n${trimmed}`,
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
