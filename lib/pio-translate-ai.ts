/**
 * Translate public-safety copy to U.S. Spanish. Does not consume generation quota.
 * Opt-in only — callers must request translation explicitly (never auto-run on generate).
 */

import type { AiResult } from "./ai-result"
import { spanishReviewEnabled } from "./ai-config/phase2"
import { EVENT_TRANSLATE_SYSTEM_PROMPT, TRANSLATE_SYSTEM_PROMPT } from "./pio-prompts"

const BILINGUAL_REVIEW_PROMPT = `You are a bilingual public-safety editor reviewing a U.S. Spanish translation.

Compare the English source and Spanish translation. Return JSON only:
{
  "ok": boolean,
  "correctedSpanish": string,
  "issues": string[]
}

Rules:
- Preserve factual meaning exactly. Do not add facts.
- Prefer natural U.S. Spanish for public audiences.
- Preserve names, dates, times, numbers, contacts, URLs, locations, case numbers exactly.
- Flag incorrect emergency instructions or wrong formality that harms clarity.
- If the translation is already good, set ok=true and return the same Spanish.
- correctedSpanish must always be the final Spanish to publish.`

function deterministicInvariants(english: string, spanish: string): string[] {
  const issues: string[] = []
  const urlRe = /https?:\/\/[^\s]+/gi
  const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
  const phoneRe = /\+?\d[\d\s().-]{7,}\d/g

  for (const re of [urlRe, emailRe, phoneRe]) {
    const en = english.match(re) || []
    for (const token of en) {
      if (!spanish.includes(token)) {
        issues.push(`Missing preserved token: ${token}`)
      }
    }
  }
  return issues
}

export async function translateToAmericanSpanish(
  text: string,
  options?: { contentType?: "general" | "event"; sensitive?: boolean }
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

    let translated = completion.choices?.[0]?.message?.content?.trim()
    if (!translated) {
      return { ok: false, reason: "empty_response" }
    }

    const invariantIssues = deterministicInvariants(trimmed, translated)

    const shouldReview =
      spanishReviewEnabled() && (options?.sensitive || invariantIssues.length > 0)

    if (shouldReview) {
      const review = await openai.chat.completions.create({
        model: process.env.OPENAI_SPANISH_REVIEW_MODEL?.trim() || "gpt-4.1",
        messages: [
          { role: "system", content: BILINGUAL_REVIEW_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              english: trimmed,
              spanish: translated,
              deterministicIssues: invariantIssues,
            }),
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1400,
        temperature: 0,
      })
      const raw = review.choices?.[0]?.message?.content?.trim()
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            correctedSpanish?: string
            ok?: boolean
            issues?: string[]
          }
          if (parsed.correctedSpanish?.trim()) {
            translated = parsed.correctedSpanish.trim()
          }
        } catch {
          // Keep original translation if review JSON is invalid
        }
      }
    }

    return { ok: true, data: translated }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[pio-translate-ai] OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
