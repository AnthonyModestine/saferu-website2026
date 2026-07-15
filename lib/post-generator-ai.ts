/**
 * AI helpers for Post Generator — message customization when curated copy exists.
 */

import type { AiResult } from "@/lib/ai-result"
import type { CustomizeMessageMode } from "@/lib/post-generator/types"
import { agencyTypeLabel as formatAgencyTypeLabel } from "@/lib/post-generator/agency-relevance"

const MODE_INSTRUCTIONS: Record<CustomizeMessageMode, string> = {
  shorten: "Shorten to about 60% of the length while keeping all essential safety facts.",
  conversational:
    "Make slightly more conversational and approachable — like a PIO talking with neighbors — while staying professional.",
  formal: "Make more formal and official in tone, as a department spokesperson would.",
  facebook:
    "Optimize for Facebook: clear short paragraphs, friendly professional PIO tone, suitable length for a community page.",
  instagram: "Optimize for Instagram: strong opening line, short line breaks, still sound like a PIO.",
  twitter: "Optimize for X (Twitter): under 280 characters, direct and scannable.",
  add_emojis: "Add a few relevant emojis sparingly (1-3) where appropriate for social media.",
  remove_emojis: "Remove all emojis and keep plain professional text.",
}

function pioSocialVoiceRules(agency: string, place: string, agencyTypeLabel?: string): string {
  const roleLine = agencyTypeLabel
    ? `You represent a ${agencyTypeLabel} agency writing as the PIO / social media coordinator for ${agency}.`
    : `You are the social media coordinator or public information officer (PIO) for ${agency}.`

  return `${roleLine} Write posts that inform and update residents in ${place}.

Write the way a real PIO would on the department's Facebook page:
- Lead with what residents need to know right now (alert, update, heads-up, save the date).
- Sound human, professional, and local — helpful and calm, never robotic or corporate.
- Tailor the framing to this agency's role (police, fire, EMS, emergency management, municipal, etc.) using the agency angle when provided.
- Use plain language. Avoid filler ("we are writing to inform you", "please be advised", buzzwords).
- Keep paragraphs short so the post is easy to scan on a phone.
- For alerts: state what is happening, who is affected, and what people should do — without causing panic.
- For events and community news: welcome residents, share confirmed details, and invite participation when appropriate.
- End with a clear next step when one exists (stay tuned, check official sources, plan ahead, save the date).
- Use 0-2 relevant emojis only when they help scanning (weather, events). Do not decorate every sentence.
- Do not use hashtags unless they are essential.
- Never invent incidents, statistics, road closures, times, locations, or emergencies.
- Use only the verified facts provided. If something is not confirmed, do not imply it is.
- Do not mention AI or that the message was generated.
- Return ONLY the post text — no quotes, labels, or commentary.`
}

export async function customizeCuratedMessage(
  originalMessage: string,
  mode: CustomizeMessageMode,
  agencyName?: string
): Promise<AiResult<string>> {
  const trimmed = originalMessage.trim()
  if (!trimmed) return { ok: false, reason: "empty_input" }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const instruction = MODE_INSTRUCTIONS[mode]
  const agency = agencyName?.trim() || "the public safety agency"

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${pioSocialVoiceRules(agency, "the community")}

You are editing an existing post. Preserve every verified fact and safety guidance from the original.`,
        },
        {
          role: "user",
          content: `${instruction}\n\nOriginal message:\n${trimmed}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.4,
    })
    const result = completion.choices?.[0]?.message?.content?.trim()
    if (!result) return { ok: false, reason: "empty_response" }
    return { ok: true, data: result }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[post-generator-ai] customize error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

export type HolidayMessageInput = {
  id: string
  label: string
  slogan: string
}

export async function generateHolidayMessagesBatch(
  holidays: HolidayMessageInput[],
  agencyName?: string,
  city?: string,
  state?: string
): Promise<AiResult<Record<string, string>>> {
  if (!holidays.length) return { ok: true, data: {} }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const place = [city, state].filter(Boolean).join(", ") || "the community"
  const agency = agencyName?.trim() || "our department"

  const holidayList = holidays
    .map((h) => `- id: "${h.id}" | holiday: ${h.label} | greeting: ${h.slogan}`)
    .join("\n")

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${pioSocialVoiceRules(agency, place)}

For holiday posts: open with a warm seasonal greeting, then add one brief practical safety reminder when appropriate (sober driving, fireworks safety, winter driving). Keep it genuine — not cheesy.`,
        },
        {
          role: "user",
          content: `Write a ready-to-post Facebook message for each holiday for residents in ${place}.

Holidays:
${holidayList}`,
        },
      ],
      max_tokens: 4000,
      temperature: 0.5,
      response_format: { type: "json_object" },
    })

    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) return { ok: false, reason: "empty_response" }

    let parsed: { messages?: Record<string, string> }
    try {
      parsed = JSON.parse(raw) as { messages?: Record<string, string> }
    } catch {
      return { ok: false, reason: "invalid_json" }
    }

    const messages: Record<string, string> = {}
    for (const holiday of holidays) {
      const text = parsed.messages?.[holiday.id]?.trim()
      if (text) messages[holiday.id] = text
    }

    if (!Object.keys(messages).length) return { ok: false, reason: "empty_response" }
    return { ok: true, data: messages }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[post-generator-ai] holiday batch error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

export async function generateMessageFromOpportunity(
  title: string,
  whyItMatters: string,
  verifiedFacts: string[],
  doNotClaim: string[],
  publicCallToAction: string[],
  recommendedAction: string,
  agencyName?: string,
  city?: string,
  state?: string,
  summary?: string,
  sourceLabel?: string,
  agencyType?: string,
  agencyTypeOther?: string,
  messagingAngle?: string
): Promise<AiResult<string>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const place = [city, state].filter(Boolean).join(", ") || "the community"
  const agency = agencyName?.trim() || "our department"
  const postType = sourceLabel?.trim() || "community update"
  const agencyTypeLabel = formatAgencyTypeLabel(agencyType, agencyTypeOther)

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: pioSocialVoiceRules(agency, place, agencyTypeLabel),
        },
        {
          role: "user",
          content: `Write a ready-to-publish Facebook post for ${place}.

Agency type: ${agencyTypeLabel}
Post type: ${postType}
Topic: ${title}
${summary ? `Summary: ${summary}` : ""}
Why residents should care: ${whyItMatters}
${messagingAngle ? `Agency-specific messaging angle: ${messagingAngle}` : ""}
Verified facts (use only these): ${verifiedFacts.join("; ") || "General prevention guidance only — do not imply a specific local incident."}
What the PIO should encourage: ${recommendedAction || "Give residents clear, practical guidance they can act on."}
Suggested calls to action: ${publicCallToAction.join("; ") || "Share practical next steps based on the verified facts."}
Do NOT claim or imply: ${doNotClaim.join("; ") || "Anything beyond the verified facts above."}

Write as ${agency} (${agencyTypeLabel}) informing the community. 2-4 short paragraphs.`,
        },
      ],
      max_tokens: 600,
      temperature: 0.45,
    })
    const result = completion.choices?.[0]?.message?.content?.trim()
    if (!result) return { ok: false, reason: "empty_response" }
    return { ok: true, data: result }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    return { ok: false, reason: "openai_error", detail }
  }
}
