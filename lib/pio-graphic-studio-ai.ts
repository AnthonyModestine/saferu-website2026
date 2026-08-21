import "server-only"

import type { AiResult } from "@/lib/ai-result"
import {
  isSafetyTipCategory,
  type SafetyTipCategory,
} from "@/lib/pio-graphic-studio-types"

export type { SafetyTipCategory }
export { SAFETY_TIP_CATEGORIES } from "@/lib/pio-graphic-studio-types"

export type SafetyTipGraphicCopy = {
  category: SafetyTipCategory
  categoryLabel: string
  headline: string
  body: string
  caption: string
  audience: string
  visualDirection: string
}

export type SafetyTipGraphicPackage = SafetyTipGraphicCopy & {
  /** AI-generated graphic without logos; client stamps SaferU + agency logos. */
  imageDataUrl: string
}

const RESEARCH_COPY_SYSTEM = `You are SaferU's public-safety communications specialist.

RESEARCH BEFORE WRITING
Use current, authoritative guidance from organizations appropriate to the topic:
- Fire / cooking / batteries: NFPA, U.S. Fire Administration, FEMA
- Cybersecurity: CISA, FBI, FTC
- Scams / fraud: FTC, FBI, USPS Inspection Service, IRS when relevant
- Traffic / vehicle safety: NHTSA, FMCSA, state DOTs
- Child / family safety: CPSC, Safe Kids, NHTSA
- Emergency preparedness: FEMA, Ready.gov, CDC when applicable
- Weather: National Weather Service, NOAA
- Workplace: OSHA
- Public health: CDC or state/federal health authorities

Do not invent statistics, laws, distances, temperatures, procedures, or warnings.
Do not copy another organization's wording. Create original SaferU educational content.

ONE THING RESIDENTS NEED TO KNOW
Identify:
1. The hazard — what could go wrong
2. The action — what the resident should do
3. The reason — why that action matters
Build the message around ONE strong safety point. A resident should understand it in 3–5 seconds.

WRITING STYLE
Short headlines. Plain English. Strong verbs. Clear actions.
Tone: professional police/fire/EM/government PIO — not an advertisement.
Avoid fearmongering, jargon, long paragraphs, and filler like "Safety is everyone's responsibility."

Return JSON only:
{
  "categoryLabel": "short label like CRIME PREVENTION",
  "headline": "3-7 word headline",
  "body": "1-2 short sentences with the primary action",
  "caption": "Facebook caption in agency voice (we/you)",
  "audience": "residents | drivers | parents | seniors | etc.",
  "visualDirection": "one sentence describing the single dominant visual that teaches the tip"
}`

