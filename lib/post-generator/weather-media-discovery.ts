import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { parseModelJson } from "@/lib/parse-model-json"
import { formatServiceAreaLabel, resolveServiceAreaLocations } from "./geo-utils"
import { buildSourceCatalogPrompt, getDiscoverySearchHints } from "./source-catalog"
import { weatherGateBrief } from "./weather-gates"
import type { ExternalOpportunityInput } from "./types"

/** Local and national outlets the weather-media pass is instructed to search. */
export const WEATHER_MEDIA_OUTLETS = [
  "weather.gov, forecast.weather.gov, alerts.weather.gov",
  "spc.noaa.gov (severe storms), wpc.ncep.noaa.gov (precipitation), nhc.noaa.gov (hurricanes)",
  "water.noaa.gov (flooding), airnow.gov (air quality)",
  "Local Fox affiliate weather (e.g. FOX 26, FOX 29)",
  "Local ABC affiliate weather (e.g. ABC13)",
  "Local NBC and CBS affiliate weather teams",
  "AccuWeather city forecast (accuweather.com)",
  "Weather.com local forecast",
  "Tropical Tidbits (tropicaltidbits.com) current storms, satellite imagery, and forecast-model analysis",
] as const

export const WEATHER_MEDIA_SEARCH_HINTS = [
  "{city} {state} Fox weather forecast OR severe weather",
  "{city} ABC weather team forecast heat OR storm",
  "{city} NBC weather alert OR forecast",
  "{city} CBS weather warning OR forecast",
  "AccuWeather {city} {state} forecast",
  "site:accuweather.com {city} {state}",
  "site:tropicaltidbits.com tropical weather analysis {state}",
  "site:tropicaltidbits.com current storms forecast models",
  "{city} {state} weather forecast heat OR storm OR flood",
] as const

type ModelWeatherTopic = {
  title?: string
  summary?: string
  whyItMatters?: string
  recommendedAction?: string
  recommendedPostTiming?: string
  category?: string
  sourceName?: string
  sourceUrl?: string
  outletType?: string
  verifiedFacts?: string[]
  publicCallToAction?: string[]
  signals?: string[]
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)
}

function safeUrl(value: unknown): string | undefined {
  const raw = String(value || "").trim()
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined
  } catch {
    return undefined
  }
}

/**
 * Supplement NWS API data with local media and secondary weather analysis.
 * Local outlets are discovery sources; warnings must align with NWS when NWS alerts are active.
 */
