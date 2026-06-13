/**
 * Generate press release body text using OpenAI from structured form data.
 */

import { INCIDENT_MIN, INCIDENT_MAX } from "./press-release-length"
import type { AiResult } from "./ai-result"
import { PRESS_RELEASE_SYSTEM_PROMPT } from "./pio-prompts"
import {
  buildCall1UserPayload,
  type PressReleasePayload,
} from "./pio-normalized-facts"

export type { PressReleasePayload } from "./pio-normalized-facts"

export async function generatePressReleaseWithAI(
  payload: PressReleasePayload
): Promise<AiResult<string>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    console.error("[press-release-ai] OPENAI_API_KEY is not set")
    return { ok: false, reason: "missing_api_key" }
  }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const releaseDateIso = payload.incidentDate || new Date().toISOString().slice(0, 10)
    const dateStr = payload.incidentDate
      ? new Date(
          payload.incidentDate +
            (payload.incidentTime ? `T${payload.incidentTime}` : "")
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })

    const userPayload = buildCall1UserPayload(payload, {
      releaseDateDisplay: dateStr,
      releaseDateIso,
      wordCountMin: INCIDENT_MIN,
      wordCountMax: INCIDENT_MAX,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PRESS_RELEASE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Draft a press release using only this normalized JSON object:\n\n${JSON.stringify(userPayload, null, 2)}`,
        },
      ],
      max_tokens: 3500,
      temperature: 0.1,
    })

    const text = completion.choices?.[0]?.message?.content?.trim()
    if (!text) {
      return { ok: false, reason: "empty_response" }
    }
    return { ok: true, data: text }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[press-release-ai] OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
