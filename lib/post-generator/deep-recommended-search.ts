/**
 * Deep search for at least one high-scoring "Top recommended" post.
 * Takes extra search time and targets the same scoring dimensions used in ranking
 * (agency fit, local jurisdiction, resident value, actionability, trusted source, freshness).
 */

import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { parseModelJson } from "@/lib/parse-model-json"
import { getAgencyProfile } from "./agency-relevance"
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
  eventDate?: string
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

const PRIVATE_INCIDENT_PATTERN =
  /\b(victim|body found|shot and killed|stabbing victim|suspect named|license plate|home address|\d{1,5}\s+[a-z]+\s+(st|street|ave|avenue|rd|road|ln|lane|dr|drive)\b)/i

async function runDeepSearchPass(opts: {
  pass: "agency_core" | "official_local"
  state: string
  city?: string
  county?: string
  serviceAreaType?: string
  serviceZips?: string[]
  agencyType?: string
  agencyName?: string
  needed: number
  todayIso: string
  excludeTitles: string[]
  activeSignals: string[]
}): Promise<AiResult<ExternalOpportunityInput[]>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

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
  const profile = getAgencyProfile(opts.agencyType)
  const preferred = profile.preferredSignals.slice(0, 12).join(", ")
  const adjacent = profile.adjacentSignals.slice(0, 8).join(", ")
  const avoid = profile.avoidSignals.slice(0, 8).join(", ")

  const searchHints = getDiscoverySearchHints(opts.state, primaryCity, countyFocus || primaryCity)
  const sourceCatalog = buildSourceCatalogPrompt({
    state: opts.state,
    city: primaryCity,
    county: countyFocus || primaryCity,
  })

  const passFocus =
    opts.pass === "agency_core"
      ? `Focus FIRST on topics matching this agency's preferred signals: ${preferred}.
These are the topics ${opts.agencyName || "this agency"} most often should recommend to residents.`
      : `Focus FIRST on official LOCAL sources for ${primaryCity || "the service area"}, ${opts.state}:
city/county .gov, police/fire/EMS pages, emergency management, school district, DOT/511, utilities, health department, and NWS.
Prioritize alerts and service updates IN the home community (not neighboring towns).`

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
          content: `You are doing a DEEP research pass for a ${opts.agencyType || "public safety"} PIO.
Take your time. Search thoroughly. Quality over speed.

Your job is to find posts that will score HIGH on this scoring method (do not invent scores — find real items that fit):
1) Agency relevance — preferred signals for this agency type: ${preferred}
   Adjacent OK: ${adjacent}
   Avoid unless unavoidable: ${avoid}
2) Geographic / jurisdiction — MUST be in the agency's ${
            isSheriff && countyFocus
              ? `full home county (${countyFocus}); any community in that county is in jurisdiction`
              : "configured city/county/state service area"
          }, not a distant neighboring jurisdiction when possible.
3) Resident value — residents can use the information today.
4) Actionability — one clear next step (avoid, verify, call, boil, detour, check on neighbor, etc.).
5) Trusted source — every item MUST have a working sourceUrl (.gov / official agency / utility / school / NWS / established local news citing officials).
6) Freshness — active today, last 48 hours still relevant, or next 1–3 days.

Return ONLY valid JSON:
{"topics":[{"title":"","summary":"","whyItMatters":"","recommendedAction":"","recommendedPostTiming":"","category":"","location":"","sourceName":"","sourceUrl":"https://...","verifiedFacts":[""],"publicCallToAction":[""],"signals":["snake_case"],"eventDate":"YYYY-MM-DD"}]}

Rules:
- ${passFocus}
- Also search for: new state/local laws or ordinances residents should know, FBI/FTC/CISA public scam or fraud advisories, and active weather or emergency alerts in the service area.
- Prefer HIGH-CONFIDENCE recommended posts this ${opts.agencyType || "public safety"} agency would actually publish today.
- Do NOT return evergreen tip sheets with no local trigger (e.g. generic "lock your doors") unless tied to a current local/official update.
- Do NOT recommend community festivals/events unless this agency is clearly hosting/participating per the source.
- Never invent incidents, closures, dates, or locations.
- Never include private crime-victim details, addresses, or license plates.
- If you cannot find strong local items, return fewer topics rather than weak filler.
- Tag signals using snake_case from the preferred list when accurate.`,
        },
        {
          role: "user",
          content: `Today: ${opts.todayIso}
Agency: ${opts.agencyName || "local public safety agency"} (${opts.agencyType || "public safety"})
Resolved service area: ${resolvedLabel}
City focus: ${primaryCity || "service area cities"}
${countyFocus ? `County service area: ${countyFocus}${isSheriff ? " (PRIMARY jurisdiction; search county-wide)" : ""}` : ""}
Already found signals/families (find DIFFERENT strong topics): ${opts.activeSignals.join(", ") || "none"}
Exclude titles: ${opts.excludeTitles.join("; ") || "none"}

Search deeply and return up to ${Math.min(opts.needed, 5)} strongest recommended post candidates.

Authoritative source catalog:
${sourceCatalog}

Suggested searches:
${searchHints.map((h) => `- ${h}`).join("\n")}
- ${primaryCity || opts.state} ${opts.agencyType?.replace(/_/g, " ") || "public safety"} alert today
- ${primaryCity || opts.state} road closure OR boil water OR school delay site:.gov
- ${opts.state} 511 OR NWS OR utility outage near ${primaryCity || "service area"}`,
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

      // Prefer preferred-signal tags so scoring agencyRelevance stays high when accurate.
      const eventDate = String(topic.eventDate || opts.todayIso).trim() || opts.todayIso

      opportunities.push({
        id: `deep-${opts.pass}-${opts.todayIso}-${slug(title)}`,
        title,
        summary: String(topic.summary || facts[0]).trim(),
        category: String(topic.category || signals[0] || "community_safety").trim(),
        sourceLabel: "Current Local Opportunity",
        whyItMatters: String(
          topic.whyItMatters ||
            `${title} is a timely, actionable update for residents in the home service area.`
        ).trim(),
        recommendedAction: String(
          topic.recommendedAction ||
            "Share verified facts and one clear next step residents can take today."
        ).trim(),
        recommendedPostTiming: String(
          topic.recommendedPostTiming || "Post today — this is a strong candidate for recommendation."
        ).trim(),
        priority: "recommended_today",
        signals: signals.length ? signals : profile.preferredSignals.slice(0, 2),
        sourceName: String(topic.sourceName || "Official local source").trim(),
        sourceUrl,
        eventStart: eventDate,
        eventEnd: eventDate,
        verifiedFacts: facts,
        publicCallToAction: Array.isArray(topic.publicCallToAction)
          ? topic.publicCallToAction.map(String).map((v) => v.trim()).filter(Boolean).slice(0, 3)
          : ["Follow official channels for the latest confirmed guidance."],
        doNotClaim: [
          "Do not add details not supported by the cited source.",
          "Do not claim this agency owns work managed by another jurisdiction.",
        ],
        confidenceLevel: "high",
      })
      if (opportunities.length >= opts.needed) break
    }

    return { ok: true, data: opportunities }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error(`[deep-recommended-search:${opts.pass}] error:`, detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

/**
 * Extra-minute deep search for strong recommended posts.
 * Runs two focused passes when needed; caller should re-score with the normal ranking method.
 */
export async function discoverStrongRecommendedTopics(opts: {
  state: string
  city?: string
  county?: string
  serviceAreaType?: string
  serviceZips?: string[]
  agencyType?: string
  agencyName?: string
  todayIso?: string
  excludeTitles?: string[]
  activeSignals?: string[]
  /** How many candidates to chase across passes (default 6). */
  needed?: number
}): Promise<AiResult<ExternalOpportunityInput[]>> {
  const today = opts.todayIso || new Date().toISOString().slice(0, 10)
  const needed = Math.max(3, opts.needed ?? 6)
  const excludeTitles = [...(opts.excludeTitles ?? [])]
  const activeSignals = [...(opts.activeSignals ?? [])]
  const collected: ExternalOpportunityInput[] = []
  const seen = new Set<string>()

  const addAll = (items: ExternalOpportunityInput[]) => {
    for (const item of items) {
      const key = item.title.trim().toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      collected.push(item)
      excludeTitles.push(item.title)
    }
  }

  const area = {
    serviceAreaType: opts.serviceAreaType,
    serviceZips: opts.serviceZips,
  }

  // Pass 1: agency-preferred topics in the home community.
  const pass1 = await runDeepSearchPass({
    pass: "agency_core",
    state: opts.state,
    city: opts.city,
    county: opts.county,
    ...area,
    agencyType: opts.agencyType,
    agencyName: opts.agencyName,
    needed: Math.ceil(needed / 2),
    todayIso: today,
    excludeTitles,
    activeSignals,
  })
  if (pass1.ok) addAll(pass1.data)
  else {
    console.warn(
      "[deep-recommended-search] agency_core pass unavailable:",
      pass1.reason,
      pass1.detail || ""
    )
  }

  // Pass 2: official local .gov / alerts — take the extra minute even if pass 1 found some.
  const pass2 = await runDeepSearchPass({
    pass: "official_local",
    state: opts.state,
    city: opts.city,
    county: opts.county,
    ...area,
    agencyType: opts.agencyType,
    agencyName: opts.agencyName,
    needed: Math.max(2, needed - collected.length),
    todayIso: today,
    excludeTitles,
    activeSignals: [...activeSignals, ...collected.flatMap((o) => o.signals ?? [])],
  })
  if (pass2.ok) addAll(pass2.data)
  else {
    console.warn(
      "[deep-recommended-search] official_local pass unavailable:",
      pass2.reason,
      pass2.detail || ""
    )
  }

  if (!pass1.ok && !pass2.ok) {
    return {
      ok: false,
      reason: pass1.reason !== "missing_api_key" ? pass1.reason : pass2.reason,
      detail: pass1.detail || pass2.detail,
    }
  }

  return { ok: true, data: collected.slice(0, needed) }
}
