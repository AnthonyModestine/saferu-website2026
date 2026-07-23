import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { parseModelJson } from "@/lib/parse-model-json"
import type { ExternalOpportunityInput } from "./types"

type ModelEvent = {
  title?: string
  summary?: string
  whyItMatters?: string
  recommendedAction?: string
  recommendedPostTiming?: string
  category?: string
  eventDate?: string
  location?: string
  sourceName?: string
  sourceUrl?: string
  verifiedFacts?: string[]
  publicCallToAction?: string[]
  signals?: string[]
}

import {
  buildSourceCatalogPrompt,
  getDiscoverySearchHints,
} from "./source-catalog"
import { eventExclusionBrief } from "./event-exclusion"
import { jurisdictionRulesBrief } from "./jurisdiction"
import { currentnessBrief, sourceStandardsBrief } from "./source-standards"
import { formatServiceAreaLabel, resolveServiceAreaLocations } from "./geo-utils"

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

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)
}

/**
 * Find verified, timely public-interest events near the supplied service ZIPs.
 * Web search is discovery only; entries without a cited source URL are rejected.
 */
export async function discoverLocalCurrentEventsWithAI(opts: {
  state: string
  city?: string
  county?: string
  serviceAreaType?: string
  serviceZips?: string[]
  needed: number
  todayIso?: string
  agencyType?: string
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
          content: `You research current public-interest updates for a ${opts.agencyType || "public safety"} PIO.

Return ONLY valid JSON:
{"events":[{"title":"","summary":"","whyItMatters":"","recommendedAction":"","recommendedPostTiming":"","category":"","eventDate":"YYYY-MM-DD","location":"","sourceName":"","sourceUrl":"https://...","verifiedFacts":[""],"publicCallToAction":[""],"signals":["snake_case"]}]}

Rules:
- Find only real, verifiable PUBLIC SAFETY / CIVIC UPDATES relevant to residents in the configured service area — not community festivals or entertainment events.
- Prefer: weather impacts, road/traffic disruptions, utility outages, boil-water notices, school delays/closures, air quality, wildfire/smoke, health advisories, official missing-person campaigns, emergency management notices, new state or local laws affecting residents, and FBI/FTC/CISA public advisories when relevant to the community.
- Do NOT recommend community events, festivals, open houses, fairs, concerts, or "save the date" activities unless the cited source clearly shows THIS agency type (${opts.agencyType || "public safety"}) is hosting or officially participating.
- Prefer opportunities this agency type would realistically communicate (${opts.agencyType || "public safety"}).
- Geographic scope: ${
            isSheriff && countyFocus
              ? `the full ${countyFocus} county jurisdiction. Search county-wide sources and communities throughout the county`
              : "the configured city/county/state service area, an immediately adjacent community, or an area explicitly serving those residents"
          }. Being elsewhere in the same state is not local enough.
- Prefer official municipal, county, police, fire, emergency management, school, transit, road, utility, health department, or established local-news sources citing officials.
- Updates must be happening today or within the next 3 days (occasionally up to 7 days for major disruptions residents can still act on).
- Every item MUST include a working source URL that directly supports its facts.
- Do not include rumors, crime incidents involving private victims, opinion pieces, generic seasonal advice, or evergreen safety tips.
- Do not duplicate excluded titles.
- Use only facts explicitly supported by the cited source.
- If reliable results are unavailable, return fewer items rather than inventing anything.

${eventExclusionBrief()}

${sourceStandardsBrief()}

${currentnessBrief()}

${jurisdictionRulesBrief(opts.agencyType)}`,
        },
        {
          role: "user",
          content: `Today: ${today}
Resolved service area: ${resolvedLabel}
${countyFocus ? `County service area: ${countyFocus}${isSheriff ? " (PRIMARY jurisdiction for this sheriff's office)" : ""}` : ""}
Agency type: ${opts.agencyType || "public safety"}
Find up to ${Math.min(opts.needed, 6)} additional current local public-safety updates (NOT unconfirmed community events).
Exclude: ${(opts.excludeTitles ?? []).join("; ") || "none"}

Authoritative source catalog:
${sourceCatalog}

Suggested searches:
${searchHints.map((h) => `- ${h}`).join("\n")}`,
        },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) return { ok: false, reason: "empty_response" }
    const parsed = parseModelJson<{ events?: ModelEvent[] }>(raw)
    if (!parsed?.events || !Array.isArray(parsed.events)) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[current-events-ai] invalid response:", raw.slice(0, 1500))
      }
      return { ok: false, reason: "invalid_json" }
    }

    const now = new Date(`${today}T00:00:00`).getTime()
    const minDate = now - 3 * 24 * 60 * 60 * 1000
    const maxDate = now + 7 * 24 * 60 * 60 * 1000
    const opportunities: ExternalOpportunityInput[] = []
    for (const event of parsed.events) {
      const title = String(event.title || "").trim()
      const sourceUrl = safeUrl(event.sourceUrl)
      const eventDate = String(event.eventDate || today).trim() || today
      const eventTime = new Date(`${eventDate}T00:00:00`).getTime()
      // Allow recent past dates for ongoing alerts (heat, outages, scams) — still reject stale items.
      if (!title || !sourceUrl || Number.isNaN(eventTime) || eventTime < minDate || eventTime > maxDate) {
        continue
      }

      const facts = Array.isArray(event.verifiedFacts)
        ? event.verifiedFacts.map(String).map((v) => v.trim()).filter(Boolean).slice(0, 5)
        : []
      if (!facts.length) continue

      const signals = Array.isArray(event.signals)
        ? event.signals
            .map(String)
            .map((v) => v.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""))
            .filter(Boolean)
            .slice(0, 6)
        : []

      opportunities.push({
        id: `ai-local-${eventDate}-${slug(title)}`,
        title,
        summary: String(event.summary || facts[0]).trim(),
        category: String(event.category || "community_update").trim(),
        sourceLabel: "Current Local Opportunity",
        whyItMatters: String(
          event.whyItMatters ||
            `${title} is a verified update relevant to residents in the service area.`
        ).trim(),
        recommendedAction: String(
          event.recommendedAction ||
            "Share the verified update in a calm community voice."
        ).trim(),
        recommendedPostTiming: String(
          event.recommendedPostTiming || "Post today while the update is still timely."
        ).trim(),
        priority: "recommended_today",
        signals: signals.length ? signals : ["community_awareness"],
        sourceName: String(event.sourceName || "Local civic source").trim(),
        sourceUrl,
        eventStart: eventDate,
        eventEnd: eventDate,
        verifiedFacts: facts,
        publicCallToAction: Array.isArray(event.publicCallToAction)
          ? event.publicCallToAction.map(String).map((v) => v.trim()).filter(Boolean).slice(0, 2)
          : ["Follow official channels for the latest information."],
        doNotClaim: [
          "Do not add dates, locations, or details not stated in the cited source.",
          "Do not promote an event as agency-hosted unless the source confirms agency involvement.",
        ],
        confidenceLevel: "medium",
      })
      if (opportunities.length >= opts.needed) break
    }

    return { ok: true, data: opportunities }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[current-events-ai] discovery error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
