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

type ResolvedZip = { zip: string; city: string; state: string }

async function resolveZipLocations(zips: string[]): Promise<ResolvedZip[]> {
  const results = await Promise.all(
    zips.slice(0, 3).map(async (zip): Promise<ResolvedZip | null> => {
      try {
        const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`, {
          next: { revalidate: 24 * 60 * 60 },
        })
        if (!res.ok) return null
        const data = (await res.json()) as {
          places?: Array<{ "place name"?: string; "state abbreviation"?: string }>
        }
        const place = data.places?.[0]
        const city = String(place?.["place name"] || "").trim()
        const state = String(place?.["state abbreviation"] || "").trim()
        return city ? { zip, city, state } : null
      } catch {
        return null
      }
    })
  )
  return results.filter((item): item is ResolvedZip => Boolean(item))
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
  serviceZips: string[]
  needed: number
  todayIso?: string
  agencyType?: string
  excludeTitles?: string[]
}): Promise<AiResult<ExternalOpportunityInput[]>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }
  if (opts.needed <= 0) return { ok: true, data: [] }

  const today = opts.todayIso || new Date().toISOString().slice(0, 10)
  const resolvedZips = await resolveZipLocations(opts.serviceZips)
  const resolvedLabel = resolvedZips.length
    ? resolvedZips.map((item) => `${item.zip} = ${item.city}, ${item.state}`).join("; ")
    : `ZIP codes ${opts.serviceZips.join(", ")}, ${opts.state}`
  const primaryCity = resolvedZips[0]?.city || opts.city

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-search-preview",
      web_search_options: {
        search_context_size: "medium",
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
- Find only real, verifiable events or civic developments relevant to residents near the supplied ZIP codes.
- Prefer opportunities this agency type would realistically communicate (${opts.agencyType || "public safety"}).
- Results must be in the resolved ZIP city/county, an immediately adjacent community, or explicitly serve residents of that ZIP. Being elsewhere in the same state is not local enough.
- Prefer official municipal, county, police, fire, emergency management, school, library, parks, transit, road, utility, or established local-news sources.
- Events must be happening today or within the next 3 days (occasionally up to 7 days for major community events residents can still act on).
- Every event MUST include a working source URL that directly supports its facts.
- Do not include rumors, crime incidents involving private victims, opinion pieces, generic seasonal advice, evergreen safety tips, or events outside the area.
- Do not duplicate excluded titles.
- Use only facts explicitly supported by the cited source.
- If reliable results are unavailable, return fewer events rather than inventing anything.`,
        },
        {
          role: "user",
          content: `Today: ${today}
Resolved service area: ${resolvedLabel}
Agency type: ${opts.agencyType || "public safety"}
Find up to ${Math.min(opts.needed, 4)} additional current local events.
Exclude: ${(opts.excludeTitles ?? []).join("; ") || "none"}`,
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
    const maxDate = now + 7 * 24 * 60 * 60 * 1000
    const opportunities: ExternalOpportunityInput[] = []
    for (const event of parsed.events) {
      const title = String(event.title || "").trim()
      const sourceUrl = safeUrl(event.sourceUrl)
      const eventDate = String(event.eventDate || "").trim()
      const eventTime = new Date(`${eventDate}T00:00:00`).getTime()
      if (!title || !sourceUrl || Number.isNaN(eventTime) || eventTime < now || eventTime > maxDate) {
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
        category: String(event.category || "community_event").trim(),
        sourceLabel: "Upcoming Event",
        whyItMatters: String(
          event.whyItMatters ||
            `${title} is a verified upcoming event relevant to residents in the service area.`
        ).trim(),
        recommendedAction: String(
          event.recommendedAction ||
            "Share the verified date, location, and public participation details."
        ).trim(),
        recommendedPostTiming: String(
          event.recommendedPostTiming || "Post today or schedule a reminder before the event."
        ).trim(),
        priority: "recommended_today",
        signals: signals.length ? signals : ["community_engagement", "local_event"],
        sourceName: String(event.sourceName || "Local event source").trim(),
        sourceUrl,
        eventStart: eventDate,
        eventEnd: eventDate,
        verifiedFacts: facts,
        publicCallToAction: Array.isArray(event.publicCallToAction)
          ? event.publicCallToAction.map(String).map((v) => v.trim()).filter(Boolean).slice(0, 3)
          : ["Review the official source for details."],
        doNotClaim: [
          "Do not add dates, locations, costs, participants, or activities not stated in the cited source.",
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
