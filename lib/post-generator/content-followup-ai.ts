import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { parseModelJson } from "@/lib/parse-model-json"
import { agencyRoleBrief, agencyTypeLabel } from "./agency-relevance"
import { captionVoiceBrief } from "./caption-voice"
import {
  preventativeFollowupBrief,
  sourceSupportsPluralTrend,
  suggestsManufacturedTrend,
} from "./preventative-followup"
import type { ExternalOpportunityInput, RecentAgencyContent } from "./types"

type Followup = {
  sourceContentId?: string
  recommend?: boolean
  title?: string
  summary?: string
  whyItMatters?: string
  recommendedAction?: string
  signals?: string[]
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
}

/**
 * Converts recent SaferU-created content into preventative/educational follow-up
 * candidates. These still pass deterministic scoring and final PIO validation.
 */
export async function discoverCreatedContentFollowups(opts: {
  content: RecentAgencyContent[]
  agencyName?: string
  agencyType?: string
  agencyTypeOther?: string
  city?: string
  state: string
  todayIso: string
}): Promise<AiResult<ExternalOpportunityInput[]>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }
  if (!opts.content.length) return { ok: true, data: [] }

  const agency = opts.agencyName?.trim() || ""
  const typeLabel = agencyTypeLabel(opts.agencyType, opts.agencyTypeOther)
  const role = agencyRoleBrief(opts.agencyType)
  const place = [opts.city, opts.state].filter(Boolean).join(", ")
  const recent = opts.content.slice(0, 12).map((item) => ({
    id: item.id,
    kind: item.kind,
    title: item.title.slice(0, 180),
    content: item.content.slice(0, 1800),
    createdAt: item.createdAt,
    eventDate: item.eventDate,
    agencyRole: item.agencyRole,
  }))

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an experienced PIO reviewing content recently created inside SaferU.

Agency: ${agency || "(not provided — use neutral Officials phrasing)"} (${typeLabel})
Community: ${place}
Role: ${role}

${preventativeFollowupBrief()}

${captionVoiceBrief(agency, place)}

For each press release, video request, or event campaign, decide whether it creates a timely educational or preventative follow-up opportunity.

Examples:
- vehicle break-ins -> lock-your-car / 9 PM routine
- garage burglaries -> garage-door safety
- house fire -> smoke alarms / escape plan
- phone scam -> scam prevention
- heat emergency -> heat safety
- water rescue -> water safety
- catalytic-converter theft -> parking/vehicle security
- identity theft -> password/identity protection

Rules:
- Recommend only a clear follow-up that benefits residents now and fits this agency.
- Do not repeat the incident report. Move from reporting to prevention/education.
- Do not expose private victim, suspect, address, medical, or case details.
- Do not recommend a follow-up when the source content is administrative or has no useful prevention angle.
- Use specific snake_case signals that can match a SaferU safety graphic.
- Return at most one strongest follow-up per source item and at most 4 total.

Return ONLY JSON:
{"followups":[{"sourceContentId":"","recommend":true,"title":"","summary":"","whyItMatters":"","recommendedAction":"","signals":[""]}]}`,
        },
        {
          role: "user",
          content: `Today: ${opts.todayIso}\nRecent SaferU content:\n${JSON.stringify(recent)}`,
        },
      ],
      max_tokens: 2200,
      temperature: 0.2,
    })

    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) return { ok: false, reason: "empty_response" }
    const parsed = parseModelJson<{ followups?: Followup[] }>(raw)
    if (!parsed?.followups || !Array.isArray(parsed.followups)) {
      return { ok: false, reason: "invalid_json" }
    }

    const sourceById = new Map(recent.map((item) => [item.id, item]))
    const opportunities: ExternalOpportunityInput[] = []
    for (const followup of parsed.followups) {
      if (!followup.recommend) continue
      const source = sourceById.get(String(followup.sourceContentId || ""))
      const title = String(followup.title || "").trim()
      const whyItMatters = String(followup.whyItMatters || "").trim()
      const recommendedAction = String(followup.recommendedAction || "").trim()
      const signals = Array.isArray(followup.signals)
        ? followup.signals
            .map(String)
            .map((s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""))
            .filter(Boolean)
            .slice(0, 6)
        : []
      if (!source || !title || !whyItMatters || !recommendedAction || !signals.length) continue

      const followupText = `${title} ${followup.summary || ""} ${whyItMatters} ${recommendedAction}`
      if (
        suggestsManufacturedTrend(followupText) &&
        !sourceSupportsPluralTrend(source.content)
      ) {
        continue
      }

      opportunities.push({
        id: `saferu-followup-${source.id}-${slug(title)}`,
        title,
        summary: String(followup.summary || `Preventative follow-up to ${source.title}`).trim(),
        category: signals[0],
        sourceLabel: "Current Local Opportunity",
        whyItMatters,
        recommendedAction,
        recommendedPostTiming: "Post within 1–3 days while the original communication is fresh.",
        priority: "recommended_today",
        signals,
        sourceName: "Recent content created by this agency in SaferU",
        eventStart: opts.todayIso,
        eventEnd: opts.todayIso,
        verifiedFacts: [
          `The agency recently created ${source.kind.replace(/_/g, " ")} content titled "${source.title}".`,
        ],
        publicCallToAction: ["Share one specific preventative action residents can take."],
        doNotClaim: [
          "Do not repeat private incident details from the original content.",
          "Do not imply a broader crime trend unless the original content explicitly confirms one.",
          "Do not use trend language (increase, pattern, multiple reports, uptick) unless the source explicitly supports it.",
        ],
        whyNow: "The agency recently communicated about this topic; a timely prevention reminder helps while residents are still paying attention.",
        whyThisAgency: `${agency} is the natural voice for prevention and safety education tied to this recent communication.`,
        confidenceLevel: "high",
        jurisdictionFit: "own",
      })
      if (opportunities.length >= 4) break
    }

    return { ok: true, data: opportunities }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[content-followup-ai] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
