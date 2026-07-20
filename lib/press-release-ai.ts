/**
 * Generate press release body text using OpenAI from structured form data.
 */

import { INCIDENT_MIN, INCIDENT_MAX } from "./press-release-length"
import type { AiResult } from "./ai-result"
import { PRESS_RELEASE_DRAFT_PROMPT } from "./pio-prompts"
import {
  buildCall1UserPayload,
  type PressReleasePayload,
} from "./pio-normalized-facts"
import {
  PRESS_RELEASE_DRAFT_RESPONSE_FORMAT,
  pressReleaseDraftSchema,
  type PressReleaseDraft,
} from "./pio-structured-schemas"
import { runPioStructuredCall } from "./pio-structured-call"

export type { PressReleasePayload } from "./pio-normalized-facts"

export async function generateStructuredPressReleaseDraft(
  payload: PressReleasePayload
): Promise<AiResult<PressReleaseDraft>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    console.error("[press-release-ai] OPENAI_API_KEY is not set")
    return { ok: false, reason: "missing_api_key" }
  }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const suppliedReleaseDate = payload.releaseDate || ""
    const parsedReleaseDate = new Date(`${suppliedReleaseDate}T12:00:00Z`)
    const hasValidReleaseDate =
      /^\d{4}-\d{2}-\d{2}$/.test(suppliedReleaseDate) &&
      !Number.isNaN(parsedReleaseDate.getTime()) &&
      parsedReleaseDate.toISOString().slice(0, 10) === suppliedReleaseDate
    const releaseDateIso = hasValidReleaseDate
      ? suppliedReleaseDate
      : new Date().toISOString().slice(0, 10)
    const dateStr = new Date(`${releaseDateIso}T12:00:00`).toLocaleDateString("en-US", {
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

    return runPioStructuredCall(
      openai,
      PRESS_RELEASE_DRAFT_PROMPT,
      userPayload,
      PRESS_RELEASE_DRAFT_RESPONSE_FORMAT,
      pressReleaseDraftSchema,
      4000,
      0.1
    )
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[press-release-ai] OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

/** Deterministic draft renderer retained for internal compatibility. Public routes use the final gate. */
export function renderStructuredPressRelease(draft: {
  headline: string
  dateline: { city: string; state: string; releaseDate: string }
  bodyParagraphs: string[]
  boilerplate: string
  mediaContact: {
    name: string
    agency: string
    phone: string
    secondaryPhone: string
    email: string
  }
}): string {
  const lines: string[] = []
  if (draft.headline.trim()) lines.push(draft.headline.trim())
  const { city, state, releaseDate } = draft.dateline
  if (city.trim() && state.trim() && releaseDate.trim()) {
    lines.push(`${city.trim().toUpperCase()}, ${state.trim().toUpperCase()} – ${releaseDate.trim()} – For Immediate Release`)
  }
  lines.push(...draft.bodyParagraphs.map((p) => p.trim()).filter(Boolean))
  if (draft.boilerplate.trim()) lines.push(draft.boilerplate.trim())
  const contact = draft.mediaContact
  const contactLines = [
    "Media Contact:",
    contact.name,
    contact.agency,
    contact.phone,
    contact.secondaryPhone,
    contact.email,
  ].map((line) => line.trim()).filter(Boolean)
  if (contactLines.length > 1) lines.push(contactLines.join("\n"))
  return lines.join("\n\n")
}

/** @deprecated Public generation must use generateMultiOutput so the quality gate always runs. */
export async function generatePressReleaseWithAI(
  payload: PressReleasePayload
): Promise<AiResult<string>> {
  const result = await generateStructuredPressReleaseDraft(payload)
  if (!result.ok) return result
  if (result.data.status === "needs_human_review") {
    return { ok: false, reason: "invalid_json", detail: result.data.humanReviewReason }
  }
  return { ok: true, data: renderStructuredPressRelease(result.data) }
}
