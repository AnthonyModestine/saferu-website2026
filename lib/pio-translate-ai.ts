/**
 * Translate Press Center social copy to American Spanish (US).
 * Uses OPENAI_API_KEY. Does not consume generation quota.
 */

import type { AiResult } from "./ai-result"

const SYSTEM_PROMPT = `You translate English public safety social media posts into American Spanish (US Spanish).

Rules:
- Preserve meaning, urgency, and professional PIO tone.
- Keep phone numbers, URLs, email addresses, case numbers, and dates exactly as written.
- Use natural American Spanish appropriate for law enforcement community messaging.
- Do not add new facts or embellish.
- Return only the translated text. No explanations, labels, or markdown.`

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
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Translate this Facebook post to American Spanish:\n\n${trimmed}`,
        },
      ],
      max_tokens: 1200,
      temperature: 0.2,
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
