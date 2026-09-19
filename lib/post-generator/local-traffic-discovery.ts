import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { parseModelJson } from "@/lib/parse-model-json"
import {
  buildSourceCatalogPrompt,
  getDiscoverySearchHints,
  STATE_DOT_URLS,
} from "./source-catalog"
import { formatServiceAreaLabel, resolveDiscoveryCityLabel, resolveServiceAreaLocations } from "./geo-utils"
import { parseDiscoveredEvents } from "./discovery-parse"
import type { ExternalOpportunityInput } from "./types"

export const LOCAL_TRAFFIC_SEARCH_HINTS = [
  "511 {state} road closure OR construction OR incident",
  "site:511*.org {state} closure",
  "{state} DOT road closure OR lane restriction OR detour",
  "site:.gov {city} {state} road closure OR detour",
  "{county} county {state} road closure OR bridge work",
  "{city} {state} public works road closure",
  "site:penndot.gov OR site:dot.{state}.gov closure {city}",
  "{city} {state} traffic alert road closed citing DOT OR 511",
] as const

function trafficSearchHints(state: string, city?: string, county?: string): string[] {
  const stateCode = state.trim().toUpperCase().slice(0, 2)
  const cityLabel = city || stateCode
  const countyLabel = county || city || stateCode
  return LOCAL_TRAFFIC_SEARCH_HINTS.map((hint) =>
    hint
      .replace(/\{state\}/g, stateCode)
      .replace(/\{city\}/g, cityLabel)
      .replace(/\{county\}/g, countyLabel)
  )
}

/** Discover active road closures / traffic disruptions from 511, DOT, and municipal sources. */
export async function discoverLocalTrafficImpacts(opts: {
  state: string
  city?: string
  county?: string
  serviceAreaType?: string
  serviceZips?: string[]
  agencyType?: string
  needed: number
  todayIso?: string
  excludeTitles?: string[]
}): Promise<AiResult<ExternalOpportunityInput[]>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }
  if (opts.needed <= 0) return { ok: true, data: [] }

  const today = opts.todayIso || new Date().toISOString().slice(0, 10)
  const stateCode = opts.state.trim().toUpperCase().slice(0, 2)
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
  const primaryCity =
    resolveDiscoveryCityLabel({ city: opts.city, state: opts.state, locations }) ||
    opts.city ||
    locations[0]?.city
  const dotUrl = STATE_DOT_URLS[stateCode] || `https://www.google.com/search?q=${stateCode}+DOT+road+closures`

  const searchHints = [
    ...trafficSearchHints(opts.state, primaryCity, opts.county),
    ...getDiscoverySearchHints(opts.state, primaryCity, opts.county).filter((hint) =>
      /511|road|closure|detour|traffic|dot/i.test(hint)
    ),
  ]

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
          content: `You find ACTIVE road closures, lane restrictions, bridge work, and traffic disruptions for a local PIO.

Return ONLY valid JSON:
{"events":[{"title":"","summary":"","whyItMatters":"","recommendedAction":"","recommendedPostTiming":"","category":"road_closure","eventDate":"YYYY-MM-DD","location":"","sourceName":"","sourceUrl":"https://...","verifiedFacts":[""],"publicCallToAction":[""],"signals":["road_closure"]}]}

Rules:
- ONLY road/traffic/disruption items affecting residents in or traveling through the service area.
- Prefer official sources: state 511, state DOT, county public works, municipal DOT, FHWA-linked 511 pages, and local news ONLY when quoting DOT/police/EMA on a closure.
- Each item needs a working source URL and at least one verified fact with the road name, location, and what is closed or restricted.
- Active now or starting within 7 days. Skip stale closures that already ended.
- Do not invent detours, times, or roads not in the source.
- If nothing credible is found, return {"events":[]}.`,
        },
        {
          role: "user",
          content: `Today: ${today}
Service area: ${resolvedLabel}
State DOT reference: ${dotUrl}
Agency type: ${opts.agencyType || "public safety"}
Find up to ${Math.min(opts.needed, 4)} active road or traffic disruptions.
Exclude titles: ${(opts.excludeTitles ?? []).join("; ") || "none"}

Search hints:
${searchHints.map((h) => `- ${h}`).join("\n")}`,
        },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) return { ok: false, reason: "empty_response" }

    const parsed = parseModelJson<{ events?: unknown[] }>(raw)
    const opportunities = parseDiscoveredEvents(parsed?.events, {
      today,
      needed: opts.needed,
      idPrefix: "traffic",
      defaultCategory: "road_closure",
      defaultSignals: ["road_closure", "traffic_safety", "travel_delay"],
      defaultSourceLabel: "Current Local Opportunity",
    })

    return { ok: true, data: opportunities }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[local-traffic-discovery] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
