/**
 * AI helpers for Post Generator — message customization when curated copy exists.
 */

import type { AiResult } from "@/lib/ai-result"
import type { CustomizeMessageMode, RankedExternalOpportunity } from "@/lib/post-generator/types"
import { buildPostMessageInputFromOpportunity, generatePostMessage } from "@/lib/post-generator/post-message"
import type { WriterFact } from "@/lib/post-generator/pio-writer-types"
import {
  agencyRoleBrief,
  agencyTypeLabel as formatAgencyTypeLabel,
} from "@/lib/post-generator/agency-relevance"
import {
  CAPTION_BANNED_PHRASES,
  agencyNamingBrief,
  captionVoiceBrief,
  hasRealAgencyName,
  resolveAgencyDisplayName,
} from "@/lib/post-generator/caption-voice"
import { holidayValidationBrief } from "@/lib/post-generator/holiday-validation"

function pioSocialVoiceRules(agency: string, place: string, agencyTypeLabel?: string): string {
  const display = resolveAgencyDisplayName(agency)
  const named = hasRealAgencyName(agency)
  const roleLine = agencyTypeLabel
    ? `You represent a ${agencyTypeLabel} agency writing as the PIO / social media coordinator for ${display}.`
    : `You are the social media coordinator or public information officer (PIO) for ${display}.`

  const bannedNote = CAPTION_BANNED_PHRASES.map((p) => `"${p}"`).join(", ")
  const agencyExamples = named
    ? `"${display} is advising…", "We're sharing this National Weather Service alert…"`
    : `"The National Weather Service has issued…", "The Health Department reports…"`
  const contactExample = named
    ? `and contact ${display} with concerns`
    : `and contact officials with concerns`

  return `${roleLine} You are talking directly to the community in ${place} — neighbors, families, and residents who follow this agency's page. This is an OFFICIAL government / public safety page, so every word must sound credible and professional.

${agencyNamingBrief(named ? agency.trim() : "")}

Write like a real public safety PIO posting on Facebook:
- Speak as "we" from the agency to "you" in the community (first-person plural from the agency).
- ATTRIBUTE THE SOURCE of any alert or official information. Name who issued it (e.g., "The National Weather Service has issued…", ${agencyExamples}, "According to the county Office of Emergency Management…", "The Health Department reports…"). Never present an alert as if it came from nowhere.
- If a DIFFERENT authority issued the alert, credit that authority and have ${display} relay it. Only speak as the source when ${display} is actually the one issuing it.
- Sound official and trustworthy: calm, clear, authoritative, and helpful. No hype, clickbait, slang, or exclamation-point spam. Lead with the key facts (what/where/when/who issued it).
- ALWAYS answer: why is THIS agency posting about this? Residents should understand the public-safety or community reason — not just hear a news headline restated.
- Example: if meters are being replaced, a police agency should say residents may see workers in yards / lots of activity, verify who is at the door, ${contactExample} — not only "meters are being replaced."
- Talk about what people will notice, what it means for them, and the one useful next step when natural.
- Sound human, local, and calm. Not corporate. Not a PSA brochure.
- Do NOT default to a tip list. One practical line is enough when it fits.
- Prefer community conversation: awareness, shared context, reassurance, or a heads-up — not a lecture.
- Tailor the framing to this agency's role (police, fire, EMS, emergency management, municipal, etc.).
- Use plain language. Avoid filler and banned phrases: ${bannedNote}.
- Keep paragraphs short for mobile scanning.
- JURISDICTION: If the update is in a neighboring town or another agency's project, frame it as a traveler/regional heads-up for YOUR residents. Never write as if ${display} owns that work. Never say "thank you for your understanding," "our crews," or "we apologize for the inconvenience" about another jurisdiction's project.
- Do NOT promote community events unless verified facts show this agency is hosting or participating.
- Use 0-2 emojis only when they help scanning. No hashtags unless essential.
- Never invent incidents, statistics, road closures, times, locations, or emergencies.
- Use only the verified facts provided.
- Do not mention AI or that the message was generated.
- Return ONLY the post text — no quotes, labels, or commentary.

${captionVoiceBrief(agency, place)}`
}

