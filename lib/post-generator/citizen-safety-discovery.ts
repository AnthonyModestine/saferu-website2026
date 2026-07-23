import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { parseModelJson } from "@/lib/parse-model-json"
import {
  buildSourceCatalogPrompt,
  getDiscoverySearchHints,
} from "./source-catalog"
import { formatServiceAreaLabel, resolveServiceAreaLocations } from "./geo-utils"
import type { ExternalOpportunityInput } from "./types"

type ModelTopic = {
  title?: string
  summary?: string
  whyItMatters?: string
  recommendedAction?: string
  recommendedPostTiming?: string
  category?: string
  location?: string
  sourceName?: string
  sourceUrl?: string
  verifiedFacts?: string[]
  publicCallToAction?: string[]
  signals?: string[]
  sourceCategory?: string
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

async function fetchCitizenAppFeed(): Promise<unknown[]> {
  const url = process.env.CITIZEN_APP_API_URL?.trim()
  if (!url) return []
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SaferU Press Center (https://saferu.com)",
        ...(process.env.CITIZEN_APP_API_KEY
          ? { Authorization: `Bearer ${process.env.CITIZEN_APP_API_KEY}` }
          : {}),
      },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = (await res.json()) as unknown
    if (Array.isArray(data)) return data.slice(0, 20)
    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>
      for (const key of ["items", "alerts", "incidents", "topics", "data"]) {
        if (Array.isArray(record[key])) return (record[key] as unknown[]).slice(0, 20)
      }
    }
    return []
  } catch {
    return []
  }
}

const PRIVATE_INCIDENT_PATTERN =
  /\b(victim|body found|shot and killed|stabbing victim|suspect named|license plate|home address|\d{1,5}\s+[a-z]+\s+(st|street|ave|avenue|rd|road|ln|lane|dr|drive)\b)/i

/**
 * AI web discovery across expanded public-safety sources near service ZIPs.
 * Includes Citizen app, DOT/511, utilities, schools, health, EMA, and more.
 */
