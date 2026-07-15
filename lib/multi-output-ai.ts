/**
 * Multi-output AI generation: press release, Facebook, X, talking points, video request.
 */

import type { PressReleasePayload } from "./press-release-ai"
import { generatePressReleaseWithAI } from "./press-release-ai"
import { generateCommunityRequestWithAI } from "./community-request-ai"
import type { AiResult } from "./ai-result"
import {
  buildCall2UserPayload,
  buildCall3UserPayloadFromPressRelease,
  formatTalkingPointsForDisplay,
} from "./pio-normalized-facts"
import { ANCILLARY_SYSTEM_PROMPT } from "./pio-prompts"
import { ANCILLARY_OUTPUTS_JSON_SCHEMA } from "./pio-structured-schemas"

export interface MultiOutputResult {
  pressRelease: string
  facebook: string
  twitter: string
  talkingPoints: string
  communityRequest: string | null
}

/** Which outputs the user asked to generate. */
export type MultiOutputSelection = {
  pressRelease: boolean
  facebook: boolean
  twitter: boolean
  talkingPoints: boolean
  videoRequest: boolean
}

/** Default for the create UI: press release only until the user opts in. */
export const DEFAULT_MULTI_OUTPUT_SELECTION: MultiOutputSelection = {
  pressRelease: true,
  facebook: false,
  twitter: false,
  talkingPoints: false,
  videoRequest: false,
}

export function parseMultiOutputSelection(raw: unknown): MultiOutputSelection | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  return {
    pressRelease: Boolean(o.pressRelease),
    facebook: Boolean(o.facebook),
    twitter: Boolean(o.twitter),
    talkingPoints: Boolean(o.talkingPoints),
    videoRequest: Boolean(o.videoRequest),
  }
}

export function selectionHasAny(sel: MultiOutputSelection): boolean {
  return (
    sel.pressRelease ||
    sel.facebook ||
    sel.twitter ||
    sel.talkingPoints ||
    sel.videoRequest
  )
}

export type AncillaryPayload = PressReleasePayload

async function generateAncillaryOutputs(
  payload: AncillaryPayload,
  pressRelease: string
): Promise<AiResult<Pick<MultiOutputResult, "facebook" | "twitter" | "talkingPoints">>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" }
  }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const userPayload = buildCall2UserPayload(payload, pressRelease)

    let lastError: string | undefined

    for (let attempt = 0; attempt < 2; attempt++) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: ANCILLARY_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate supplementary outputs from this data:\n\n${JSON.stringify(userPayload, null, 2)}`,
          },
        ],
        max_tokens: 2000,
        temperature: attempt === 0 ? 0.15 : 0.1,
        response_format: ANCILLARY_OUTPUTS_JSON_SCHEMA,
      })

      const finishReason = completion.choices?.[0]?.finish_reason
      const raw = completion.choices?.[0]?.message?.content?.trim()
      if (!raw) {
        lastError = "empty_response"
        continue
      }

      if (finishReason === "length") {
        console.error("[multi-output-ai] Ancillary response truncated (attempt", attempt + 1, ")")
        lastError = "truncated"
        continue
      }

      try {
        const parsed = JSON.parse(raw) as {
          facebook?: string
          x?: string
          talkingPoints?: string[]
        }
        return {
          ok: true,
          data: {
            facebook: parsed.facebook || "",
            twitter: parsed.x || "",
            talkingPoints: formatTalkingPointsForDisplay(parsed.talkingPoints || []),
          },
        }
      } catch {
        console.error(
          "[multi-output-ai] Invalid ancillary JSON (attempt",
          attempt + 1,
          "):",
          raw.slice(0, 300)
        )
        lastError = "invalid_json"
      }
    }

    if (lastError === "empty_response") return { ok: false, reason: "empty_response" }
    return { ok: false, reason: "invalid_json", detail: lastError }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[multi-output-ai] Ancillary OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

export function payloadWantsVideoRequest(payload: AncillaryPayload): boolean {
  return Boolean(
    payload.requestFootage ||
      payload.footageTimeframe?.trim() ||
      payload.whatToLookFor?.trim()
  )
}

export async function generateMultiOutput(
  payload: AncillaryPayload,
  selection: MultiOutputSelection = {
    pressRelease: true,
    facebook: true,
    twitter: true,
    talkingPoints: true,
    videoRequest: true,
  }
): Promise<AiResult<MultiOutputResult>> {
  if (!selectionHasAny(selection)) {
    return {
      ok: false,
      reason: "invalid_json",
      detail: "Select at least one output to generate.",
    }
  }

  const needsPress =
    selection.pressRelease ||
    selection.facebook ||
    selection.twitter ||
    selection.talkingPoints
  const wantsVideo = selection.videoRequest
  const normalizedPayload: AncillaryPayload = {
    ...payload,
    requestFootage: wantsVideo ? true : Boolean(payload.requestFootage),
  }

  let pressRelease = ""
  if (needsPress) {
    const pressReleaseResult = await generatePressReleaseWithAI(normalizedPayload)
    if (!pressReleaseResult.ok) {
      return pressReleaseResult
    }
    pressRelease = pressReleaseResult.data
  }

  let facebook = ""
  let twitter = ""
  let talkingPoints = ""
  if (selection.facebook || selection.twitter || selection.talkingPoints) {
    const ancillaryResult = await generateAncillaryOutputs(normalizedPayload, pressRelease)
    if (!ancillaryResult.ok) {
      console.error(
        "[multi-output-ai] Ancillary outputs failed:",
        ancillaryResult.reason,
        ancillaryResult.detail ?? ""
      )
    } else {
      if (selection.facebook) facebook = ancillaryResult.data.facebook
      if (selection.twitter) twitter = ancillaryResult.data.twitter
      if (selection.talkingPoints) talkingPoints = ancillaryResult.data.talkingPoints
    }
  }

  let communityRequest: string | null = null
  if (wantsVideo) {
    const videoResult = await generateCommunityRequestWithAI(
      buildCall3UserPayloadFromPressRelease(normalizedPayload)
    )
    if (videoResult.ok) {
      communityRequest = videoResult.data
    } else {
      console.error(
        "[multi-output-ai] Video request generation failed:",
        videoResult.reason,
        videoResult.detail ?? ""
      )
    }
  }

  return {
    ok: true,
    data: {
      pressRelease: selection.pressRelease ? pressRelease : "",
      facebook,
      twitter,
      talkingPoints,
      communityRequest,
    },
  }
}
