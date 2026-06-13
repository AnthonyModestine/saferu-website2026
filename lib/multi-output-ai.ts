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
        console.error("[multi-output-ai] Invalid ancillary JSON (attempt", attempt + 1, "):", raw.slice(0, 300))
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
  payload: AncillaryPayload
): Promise<AiResult<MultiOutputResult>> {
  const wantsVideo = payloadWantsVideoRequest(payload)
  const normalizedPayload: AncillaryPayload = {
    ...payload,
    requestFootage: wantsVideo,
  }

  const pressReleaseResult = await generatePressReleaseWithAI(normalizedPayload)
  if (!pressReleaseResult.ok) {
    return pressReleaseResult
  }

  const ancillaryResult = await generateAncillaryOutputs(
    normalizedPayload,
    pressReleaseResult.data
  )
  if (!ancillaryResult.ok) {
    console.error(
      "[multi-output-ai] Ancillary outputs failed:",
      ancillaryResult.reason,
      ancillaryResult.detail ?? ""
    )
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
      pressRelease: pressReleaseResult.data,
      facebook: ancillaryResult.ok ? ancillaryResult.data.facebook : "",
      twitter: ancillaryResult.ok ? ancillaryResult.data.twitter : "",
      talkingPoints: ancillaryResult.ok ? ancillaryResult.data.talkingPoints : "",
      communityRequest,
    },
  }
}
