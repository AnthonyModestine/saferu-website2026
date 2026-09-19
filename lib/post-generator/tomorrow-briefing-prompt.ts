/**
 * AI Post Generator briefing prompt.
 *
 * Intentionally empty while the prompt is rebuilt from scratch.
 * Set TOMORROW_BRIEFING_PROMPT_ENABLED to true once a new prompt is ready.
 */

import { DEFAULT_DAILY_RECOMMENDATION_LIMIT } from "./types"

export const TOMORROW_BRIEFING_POST_LIMIT = DEFAULT_DAILY_RECOMMENDATION_LIMIT

/** When false, runTomorrowBriefing does not call OpenAI. */
export const TOMORROW_BRIEFING_PROMPT_ENABLED = false

export type TomorrowBriefingPromptContext = {
  agencyName: string
  agencyType: string
  serviceArea: string
  city: string
  county: string
  state: string
  jurisdictionScope: "city" | "county" | "state"
}

export function formatServiceAreaLabel(opts: {
  city?: string
  county?: string
  state: string
  serviceAreaType?: string
}): { serviceArea: string; jurisdictionScope: "city" | "county" | "state" } {
  const state = opts.state.trim()
  const county = opts.county?.trim() || ""
  const city = opts.city?.trim() || ""
  const type = opts.serviceAreaType || (county && !city ? "county" : "city")

  if (type === "state") {
    return { serviceArea: state, jurisdictionScope: "state" }
  }
  if (type === "county" && county) {
    return { serviceArea: `${county}, ${state}`, jurisdictionScope: "county" }
  }
  if (city && county) {
    return { serviceArea: `${city}, ${county}, ${state}`, jurisdictionScope: "city" }
  }
  return { serviceArea: city || county || state, jurisdictionScope: "city" }
}

export function tomorrowBriefingPromptContext(opts: {
  agencyName: string
  agencyType: string
  city?: string
  county?: string
  state: string
  serviceAreaType?: string
}): TomorrowBriefingPromptContext {
  const { serviceArea, jurisdictionScope } = formatServiceAreaLabel(opts)

  return {
    agencyName: opts.agencyName.trim() || "the public safety agency",
    agencyType: opts.agencyType.trim() || "public safety agency",
    serviceArea,
    city: opts.city?.trim() || "Not applicable",
    county: opts.county?.trim() || "Not applicable",
    state: opts.state.trim(),
    jurisdictionScope,
  }
}

/** System prompt sent to OpenAI — empty until rebuilt. */
export function buildTomorrowBriefingPrompt(_ctx: TomorrowBriefingPromptContext): string {
  return ""
}

/** User message sent to OpenAI — empty until rebuilt. */
export function buildTomorrowBriefingUserMessage(_opts: {
  todayIso: string
  targetIso: string
  todayDisplay: string
  targetDisplay: string
  promptCtx: TomorrowBriefingPromptContext
  recentTopicKeys?: string[]
  dismissedTitles?: string[]
}): string {
  return ""
}