export async function customizeCuratedMessage(
  originalMessage: string,
  mode: CustomizeMessageMode,
  agencyName?: string,
  location?: { city?: string; state?: string },
  opts?: {
    agencyType?: string
    verifiedFacts?: WriterFact[]
    voiceProfile?: string
  }
): Promise<AiResult<string>> {
  const trimmed = originalMessage.trim()
  if (!trimmed) return { ok: false, reason: "empty_input" }

  const place =
    [location?.city, location?.state].filter(Boolean).join(", ") || "the community"
  const verifiedFacts =
    opts?.verifiedFacts?.length
      ? opts.verifiedFacts
      : [{ id: "fact-1", text: trimmed }]

  const result = await customizePioFacebookPost({
    originalMessage: trimmed,
    mode,
    agencyName: agencyName || "",
    agencyType: opts?.agencyType || "public safety",
    serviceArea: place,
    voiceProfile: opts?.voiceProfile,
    verifiedFacts,
  })
  if (!result.ok) return result
  if (result.data.status !== "ready" || !result.data.postText.trim()) {
    return {
      ok: false,
      reason: "empty_response",
      detail: result.data.humanReviewReason || undefined,
    }
  }
  return { ok: true, data: result.data.postText }
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
  const agency = resolveAgencyDisplayName(agencyName)
  const agencyForRules = hasRealAgencyName(agencyName) ? agencyName!.trim() : ""

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
          content: `${pioSocialVoiceRules(agencyForRules || agency, place)}

${holidayValidationBrief()}

For holiday posts: open with a warm seasonal greeting tied to the specific named holiday, then add one brief practical safety reminder when appropriate (sober driving, fireworks safety, winter driving). Keep it genuine — not cheesy. Never use vague holiday language.`,
        },
        {
          role: "user",
          content: `Write a ready-to-post Facebook message for each holiday for residents in ${place}${
            hasRealAgencyName(agencyName) ? ` from ${agency}` : ""
          }.

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
  const opportunity: RankedExternalOpportunity = {
    id: "generate-post",
    title,
    summary: summary || whyItMatters,
    category: sourceLabel?.trim() || "informational",
    sourceLabel: (sourceLabel as RankedExternalOpportunity["sourceLabel"]) || "Current Local Opportunity",
    whyItMatters,
    recommendedAction,
    recommendedPostTiming: "today",
    priority: "recommended_today",
    signals: [],
    verifiedFacts,
    publicCallToAction,
    doNotClaim,
    whyThisAgency: messagingAngle,
    jurisdictionFit,
    internalScores: {
      agencyRelevance: 4,
      geographicRelevance: 4,
      residentValue: 4,
      actionability: 4,
      urgency: 3,
      sourceTrust: 4,
      seasonalRelevance: 3,
      engagementPotential: 3,
      freshness: 4,
      composite: 4,
      pioRating: 4,
      messagingAngle,
    },
  }

  const context = {
    agencyName: agencyName || "",
    agencyType: formatAgencyTypeLabel(agencyType, agencyTypeOther),
    agencyRoleProfile: agencyRoleBrief(agencyType),
    agencyVoiceProfile: "",
    city: city || "",
    county: "",
    state: state || "",
  }

  const input = buildPostMessageInputFromOpportunity(opportunity, context)
  const draft = await generatePostMessage(input, {
    city: context.city,
    county: context.county,
    state: context.state,
  })
  if (!draft.ok) return draft
  if (draft.data.status !== "ready" || !draft.data.postText.trim()) {
    return {
      ok: false,
      reason: "empty_response",
      detail: draft.data.humanReviewReason || undefined,
    }
  }

  return { ok: true, data: draft.data.postText.trim() }
}