export async function discoverExpandedPublicSafetyTopics(opts: {
  state: string
  city?: string
  county?: string
  serviceAreaType?: string
  serviceZips?: string[]
  agencyType?: string
  needed: number
  todayIso?: string
  activeSignals?: string[]
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
  const countyFocus = opts.county?.trim()
  const isSheriff = opts.agencyType === "sheriff"
  const citizenFeed = await fetchCitizenAppFeed()

  const searchHints = getDiscoverySearchHints(opts.state, primaryCity, countyFocus || primaryCity)
  const sourceCatalog = buildSourceCatalogPrompt({
    state: opts.state,
    city: primaryCity,
    county: countyFocus || primaryCity,
  })

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
          content: `You research MULTIPLE public-safety information sources for a ${opts.agencyType || "public safety"} PIO daily briefing.

Use this authoritative source catalog (search these domains and discover local equivalents):
${sourceCatalog}

Return ONLY valid JSON:
{"topics":[{"title":"","summary":"","whyItMatters":"","recommendedAction":"","recommendedPostTiming":"","category":"","location":"","sourceName":"","sourceUrl":"https://...","verifiedFacts":[""],"publicCallToAction":[""],"signals":["snake_case"],"sourceCategory":""}]}

Rules:
- Topics must be active today or within the last 48 hours and still relevant for a PIO post.
- Every topic MUST include a working sourceUrl from a credible source (.gov preferred, then utilities, schools, Citizen, verified news citing officials).
- Prefer COMMUNITY-WIDE public safety items: weather impacts, traffic/511 closures, utility outages, boil-water advisories, air quality, health advisories, school delays, official missing-person campaigns, transit disruptions, emergency management notices, new laws or ordinances affecting residents, and verified FBI/FTC scam or fraud warnings.
- Do NOT recommend community events, festivals, open houses, or fairs unless the cited source clearly shows this ${opts.agencyType || "public safety"} agency is hosting or officially participating.
- Prefer topics that are DIFFERENT from signals already detected (do not add another heat/storm post if those signals are already listed).
- NEVER include: private crime victims, home addresses, license plates, unverified scanner gossip, or graphic incident details.
- Prefer opportunities a ${opts.agencyType || "public safety"} agency would realistically post.
- ${
            isSheriff && countyFocus
              ? `Treat all of ${countyFocus} as the home jurisdiction. Search county government, sheriff, emergency management, roads, schools, utilities, and communities across the county.`
              : "Keep local results tied to the configured city/county/state service area or a direct impact on its residents."
          }
- Do not duplicate excluded titles.
- Use only facts explicitly supported by the cited source.
- Return fewer topics rather than inventing anything.`,
        },
        {
          role: "user",
          content: `Today: ${today}
Resolved service area: ${resolvedLabel}
${countyFocus ? `County service area: ${countyFocus}${isSheriff ? " (PRIMARY jurisdiction)" : ""}` : ""}
State: ${opts.state}
Agency type: ${opts.agencyType || "public safety"}
Signals already detected (avoid duplicating these topic families): ${(opts.activeSignals ?? []).join(", ") || "none"}
Find up to ${Math.min(opts.needed, 5)} high-value post topics that are DIFFERENT from the signals above.
Exclude titles: ${(opts.excludeTitles ?? []).join("; ") || "none"}

Suggested searches:
${searchHints.map((h) => `- ${h}`).join("\n")}

Configured Citizen API feed (supporting context only):
${citizenFeed.length ? JSON.stringify(citizenFeed).slice(0, 4000) : "none"}`,
        },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) return { ok: false, reason: "empty_response" }
    const parsed = parseModelJson<{ topics?: ModelTopic[] }>(raw)
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

      const combined = `${title} ${topic.summary || ""} ${facts.join(" ")}`
      if (PRIVATE_INCIDENT_PATTERN.test(combined)) continue

      const signals = Array.isArray(topic.signals)
        ? topic.signals
            .map(String)
            .map((v) => v.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""))
            .filter(Boolean)
            .slice(0, 6)
        : []

      opportunities.push({
        id: `expanded-${today}-${slug(title)}`,
        title,
        summary: String(topic.summary || facts[0]).trim(),
        category: String(topic.category || "community_safety").trim(),
        sourceLabel: "Current Local Opportunity",
        whyItMatters: String(
          topic.whyItMatters ||
            `${title} is a timely public-safety topic for residents in the service area.`
        ).trim(),
        recommendedAction: String(
          topic.recommendedAction ||
            "Share verified facts and one practical step residents can take today."
        ).trim(),
        recommendedPostTiming: String(
          topic.recommendedPostTiming || "Post today while the topic is still relevant."
        ).trim(),
        priority: "recommended_today",
        signals: signals.length ? signals : ["community_safety", "public_awareness"],
        sourceName: String(topic.sourceName || topic.sourceCategory || "Public safety source").trim(),
        sourceUrl,
        eventStart: today,
        eventEnd: today,
        verifiedFacts: facts,
        publicCallToAction: Array.isArray(topic.publicCallToAction)
          ? topic.publicCallToAction.map(String).map((v) => v.trim()).filter(Boolean).slice(0, 3)
          : ["Follow official agency channels for confirmed guidance."],
        doNotClaim: [
          "Do not repeat unverified scanner or social media rumors as confirmed fact.",
          "Do not name private victims, suspects, or addresses unless officially released.",
        ],
        confidenceLevel: "medium",
      })
      if (opportunities.length >= opts.needed) break
    }

    return { ok: true, data: opportunities }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[expanded-public-safety-discovery] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

/** @deprecated Use discoverExpandedPublicSafetyTopics */
export const discoverCitizenPublicSafetyTopics = discoverExpandedPublicSafetyTopics
