/**
 * Local Ideas: AI drafts ready-to-adapt social posts from local context
 * (weather, holidays, seasonal safety, community observances).
 * Location must include state + ZIP(s) so results are place-specific.
 */

import type { AiResult } from "./ai-result"

export type LocalIdeaCategory =
  | "weather"
  | "holiday"
  | "seasonal"
  | "community"
  | "safety_tip"

export type LocalIdea = {
  id: string
  category: LocalIdeaCategory
  title: string
  whyNow: string
  draftPost: string
  channelHint: "Facebook" | "X" | "Either"
}

export type LocalIdeasRequest = {
  agencyName?: string
  city?: string
  state: string
  serviceZips: string[]
  todayIso?: string
}

const SYSTEM = `You help public safety PIOs invent ready-to-adapt social posts grounded in LOCAL context.

Rules:
- Use only the location provided (city, state, ZIP codes). Never invent a different city or county.
- Prefer ZIP-level specificity when helpful ("our service area", "residents in [city]", etc.).
- Ideas should feel timely for TODAY's date.
- Categories: weather, holiday, seasonal, community, safety_tip.
- Do NOT invent specific incidents, road closures, crimes, or named local businesses unless they are universal/public holidays or seasonal norms.
- Weather ideas should be seasonal/general for that region and time of year — not fake live forecasts.
- Holiday ideas: U.S. public / widely observed holidays near today, or seasonal observances.
- Each draftPost must be short, professional, and ready to edit before posting.
- Return ONLY valid JSON.`

function buildUserPrompt(req: LocalIdeasRequest): string {
  const today = req.todayIso || new Date().toISOString().slice(0, 10)
  const zips = req.serviceZips.join(", ")
  return `Generate 4 local post ideas for a public safety agency.

TODAY (ISO): ${today}
Agency: ${req.agencyName?.trim() || "Public Safety Agency"}
City: ${req.city?.trim() || "(not set)"}
State: ${req.state.trim()}
Service ZIP codes: ${zips}

Return JSON:
{
  "ideas": [
    {
      "category": "weather" | "holiday" | "seasonal" | "community" | "safety_tip",
      "title": "short label",
      "whyNow": "one sentence why this is relevant today/this week for THIS location",
      "draftPost": "ready-to-edit Facebook-length post",
      "channelHint": "Facebook" | "X" | "Either"
    }
  ]
}

Mix categories. Keep draftPost under ~450 characters for Facebook; if channelHint is X, keep under 280.`
}

function normalizeIdeas(raw: unknown): LocalIdea[] {
  if (!raw || typeof raw !== "object") return []
  const ideas = (raw as { ideas?: unknown }).ideas
  if (!Array.isArray(ideas)) return []
  const allowed: LocalIdeaCategory[] = [
    "weather",
    "holiday",
    "seasonal",
    "community",
    "safety_tip",
  ]
  return ideas
    .map((item, i) => {
      if (!item || typeof item !== "object") return null
      const o = item as Record<string, unknown>
      const category = String(o.category || "") as LocalIdeaCategory
      if (!allowed.includes(category)) return null
      const title = String(o.title || "").trim()
      const whyNow = String(o.whyNow || "").trim()
      const draftPost = String(o.draftPost || "").trim()
      if (!title || !draftPost) return null
      const channelRaw = String(o.channelHint || "Facebook")
      const channelHint =
        channelRaw === "X" || channelRaw === "Either" ? channelRaw : "Facebook"
      return {
        id: `idea-${i}-${category}`,
        category,
        title,
        whyNow: whyNow || "Timely for your area.",
        draftPost,
        channelHint,
      } satisfies LocalIdea
    })
    .filter((x): x is LocalIdea => Boolean(x))
    .slice(0, 6)
}

/** Demo ideas when guest / no API — still location-aware in copy when possible. */
export function demoLocalIdeas(req: LocalIdeasRequest): LocalIdea[] {
  const place =
    [req.city?.trim(), req.state.trim()].filter(Boolean).join(", ") ||
    req.state.trim() ||
    "your service area"
  const zipNote =
    req.serviceZips.length > 0
      ? `ZIP ${req.serviceZips.slice(0, 2).join(" / ")}`
      : place

  return [
    {
      id: "demo-weather",
      category: "weather",
      title: "Heat / seasonal weather check-in",
      whyNow: `Seasonal conditions matter for residents around ${zipNote}.`,
      draftPost: `A quick reminder for neighbors in ${place}: check on older adults and pets during today’s weather, stay hydrated, and never leave kids or animals in a parked vehicle. If you see someone in distress, call 911.`,
      channelHint: "Facebook",
    },
    {
      id: "demo-holiday",
      category: "holiday",
      title: "Upcoming observance tip",
      whyNow: "A nearby holiday or seasonal observance is a natural time to share one safety tip.",
      draftPost: `As we head into the next community observance in ${place}, a simple tip: lock vehicles, take valuables inside, and report suspicious activity. We’re here if you need us — non-emergency line is listed on our page.`,
      channelHint: "Either",
    },
    {
      id: "demo-seasonal",
      category: "seasonal",
      title: "Seasonal home safety",
      whyNow: `Practical seasonal prep for households in ${place}.`,
      draftPost: `Seasonal safety for ${place}: test smoke alarms, clear exits, and keep house numbers visible for responders. Small steps make a big difference if we need to find you quickly.`,
      channelHint: "Facebook",
    },
    {
      id: "demo-community",
      category: "community",
      title: "Know your neighbors",
      whyNow: "Community connection posts perform well and build trust year-round.",
      draftPost: `Strong communities look out for each other. If you spot something that doesn’t look right in ${place}, trust your instincts and call it in. Together we keep ${place} safer.`,
      channelHint: "Facebook",
    },
  ]
}

export async function generateLocalIdeasWithAI(
  req: LocalIdeasRequest
): Promise<AiResult<LocalIdea[]>> {
  const state = req.state?.trim()
  const zips = (req.serviceZips || []).map((z) => z.trim()).filter(Boolean)
  if (!state || zips.length === 0) {
    return { ok: false, reason: "empty_input" }
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" }
  }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildUserPrompt({ ...req, state, serviceZips: zips }) },
      ],
      max_tokens: 1800,
      temperature: 0.5,
    })
    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) return { ok: false, reason: "empty_response" }
    const parsed = JSON.parse(raw) as unknown
    const ideas = normalizeIdeas(parsed)
    if (ideas.length === 0) return { ok: false, reason: "empty_response" }
    return { ok: true, data: ideas }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[local-ideas-ai] OpenAI error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

export function parseServiceZips(raw: string | null | undefined): string[] {
  if (!raw) return []
  const matches = raw.match(/\b\d{5}\b/g)
  if (!matches) return []
  return [...new Set(matches)]
}