function buildImagePrompt(opts: {
  category: string
  categoryLabel: string
  headline: string
  body: string
  audience: string
  visualDirection: string
  residentNeed: string
}): string {
  return `Create an original SaferU public-safety educational graphic.

FORMAT
Exactly 16:9 landscape. Modern, professional, clean, bold, highly visual, easy to read on a phone.
Suitable for Facebook, Instagram, X, LinkedIn, and agency websites.

RESEARCH / ACCURACY
Base the visual on authoritative safety guidance for this topic. Do not invent unsafe procedures.
The visual itself must be factually correct (sequence, distances, equipment, direction of movement).
Never demonstrate an unsafe action unless it is unmistakably marked as WRONG.

ONE MESSAGE
Teach one thing extremely well instead of teaching five things poorly.
Primary message: ${opts.headline}
Supporting tip: ${opts.body}
Topic category: ${opts.category}
Audience: ${opts.audience || "residents"}
User intent: ${opts.residentNeed}
Desired visual: ${opts.visualDirection}

WRITING ON THE GRAPHIC
Include this exact hierarchy with large readable text:
1. Small eyebrow: ${opts.categoryLabel}
2. Bold headline: ${opts.headline}
3. Short supporting tip: ${opts.body}
Use short sentences and plain English. No hashtags. No legal disclaimers. No watermark text.

VISUAL STYLE
Prefer one dominant visual that shows the real situation or correct action.
Examples of the right approach: a three-foot stove safety zone, a scooter blocking an exit marked wrong, a vehicle moving over for roadside workers, a phishing text example, correct grease-fire response.
Avoid clutter, tiny icons, anatomical mistakes, impossible road layouts, floating objects, or decorative filler.

COLOR
SaferU blue as a primary brand color. Supporting accents by subject:
Red = danger/stop/emergency
Orange = caution/roadway/fire
Yellow = warning/attention
Green = safe/correct action

BRANDING SPACE (CRITICAL)
Do NOT draw any logos, watermarks, agency seals, or brand marks.
Leave clean empty margin in the bottom-left corner and bottom-right corner for logos that will be added later.
Nothing should sit in those bottom corner logo zones.
Do not put text underneath the bottom logo zones.

FINAL LOOK
Should look like a real public-safety PIO graphic an agency would post — not an ad, not a meme, not a stock collage.`
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get("content-type") || "image/png"
    return `data:${contentType};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

export async function draftSafetyTipGraphicCopy(opts: {
  category: string
  residentNeed: string
  agencyName?: string
  agencyType?: string
  city?: string
  state?: string
}): Promise<AiResult<SafetyTipGraphicCopy>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const category = opts.category.trim()
  const residentNeed = opts.residentNeed.trim()
  if (!residentNeed) return { ok: false, reason: "empty_input" }
  if (!isSafetyTipCategory(category)) return { ok: false, reason: "empty_input" }

  const agency = opts.agencyName?.trim() || "the local public safety agency"
  const place = [opts.city?.trim(), opts.state?.trim()].filter(Boolean).join(", ")
  const agencyType = opts.agencyType?.trim() || "public safety"

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      max_tokens: 700,
      messages: [
        { role: "system", content: RESEARCH_COPY_SYSTEM },
        {
          role: "user",
          content: [
            `Agency: ${agency}`,
            `Agency type: ${agencyType}`,
            place ? `Community: ${place}` : null,
            `Graphic category: ${category}`,
            `What residents should know: ${residentNeed}`,
            `Research the topic using authoritative sources, then write the graphic copy.`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    })

    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) return { ok: false, reason: "empty_response" }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return { ok: false, reason: "invalid_json", detail: raw.slice(0, 400) }
    }

    const headline = String(parsed.headline || "").trim()
    const body = String(parsed.body || "").trim()
    const caption = String(parsed.caption || "").trim()
    const audience = String(parsed.audience || "residents").trim()
    const visualDirection = String(parsed.visualDirection || "").trim()
    const categoryLabel = String(parsed.categoryLabel || category)
      .trim()
      .toUpperCase()

    if (!headline || !body) return { ok: false, reason: "empty_response" }

    return {
      ok: true,
      data: {
        category,
        categoryLabel: categoryLabel.slice(0, 40),
        headline: headline.slice(0, 70),
        body: body.slice(0, 220),
        caption: caption.slice(0, 400) || body,
        audience: audience.slice(0, 60) || "residents",
        visualDirection:
          visualDirection.slice(0, 220) ||
          `A clear visual teaching: ${headline}`,
      },
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio-ai] safety tip copy error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

export async function generateSafetyTipGraphicImage(opts: {
  category: string
  categoryLabel: string
  headline: string
  body: string
  audience: string
  visualDirection: string
  residentNeed: string
}): Promise<AiResult<string>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const prompt = buildImagePrompt(opts)

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    try {
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1536x1024",
        quality: "medium",
      })
      const b64 = response.data?.[0]?.b64_json
      if (b64) return { ok: true, data: `data:image/png;base64,${b64}` }
    } catch (gptErr) {
      const detail = gptErr instanceof Error ? gptErr.message : String(gptErr)
      console.warn("[graphic-studio-ai] gpt-image-1 failed, trying dall-e-3:", detail)
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    })
    const item = response.data?.[0]
    if (item?.b64_json) {
      return { ok: true, data: `data:image/png;base64,${item.b64_json}` }
    }
    if (item?.url) {
      const dataUrl = await fetchImageAsDataUrl(item.url)
      if (dataUrl) return { ok: true, data: dataUrl }
    }
    return { ok: false, reason: "empty_response" }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio-ai] safety tip image error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

export async function createSafetyTipGraphicPackage(opts: {
  category: string
  residentNeed: string
  agencyName?: string
  agencyType?: string
  city?: string
  state?: string
}): Promise<AiResult<SafetyTipGraphicPackage>> {
  const copy = await draftSafetyTipGraphicCopy(opts)
  if (!copy.ok) return copy

  const image = await generateSafetyTipGraphicImage({
    category: copy.data.category,
    categoryLabel: copy.data.categoryLabel,
    headline: copy.data.headline,
    body: copy.data.body,
    audience: copy.data.audience,
    visualDirection: copy.data.visualDirection,
    residentNeed: opts.residentNeed,
  })
  if (!image.ok) return image

  return {
    ok: true,
    data: {
      ...copy.data,
      imageDataUrl: image.data,
    },
  }
}
