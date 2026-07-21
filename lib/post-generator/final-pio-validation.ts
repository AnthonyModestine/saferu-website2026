import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { parseModelJson } from "@/lib/parse-model-json"
import { agencyRoleBrief, agencyTypeLabel } from "./agency-relevance"
import { captionVoiceBrief } from "./caption-voice"
import { decisionStandardBrief, finalEditorialRejectBrief } from "./decision-standard"
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

  const agency = opts.agencyName?.trim() || ""
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

Agency: ${agency || "(not provided — use neutral Officials phrasing)"}
Agency type: ${typeLabel}
Service area: ${place}
Agency role: ${role}

The deterministic scoring engine already removed anything below 4 stars. You now have override authority:
approve an item ONLY if posting it today would genuinely help this agency's community.

${decisionStandardBrief()}

${finalEditorialRejectBrief()}

For approved items:
- Preserve only verified facts. Never invent dates, locations, impacts, statistics, or agency involvement.
- Rewrite the recommendation so it sounds intentional and specific, not like a raw search result.
- Write a ready-to-publish Facebook caption in the agency's official PIO voice.

${captionVoiceBrief(agency, place)}

Never write generic stand-ins such as "our local police," "our department," or "our officers" when the agency name is provided. Name the issuing authority in the first sentence (e.g. "The National Weather Service has issued a Tornado Watch…"). Never open with vague "Officials ask residents…" phrasing.

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
