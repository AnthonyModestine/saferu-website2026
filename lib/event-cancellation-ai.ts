/**
 * Draft an event cancellation message for Facebook or X.
 */

import type { AiResult } from "./ai-result"
import { parseModelJson } from "./parse-model-json"

export type CancellationDraft = {
  postTitle: string
  message: string
  callToAction: string
  suggestedImage: string
  detailsToVerify: string[]
  channel: "Facebook" | "X"
}

export async function generateEventCancellationWithAI(input: {
  organizationName: string
  organizationType: string
  agencyRole: string
  hostOrganization?: string
  eventName: string
  eventDate: string
  startTime?: string
  endTime?: string
  locationName: string
  fullAddress?: string
  cancellationReason: string
  /** If set, this is a reschedule notice — keep talking about the new date */
  newEventDate?: string
  channel: "Facebook" | "X"
}): Promise<AiResult<CancellationDraft>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    console.error("[event-cancellation-ai] OPENAI_API_KEY is not set")
    return { ok: false, reason: "missing_api_key" }
  }

  const isX = input.channel === "X"
  const isReschedule = Boolean(input.newEventDate)
  const system = `You write clear public ${isReschedule ? "reschedule" : "cancellation"} notices for public safety agencies and community organizations.

Rules:
- Use only the facts provided. Do not invent weather outcomes, refunds, alternate dates, or new locations unless included in the reason or newEventDate.
- Be direct, calm, and community-focused. Do not sound alarmed.
${
  isReschedule
    ? `- Clearly state the original event date is no longer happening and share the NEW date.
- Do not say the event is permanently cancelled if a new date is provided.`
    : `- Clearly state the event is cancelled.`
}
- Include when and where it was planned if provided.
- Include the reason when provided, in plain language.
- Match the agency role: hosting owns the notice; promoting/participating may clarify they are sharing notice for the host organization.
- Do not mention AI.
- Return ONLY valid JSON with: postTitle, message, callToAction, suggestedImage, detailsToVerify (string array).`

  const channelRules = isX
    ? `TARGET CHANNEL: X (Twitter)
- message must be 280 characters or fewer.
- Punchy and clear. Minimal or empty callToAction.`
    : `TARGET CHANNEL: Facebook
- Short community post is fine (a paragraph or two).`

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `${channelRules}

Draft a ${isReschedule ? "reschedule" : "cancellation"} post using ONLY this JSON:

${JSON.stringify(
  {
    organizationName: input.organizationName,
    organizationType: input.organizationType,
    agencyRole: input.agencyRole,
    hostOrganization: input.hostOrganization || "",
    eventName: input.eventName,
    originalEventDate: input.eventDate,
    newEventDate: input.newEventDate || "",
    startTime: input.startTime || "",
    endTime: input.endTime || "",
    locationName: input.locationName,
    fullAddress: input.fullAddress || "",
    cancellationReason: input.cancellationReason,
  },
  null,
  2
)}`,
        },
      ],
      max_tokens: isX ? 600 : 1200,
      temperature: 0.35,
    })

    const text = completion.choices?.[0]?.message?.content?.trim()
    if (!text) return { ok: false, reason: "empty_response" }

    const parsed = parseModelJson<{
      postTitle?: string
      message?: string
      callToAction?: string
      suggestedImage?: string
      detailsToVerify?: unknown
    }>(text)
    if (!parsed || typeof parsed.message !== "string" || !parsed.message.trim()) {
      return { ok: false, reason: "invalid_json", detail: "Could not parse cancellation JSON" }
    }

    let message = parsed.message.trim()
    if (isX && message.length > 280) {
      message = message.slice(0, 277).trimEnd() + "…"
    }

    const details = Array.isArray(parsed.detailsToVerify)
      ? parsed.detailsToVerify.map((d) => String(d).trim()).filter(Boolean).slice(0, 12)
      : []

    return {
      ok: true,
      data: {
        channel: input.channel,
        postTitle: String(
          parsed.postTitle || (isReschedule ? "Event Rescheduled" : "Event Cancelled")
        )
          .trim()
          .slice(0, 160),
        message: message.slice(0, isX ? 280 : 4500),
        callToAction: String(parsed.callToAction || "")
          .trim()
          .slice(0, isX ? 80 : 400),
        suggestedImage: String(parsed.suggestedImage || "").trim().slice(0, 400),
        detailsToVerify: details,
      },
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[event-cancellation-ai] OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
