import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { parseModelJson } from "@/lib/parse-model-json"
import { agencyRoleBrief, agencyTypeLabel } from "./agency-relevance"
import type { RankedExternalOpportunity } from "./types"

type ValidatedItem = {
  id?: string
  approve?: boolean
  title?: string
  summary?: string
  whyItMatters?: string
  surfacedReason?: string
  recommendedAction?: string
  recommendedPostTiming?: string
  caption?: string
  rejectionReason?: string
}

/**
 * Final editorial override. Every displayed recommendation must be approved and
 * rewritten by OpenAI after deterministic 4–5 star scoring.
 */
export async function validateRecommendationsAsPio(opts: {
  opportunities: RankedExternalOpportunity[]
  agencyName?: string
  agencyType?: string
  agencyTypeOther?: string
  city?: string
  state: string
}): Promise<AiResult<RankedExternalOpportunity[]>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }
  if (!opts.opportunities.length) return { ok: true, data: [] }

  const agency = opts.agencyName?.trim() || "this agency"
  const typeLabel = agencyTypeLabel(opts.agencyType, opts.agencyTypeOther)
  const place = [opts.city, opts.state].filter(Boolean).join(", ") || opts.state
  const role = agencyRoleBrief(opts.agencyType)

  const payload = opts.opportunities.slice(0, 8).map((opp) => ({
    id: opp.id,
    title: opp.title,
    summary: opp.summary,
    category: opp.category,
    sourceName: opp.sourceName,
    sourceUrl: opp.sourceUrl,
    verifiedFacts: opp.verifiedFacts ?? [],
    whyItMatters: opp.whyItMatters,
    recommendedAction: opp.recommendedAction,
    publicCallToAction: opp.publicCallToAction ?? [],
    signals: opp.signals,
    jurisdictionFit: opp.jurisdictionFit,
    internalRating: opp.internalScores.pioRating,
    agencyFitReason: opp.internalScores.agencyFitReason,
    messagingAngle: opp.internalScores.messagingAngle,
  }))

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are the final editorial gate for an experienced Public Information Officer.

Agency: ${agency}
Agency type: ${typeLabel}
Service area: ${place}
Agency role: ${role}

The deterministic scoring engine already removed anything below 4 stars. You now have override authority:
approve an item ONLY if posting it today would genuinely help this agency's community.

For every approved item, all four questions must have specific answers:
1. Why now?
2. Why this agency?
3. Why this community?
4. Why should residents care / what can they do?

Reject:
- nearby news with no direct resident impact
- political/council/ribbon-cutting/generic municipal news
- events this agency is not hosting or participating in
- generic seasonal filler with no timely trigger
- items outside a useful 1–3 day window unless a major ongoing/regional impact clearly affects residents
- weak, vague, duplicate, stale, or non-actionable items
- items that do not fit this agency's mission

For approved items:
- Preserve only verified facts. Never invent dates, locations, impacts, statistics, or agency involvement.
- Rewrite the recommendation so it sounds intentional and specific, not like a raw search result.
- Write a ready-to-publish Facebook caption in the agency's official voice.

CAPTION VOICE — this post is published BY a real local public safety agency. It must read like an official government communication, not a blog post or a news rewrite:
- ATTRIBUTE THE SOURCE. Name the authority that issued the alert or information (e.g., "The National Weather Service has issued…", "${agency} is advising…", "According to the ${place} Office of Emergency Management…", "The county Health Department reports…"). Never present an alert as if it appeared from nowhere.
- If the issuing authority is a DIFFERENT agency than ${agency}, credit that authority and have ${agency} relay/echo it ("We are sharing this alert from…"). Only speak as the originating authority when ${agency} is actually the source.
- Speak as "we" from ${agency} to "you," the residents — calm, credible, and professional. This is an official page, so avoid slang, hype, clickbait, exclamation-point spam, and gimmicky openers.
- Lead with the most important fact (what/where/when/who issued it), then what it means for residents, then the one clear action or where to get official updates.
- Keep the caption to 2–3 short paragraphs, plain professional language, no generic filler ("stay safe out there," "please be advised," "as a reminder").
- The caption must explain the agency-specific reason for sharing, not merely summarize news.
- Use at most 1 emoji and only if it aids clarity; no hashtag stuffing.

Return ONLY JSON:
{"items":[{"id":"","approve":true,"title":"","summary":"","whyItMatters":"","surfacedReason":"","recommendedAction":"","recommendedPostTiming":"","caption":"","rejectionReason":""}]}

Return one item for every input id. Set approve=false when the final PIO test fails.`,
        },
        {
          role: "user",
          content: `Final-check these scored candidates:\n${JSON.stringify(payload)}`,
        },
      ],
      max_tokens: 4000,
      temperature: 0.25,
    })

    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) return { ok: false, reason: "empty_response" }
    const parsed = parseModelJson<{ items?: ValidatedItem[] }>(raw)
    if (!parsed?.items || !Array.isArray(parsed.items)) {
      return { ok: false, reason: "invalid_json" }
    }

    const byId = new Map(parsed.items.map((item) => [String(item.id || ""), item]))
    const approved: RankedExternalOpportunity[] = []
    for (const opportunity of opts.opportunities) {
      const result = byId.get(opportunity.id)
      if (!result?.approve) continue

      const caption = String(result.caption || "").trim()
      const title = String(result.title || "").trim()
      const summary = String(result.summary || "").trim()
      const surfacedReason = String(result.surfacedReason || "").trim()
      const whyItMatters = String(result.whyItMatters || "").trim()
      const recommendedAction = String(result.recommendedAction || "").trim()
      const recommendedPostTiming = String(result.recommendedPostTiming || "").trim()
      if (
        !caption ||
        !title ||
        !summary ||
        !surfacedReason ||
        !whyItMatters ||
        !recommendedAction ||
        !recommendedPostTiming
      ) {
        continue
      }

      approved.push({
        ...opportunity,
        title,
        summary,
        whyItMatters,
        surfacedReason,
        recommendedAction,
        recommendedPostTiming,
        suggestedMessage: caption,
      })
    }

    return { ok: true, data: approved }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[final-pio-validation] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