export async function discoverLocalWeatherMediaTopics(opts: {
  state: string
  city?: string
  county?: string
  serviceAreaType?: string
  serviceZips?: string[]
  agencyType?: string
  needed: number
  todayIso?: string
  /** Summaries from NWS/API weather already found — AI must not contradict these. */
  nwsContext?: Array<{ title: string; summary?: string; signals?: string[] }>
  excludeTitles?: string[]
}): Promise<AiResult<ExternalOpportunityInput[]>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }
  if (opts.needed <= 0) return { ok: true, data: [] }

  const today = opts.todayIso || new Date().toISOString().slice(0, 10)
  const locations = await resolveServiceAreaLocations({
    serviceAreaType: opts.serviceAreaType,
    city: opts.city,
    county: opts.county,
    state: opts.state,
    serviceZips: opts.serviceZips,
  })
  const resolvedLabel = formatServiceAreaLabel(locations, {
    city: opts.city,
    county: opts.county,
    state: opts.state,
  })
  const primaryCity = opts.city || locations[0]?.city

  const searchHints = [
    ...WEATHER_MEDIA_SEARCH_HINTS.map((hint) =>
      hint
        .replace(/\{state\}/g, opts.state)
        .replace(/\{city\}/g, primaryCity || opts.state)
    ),
    ...getDiscoverySearchHints(opts.state, primaryCity).filter((h) =>
      /weather|noaa|airnow|forecast|spc|nhc|wpc/i.test(h)
    ),
  ]
  const sourceCatalog = buildSourceCatalogPrompt({
    state: opts.state,
    city: primaryCity,
    county: primaryCity,
  })

  const nwsBlock =
    opts.nwsContext && opts.nwsContext.length
      ? opts.nwsContext
          .map((item) => `- ${item.title}${item.summary ? `: ${item.summary}` : ""}`)
          .join("\n")
      : "No NWS/API weather items yet — still search local forecasts for timely heat, storm, or flood awareness."

  try {
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
            ...(primaryCity ? { city: primaryCity } : {}),
          },
        },
      },
      messages: [
        {
          role: "system",
          content: `You find timely LOCAL WEATHER post opportunities for a ${opts.agencyType || "public safety"} PIO.

Search MULTIPLE weather outlets serving the configured service area:
${WEATHER_MEDIA_OUTLETS.map((o) => `- ${o}`).join("\n")}

Return ONLY valid JSON:
{"topics":[{"title":"","summary":"","whyItMatters":"","recommendedAction":"","recommendedPostTiming":"","category":"","sourceName":"","sourceUrl":"https://...","outletType":"fox|abc|nbc|cbs|accuweather|weather.com|tropicaltidbits|other","verifiedFacts":[""],"publicCallToAction":[""],"signals":["snake_case"]}]}

Rules:
- Use the LOCAL TV station that actually covers the resolved city (Fox, ABC, NBC, or CBS affiliate), not national network homepages.
- AccuWeather and Weather.com must be the city-specific forecast page for the service area.
- Use Tropical Tidbits for current-storm context, satellite imagery, and model analysis. It is not an alert-issuing authority.
- Topics must be PIO-worthy: heat, severe storms, flooding, winter weather, high winds, air-quality/smoke impacts, or timing residents need to plan around.
- Every topic MUST include a working sourceUrl to the specific forecast article or city weather page you cited.
- If NWS/API context is provided below, do NOT contradict it. You may add local timing, heat index, or community framing from the TV/AccuWeather source.
- Confirm any Tropical Tidbits-derived watches, warnings, cones, official tracks, or actionable public guidance with NWS or NHC. Do not present a single model run as a forecast.
- Do not invent warnings NWS has not issued — frame TV forecasts as "forecast" or "expected" unless the cited source quotes an official warning.
- Prefer facts from the last 24–48 hours.
- Do not duplicate excluded titles.
- Return fewer topics rather than inventing data.

${weatherGateBrief()}`,
        },
        {
          role: "user",
          content: `Today: ${today}
Service area: ${resolvedLabel}
State: ${opts.state}
Agency type: ${opts.agencyType || "public safety"}
Find up to ${Math.min(opts.needed, 2)} local weather post topics from local media, forecast sites, or Tropical Tidbits.
Exclude titles: ${(opts.excludeTitles ?? []).join("; ") || "none"}

NWS/API weather already detected (do not contradict):
${nwsBlock}

National and local weather source catalog:
${sourceCatalog}

Suggested searches:
${searchHints.map((h) => `- ${h}`).join("\n")}`,
        },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) return { ok: false, reason: "empty_response" }
    const parsed = parseModelJson<{ topics?: ModelWeatherTopic[] }>(raw)
    if (!parsed?.topics || !Array.isArray(parsed.topics)) {
      return { ok: false, reason: "invalid_json" }
    }

    const opportunities: ExternalOpportunityInput[] = []
    for (const topic of parsed.topics) {
      const title = String(topic.title || "").trim()
      const sourceUrl = safeUrl(topic.sourceUrl)
      if (!title || !sourceUrl) continue

      const facts = Array.isArray(topic.verifiedFacts)
        ? topic.verifiedFacts.map(String).map((v) => v.trim()).filter(Boolean).slice(0, 5)
        : []
      if (!facts.length) continue

      const signals = Array.isArray(topic.signals)
        ? topic.signals
            .map(String)
            .map((v) => v.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""))
            .filter(Boolean)
            .slice(0, 6)
        : []

      const outlet = String(topic.outletType || "").toLowerCase()
      const defaultSourceName =
        outlet === "accuweather"
          ? "AccuWeather"
          : outlet === "weather.com"
            ? "Weather.com"
            : outlet === "tropicaltidbits"
              ? "Tropical Tidbits"
            : outlet === "fox"
              ? "Local Fox affiliate weather"
              : outlet === "abc"
                ? "Local ABC affiliate weather"
                : outlet === "nbc"
                  ? "Local NBC affiliate weather"
                  : outlet === "cbs"
                    ? "Local CBS affiliate weather"
                    : "Local TV weather"

      opportunities.push({
        id: `weather-media-${today}-${slug(title)}`,
        title,
        summary: String(topic.summary || facts[0]).trim(),
        category: String(topic.category || "weather").trim(),
        sourceLabel: outlet === "tropicaltidbits" ? "Weather Analysis" : "Weather Alert",
        whyItMatters: String(
          topic.whyItMatters ||
            `Local weather coverage helps residents plan around conditions expected in the service area.`
        ).trim(),
        recommendedAction: String(
          topic.recommendedAction ||
            "Share the forecast timing and practical safety steps using wording consistent with official NWS guidance."
        ).trim(),
        recommendedPostTiming: String(
          topic.recommendedPostTiming || "Post before the weather window affects commuters and outdoor activity."
        ).trim(),
        priority: /warning|severe|flood|tornado|heat/i.test(title) ? "recommended_today" : "plan_ahead",
        signals: signals.length ? signals : ["weather_safety"],
        sourceName: String(topic.sourceName || defaultSourceName).trim(),
        sourceUrl,
        eventStart: today,
        eventEnd: today,
        verifiedFacts: facts,
        publicCallToAction: Array.isArray(topic.publicCallToAction)
          ? topic.publicCallToAction.map(String).map((v) => v.trim()).filter(Boolean).slice(0, 3)
          : ["Monitor official NWS alerts and local emergency information."],
        doNotClaim: [
          "Do not state an official NWS warning is active unless weather.gov confirms it.",
          "Do not cite exact temperatures or timing not stated in the cited forecast source.",
          "Do not present a Tropical Tidbits model run as an official forecast, warning, or storm track.",
        ],
        confidenceLevel: "medium",
      })
      if (opportunities.length >= opts.needed) break
    }

    return { ok: true, data: opportunities }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[weather-media-discovery] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
