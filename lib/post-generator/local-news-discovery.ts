import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { parseModelJson } from "@/lib/parse-model-json"
import { formatServiceAreaLabel, resolveDiscoveryCityLabel, resolveServiceAreaLocations } from "./geo-utils"
import { parseDiscoveredEvents } from "./discovery-parse"
import type { ExternalOpportunityInput } from "./types"

export const LOCAL_NEWS_SEARCH_HINTS = [
  "{city} {state} Fox local news road closure OR boil water OR evacuation citing police OR DOT",
  "{city} ABC local news traffic alert OR utility outage citing officials",
  "{city} NBC OR CBS local news emergency management OR school closure",
  "site:fox*.com {city} {state} police OR sheriff OR road closure",
  "site:abc*.com {city} {state} public safety OR traffic",
  "{county} county {state} local news citing sheriff OR emergency management",
  "{city} newspaper police OR fire OR road closure official",
] as const

function newsSearchHints(state: string, city?: string, county?: string): string[] {
  const stateCode = state.trim().toUpperCase().slice(0, 2)
  const cityLabel = city || stateCode
  const countyLabel = county || city || stateCode
  return LOCAL_NEWS_SEARCH_HINTS.map((hint) =>
    hint
      .replace(/\{state\}/g, stateCode)
      .replace(/\{city\}/g, cityLabel)
      .replace(/\{county\}/g, countyLabel)
  )
}

/**
 * Local TV / newspaper stories that cite officials — road closures, outages,
 * boil-water, evacuations, school delays, and similar civic disruptions.
 */
export async function discoverLocalNewsTopics(opts: {
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
  const searchHints = newsSearchHints(opts.state, primaryCity, opts.county)

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
          content: `You find LOCAL NEWS stories that a PIO can responsibly relay because they quote official sources.

Return ONLY valid JSON:
{"events":[{"title":"","summary":"","whyItMatters":"","recommendedAction":"","recommendedPostTiming":"","category":"","eventDate":"YYYY-MM-DD","location":"","sourceName":"","sourceUrl":"https://...","verifiedFacts":[""],"publicCallToAction":[""],"signals":[]}]}

Rules:
- Use local Fox, ABC, NBC, CBS affiliates, regional TV stations, and established local newspapers ONLY when the story cites police, sheriff, fire, DOT, 511, utility, school district, health department, or emergency management.
- Good topics: road closures, traffic crashes with major road impact, boil-water advisories, power outages, evacuations, missing-person campaigns led by officials, new local laws, major utility work, police press releases seeking suspects or sharing surveillance video, fire incidents with official department statements, community watch meetings led by police.
- NOT crime-gossip, opinion, national-only stories, entertainment, or stories naming private victims.
- The verifiedFacts must include what the OFFICIAL source said — not speculation.
- sourceUrl must be the news article; sourceName should be the outlet (e.g. "FOX 29 Philadelphia").
- If nothing qualifies, return {"events":[]}.`,
        },
        {
          role: "user",
          content: `Today: ${today}
Service area: ${resolvedLabel}
Agency type: ${opts.agencyType || "public safety"}
Find up to ${Math.min(opts.needed, 4)} local news items residents should know about.
Exclude: ${(opts.excludeTitles ?? []).join("; ") || "none"}

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
      idPrefix: "local-news",
      defaultCategory: "community_update",
      defaultSignals: ["local_news", "community_awareness"],
      defaultSourceLabel: "Current Local Opportunity",
    })

    return { ok: true, data: opportunities }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[local-news-discovery] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
