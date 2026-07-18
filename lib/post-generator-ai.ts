/**
 * AI helpers for Post Generator — message customization when curated copy exists.
 */

import type { AiResult } from "@/lib/ai-result"
import type { CustomizeMessageMode } from "@/lib/post-generator/types"
import {
  agencyRoleBrief,
  agencyTypeLabel as formatAgencyTypeLabel,
  defaultAgencyMessagingAngle,
} from "@/lib/post-generator/agency-relevance"

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

  return `${roleLine} You are talking directly to your community in ${place} — neighbors, families, and residents who follow the department page. This is an OFFICIAL government / public safety page, so every word must sound credible and professional.

Write like a real public safety agency posting on Facebook:
- Speak as "we" from the department to "you" in the community.
- ATTRIBUTE THE SOURCE of any alert or official information. Name who issued it (e.g., "The National Weather Service has issued…", "${agency} is advising…", "According to the county Office of Emergency Management…", "The Health Department reports…"). Never present an alert as if it came from nowhere.
- If a DIFFERENT authority issued the alert, credit that authority and have ${agency} relay it ("We're sharing this alert from…"). Only speak as the source when ${agency} is actually the one issuing it.
- Sound official and trustworthy: calm, clear, and professional. No hype, clickbait, slang, or exclamation-point spam. Lead with the key facts (what/where/when/who issued it).
- ALWAYS answer: why is THIS agency posting about this? Residents should understand the public-safety or community reason — not just hear a news headline restated.
- Example: if meters are being replaced, a police department should say residents may see workers in yards / lots of activity, verify who is at the door, and call the department with concerns — not only "meters are being replaced."
- Talk about what people will notice, what it means for them, and the one useful next step when natural.
- Sound human, local, and calm. Not corporate. Not a PSA brochure.
- Do NOT default to a tip list. One practical line is enough when it fits.
- Prefer community conversation: awareness, shared context, reassurance, or a heads-up — not a lecture.
- Tailor the framing to this agency's role (police, fire, EMS, emergency management, municipal, etc.).
- Use plain language. Avoid filler ("we are writing to inform you", "please be advised", "as a reminder", "stay safe out there" as empty closers).
- Keep paragraphs short for mobile scanning.
- JURISDICTION: If the update is in a neighboring town or another agency's project, frame it as a traveler/regional heads-up for YOUR residents. Never write as if ${agency} owns that work. Never say "thank you for your understanding," "our crews," or "we apologize for the inconvenience" about another jurisdiction's project.
- Do NOT promote community events unless verified facts show this agency is hosting or participating.
- Use 0-2 emojis only when they help scanning. No hashtags unless essential.
- Never invent incidents, statistics, road closures, times, locations, or emergencies.
- Use only the verified facts provided.
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
  messagingAngle?: string,
  jurisdictionFit?: "own" | "nearby" | "regional" | "unknown"
): Promise<AiResult<string>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const place = [city, state].filter(Boolean).join(", ") || "the community"
  const agency = agencyName?.trim() || "our department"
  const postType = sourceLabel?.trim() || "community update"
  const agencyTypeLabel = formatAgencyTypeLabel(agencyType, agencyTypeOther)
  const resolvedAngle =
    messagingAngle?.trim() || defaultAgencyMessagingAngle(agencyType)
  const roleBrief = agencyRoleBrief(agencyType)
  const fit = jurisdictionFit || "unknown"
  const jurisdictionLine =
    fit === "nearby"
      ? `Jurisdiction: NEIGHBORING area near ${place}. Write a heads-up for ${agency}'s residents who may travel through — do NOT claim ${agency} owns or is managing this.`
      : fit === "regional"
        ? `Jurisdiction: REGIONAL update. Awareness only for ${agency}'s community.`
        : fit === "own"
          ? `Jurisdiction: appears to be in ${agency}'s home community (${place}).`
          : `Jurisdiction: unclear — stay neutral; do not claim ownership.`

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
          content: `Write a ready-to-publish Facebook post from ${agency} to residents in ${place}.

Agency name: ${agency}
Agency type: ${agencyTypeLabel}
Why this type of agency posts: ${roleBrief}
Service area: ${place}
${jurisdictionLine}
Post type: ${postType}
Topic: ${title}
${summary ? `Summary: ${summary}` : ""}
Community context: ${whyItMatters}
Agency-specific angle (REQUIRED — weave this in so the post is clearly from this agency's perspective): ${resolvedAngle}
Verified facts (use only these): ${verifiedFacts.join("; ") || "Do not invent a local incident."}
Attribution (REQUIRED): Name who issued this alert/information near the top. If the source is "${postType}" or another authority (e.g., National Weather Service, county Emergency Management, Health Department), credit them and have ${agency} relay it. Only speak as the issuing authority if ${agency} is actually the source.
Optional guidance (use lightly if it fits — do not turn the post into a tip list): ${recommendedAction || "none"}
Optional calls to action (at most one short line if natural): ${publicCallToAction.slice(0, 1).join("; ") || "none"}
Do NOT claim or imply: ${doNotClaim.join("; ") || "Anything beyond the verified facts above."}

CRITICAL: Do not just restate the news. Explain why ${agency} (${agencyTypeLabel}) is sharing this and what residents should know from that agency's role — e.g. unexpected activity, how to verify workers, who to call with concerns, what responders are watching for.
Goal: public safety talking to its community about this update — not a tip sheet, not an event flyer, and not a bare utility announcement.
2-3 short paragraphs.`,
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
