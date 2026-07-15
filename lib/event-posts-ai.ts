/**
 * Generate SaferU event campaign messages using timing-aware prompts.
 */

import type { AiResult } from "./ai-result"
import { parseModelJson } from "./parse-model-json"
import {
  buildBatchUserPrompt,
  buildEventCampaignPlan,
  eventCampaignSystemPrompt,
  type EventCampaignKey,
  type EventSharedFacts,
} from "./event-message-prompts"

export type GeneratedEventPost = {
  key: EventCampaignKey
  postDate: string
  postTime: string
  timingLabel: string
  channel: "Facebook" | "X" | "Nextdoor" | "Email" | "Website"
  postTitle: string
  message: string
  callToAction: string
  suggestedImage: string
  detailsToVerify: string[]
  tag?: string
}

type ModelPost = {
  key?: string
  postTitle?: string
  message?: string
  callToAction?: string
  suggestedImage?: string
  detailsToVerify?: unknown
  tag?: string
  channel?: string
}

const ALL_KEYS: EventCampaignKey[] = [
  "initial_announcement",
  "event_highlight",
  "one_week_reminder",
  "what_to_expect",
  "day_before",
  "event_day",
  "optional_final",
  "thank_you",
]

function normalizeKeys(keys?: string[]): EventCampaignKey[] | undefined {
  if (!keys || keys.length === 0) return undefined
  const allowed = new Set(ALL_KEYS)
  const filtered = keys
    .map((k) => String(k).trim())
    .filter((k): k is EventCampaignKey => allowed.has(k as EventCampaignKey))
  return filtered.length > 0 ? filtered : undefined
}

export async function generateEventPostsWithAI(
  facts: EventSharedFacts & { today: string; keys?: string[]; channel?: string }
): Promise<AiResult<GeneratedEventPost[]>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    console.error("[event-posts-ai] OPENAI_API_KEY is not set")
    return { ok: false, reason: "missing_api_key" }
  }

  const onlyKeys = normalizeKeys(facts.keys)
  const slots = buildEventCampaignPlan(facts, facts.today, {
    // When requesting specific keys (detail page Generate Message), include past slots
    includePast: Boolean(onlyKeys),
    onlyKeys,
  })
  if (slots.length === 0) {
    return {
      ok: false,
      reason: "empty_input",
      detail: "No remaining campaign slots for this event date.",
    }
  }

  const targetChannel = normalizeChannel(facts.channel)
  const isX = targetChannel === "X"

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: eventCampaignSystemPrompt() },
        {
          role: "user",
          content: buildBatchUserPrompt(facts, slots, { channel: targetChannel }),
        },
      ],
      max_tokens: isX ? 2000 : 4500,
      temperature: 0.35,
    })

    const text = completion.choices?.[0]?.message?.content?.trim()
    if (!text) {
      return { ok: false, reason: "empty_response" }
    }

    const parsed = parseModelJson<{ posts?: ModelPost[] }>(text)
    if (!parsed) {
      return { ok: false, reason: "invalid_json", detail: "Could not parse model JSON" }
    }

    const byKey = new Map<string, ModelPost>()
    for (const p of Array.isArray(parsed.posts) ? parsed.posts : []) {
      if (p?.key) byKey.set(String(p.key), p)
    }

    const cleaned: GeneratedEventPost[] = []
    for (const slot of slots) {
      const p = byKey.get(slot.key) ?? (parsed.posts || []).find((_, i) => slots[i]?.key === slot.key)
      if (!p || typeof p.message !== "string" || !p.message.trim()) continue

      const details = Array.isArray(p.detailsToVerify)
        ? p.detailsToVerify.map((d) => String(d).trim()).filter(Boolean).slice(0, 12)
        : []

      let message = p.message.trim()
      if (isX && message.length > 280) {
        message = message.slice(0, 277).trimEnd() + "…"
      }

      cleaned.push({
        key: slot.key,
        postDate: slot.recommendedPostDate,
        postTime: slot.recommendedPostTime,
        timingLabel: slot.timingLabel,
        channel: targetChannel,
        postTitle: String(p.postTitle ?? slot.timingLabel).trim().slice(0, 160),
        message: message.slice(0, isX ? 280 : 4500),
        callToAction: String(p.callToAction ?? "")
          .trim()
          .slice(0, isX ? 80 : 400),
        suggestedImage: String(p.suggestedImage ?? "").trim().slice(0, 400),
        detailsToVerify: details,
        tag: typeof p.tag === "string" ? p.tag.trim().slice(0, 80) : facts.eventName.slice(0, 80),
      })
    }

    if (cleaned.length === 0) {
      return { ok: false, reason: "empty_response" }
    }

    return { ok: true, data: cleaned }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[event-posts-ai] OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

function normalizeChannel(value: unknown): GeneratedEventPost["channel"] {
  const v = String(value ?? "Facebook").trim().toLowerCase()
  if (v === "x" || v === "twitter" || v === "x/twitter") return "X"
  if (v === "nextdoor") return "Nextdoor"
  if (v === "email") return "Email"
  if (v === "website") return "Website"
  return "Facebook"
}
