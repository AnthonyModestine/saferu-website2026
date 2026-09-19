import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { formatDepartmentLabel } from "@/lib/department-types"
import type { ExternalOpportunityInput } from "./types"
import {
  TOMORROW_BRIEFING_PROMPT_ENABLED,
  tomorrowBriefingPromptContext,
} from "./tomorrow-briefing-prompt"
import {
  briefingIndicatesNoPosts,
  extractBriefingSchedule,
  parseTomorrowBriefingPosts,
  parsedPostsToOpportunities,
} from "./tomorrow-briefing-parse"
import { normalizeCityForDiscovery } from "./geo-utils"
import { shouldRejectOrdinaryWeather } from "./weather-gates"
import { applyBriefingVerification } from "./briefing-post-verification"

export type TomorrowBriefingResult = {
  opportunities: ExternalOpportunityInput[]
  markdown: string
  schedule?: string
  noPostsRecommended: boolean
}

function tomorrowIso(todayIso: string): string {
  const date = new Date(`${todayIso}T12:00:00`)
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

function filterOrdinaryWeather(
  opportunities: ExternalOpportunityInput[]
): ExternalOpportunityInput[] {
  return opportunities.filter(
    (opp) =>
      !shouldRejectOrdinaryWeather({
        title: opp.title,
        summary: opp.summary,
        whyItMatters: opp.whyItMatters,
        category: opp.category,
        sourceLabel: opp.sourceLabel,
        signals: opp.signals,
        verifiedFacts: opp.verifiedFacts,
        priority: opp.priority,
        confidenceLevel: opp.confidenceLevel,
        sourceName: opp.sourceName,
        suggestedMessage: opp.suggestedMessage,
      })
  )
}

export async function runTomorrowBriefing(opts: {
  agencyName: string
  agencyType: string
  agencyTypeOther?: string
  city?: string
  county?: string
  state: string
  serviceAreaType?: string
  serviceZips?: string[]
  todayIso?: string
  recentTopicKeys?: string[]
  dismissedTitles?: string[]
}): Promise<AiResult<TomorrowBriefingResult>> {
  const todayIso = opts.todayIso || new Date().toISOString().slice(0, 10)

  if (!TOMORROW_BRIEFING_PROMPT_ENABLED) {
    return {
      ok: true,
      data: {
        opportunities: [],
        markdown: "",
        noPostsRecommended: true,
      },
    }
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const tomorrow = tomorrowIso(todayIso)
  const discoveryCity = opts.city
    ? normalizeCityForDiscovery(opts.city, opts.state)
    : opts.city

  const agencyTypeLabel = formatDepartmentLabel(opts.agencyType, opts.agencyTypeOther)

  try {
    const { buildTomorrowBriefingPrompt, buildTomorrowBriefingUserMessage } = await import(
      "./tomorrow-briefing-prompt"
    )

    const promptCtx = tomorrowBriefingPromptContext({
      agencyName: opts.agencyName,
      agencyType: agencyTypeLabel,
      city: discoveryCity,
      county: opts.county,
      state: opts.state,
      serviceAreaType: opts.serviceAreaType,
    })

    const systemPrompt = buildTomorrowBriefingPrompt(promptCtx)
    const userMessage = buildTomorrowBriefingUserMessage({
      todayIso,
      targetIso: tomorrow,
      todayDisplay: todayIso,
      targetDisplay: tomorrow,
      promptCtx,
      recentTopicKeys: opts.recentTopicKeys,
      dismissedTitles: opts.dismissedTitles,
    })

    if (!systemPrompt.trim() && !userMessage.trim()) {
      return {
        ok: true,
        data: {
          opportunities: [],
          markdown: "",
          noPostsRecommended: true,
        },
      }
    }

    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-search-preview",
      web_search_options: {
        search_context_size: "high",
        user_location: {
          type: "approximate",
          approximate: {
            country: "US",
            region: opts.state,
            ...(discoveryCity ? { city: discoveryCity } : {}),
          },
        },
      },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 12000,
    })

    const markdown = completion.choices?.[0]?.message?.content?.trim()
    if (!markdown) return { ok: false, reason: "empty_response" }

    const parsed = parseTomorrowBriefingPosts(markdown)
    const opportunities = applyBriefingVerification(
      filterOrdinaryWeather(parsedPostsToOpportunities(parsed, todayIso))
    )
    const noPostsRecommended =
      opportunities.length === 0 && briefingIndicatesNoPosts(markdown)

    return {
      ok: true,
      data: {
        opportunities,
        markdown,
        schedule: extractBriefingSchedule(markdown),
        noPostsRecommended,
      },
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[tomorrow-briefing] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
