import "server-only"

import { readFile } from "fs/promises"
import path from "path"
import { toFile } from "openai"
import type { AiResult } from "@/lib/ai-result"
import {
  isSafetyAudience,
  isSafetyGraphicStyle,
  isSafetyTipCategory,
  type SafetyAudience,
  type SafetyGraphicStyle,
  type SafetyResearchBrief,
  type SafetyTipCategory,
} from "@/lib/pio-graphic-studio-types"

export type { SafetyTipCategory }
export {
  SAFETY_TIP_CATEGORIES,
  SAFETY_AUDIENCES,
  SAFETY_GRAPHIC_STYLES,
} from "@/lib/pio-graphic-studio-types"

export type SafetyTipGraphicCopy = {
  category: SafetyTipCategory
  audience: SafetyAudience
  style: SafetyGraphicStyle
  categoryLabel: string
  headline: string
  supportingLine: string
  body: string
  emergencyMessage: string
  caption: string
  visualDirection: string
  research: SafetyResearchBrief
}

export type SafetyTipGraphicPackage = SafetyTipGraphicCopy & {
  imageDataUrl: string
  generationModel: string
  graphicId: string
}

const RESEARCH_SYSTEM = `You are the factual research and public-safety content engine for SaferU Graphic Studio.

Your job is NOT to generate an image.

Your job is to research a requested public-safety topic, verify the safety information, determine the most useful resident-facing takeaway, and produce a concise creative brief for another AI system that will create the graphic.

RESEARCH REQUIREMENTS

Research the topic using CURRENT authoritative sources.

Prioritize:

- official government sources
- nationally recognized safety organizations
- recognized standards organizations
- official manufacturer instructions when product-specific

Do not use random blogs, SEO articles, social media posts, or news stories as the primary authority when an authoritative source exists.

Cross-check consequential safety advice whenever practical.

DETERMINE

1. Primary hazard
2. Recommended resident action
3. What residents should avoid
4. Why the recommendation matters
5. Emergency action if relevant
6. Whether the user's request contains inaccurate or misleading assumptions

CORRECT INACCURATE REQUESTS

If the user's requested advice conflicts with authoritative safety guidance, do not preserve the inaccurate claim.

Replace it with accurate safety advice.

COPY RULES

Do not copy source language unnecessarily.

Do not include source organizations in resident-facing copy.

Create original public-safety language.

The finished graphic should communicate ONE strong takeaway.

HEADLINE

Prefer 3–8 words.

SUPPORTING LINE

Prefer 15 words or fewer.

MAIN RESIDENT MESSAGE

Prefer approximately 10–35 words.

EMERGENCY MESSAGE

Only include if genuinely useful.

Keep it very short.

VISUAL CONCEPT

Develop a visual that actually demonstrates the safety issue.

The visual should help residents understand the recommendation even before they read all the text.

Also include "caption": a Facebook caption in agency voice (we/you), 1-3 short sentences. Do not cite source organizations in the caption.

OUTPUT STRICT JSON only. No markdown.`

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed) as Record<string, unknown>
  } catch {
    const start = trimmed.indexOf("{")
    const end = trimmed.lastIndexOf("}")
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>
      } catch {
        return null
      }
    }
    return null
  }
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item || "").trim()).filter(Boolean)
}

function parseResearch(parsed: Record<string, unknown>): SafetyResearchBrief | null {
  const recommended_headline = asString(parsed.recommended_headline)
  const resident_message = asString(parsed.resident_message)
  if (!recommended_headline || !resident_message) return null

  const sourcesRaw = Array.isArray(parsed.sources) ? parsed.sources : []
  const sources = sourcesRaw
    .map((row) => {
      if (!row || typeof row !== "object") return null
      const item = row as Record<string, unknown>
      return {
        organization: asString(item.organization).slice(0, 120),
        title: asString(item.title).slice(0, 200),
        url: asString(item.url).slice(0, 400),
        claim_supported: asString(item.claim_supported).slice(0, 300),
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row?.organization || row?.url))

  return {
    verified_topic: asString(parsed.verified_topic).slice(0, 160),
    primary_hazard: asString(parsed.primary_hazard).slice(0, 220),
    primary_takeaway: asString(parsed.primary_takeaway).slice(0, 220),
    headline_options: asStringArray(parsed.headline_options).slice(0, 6),
    recommended_headline: recommended_headline.slice(0, 80),
    supporting_line: asString(parsed.supporting_line).slice(0, 160),
    resident_message: resident_message.slice(0, 320),
    emergency_message: asString(parsed.emergency_message).slice(0, 160),
    visual_concept: asString(parsed.visual_concept).slice(0, 400),
    visual_style_recommendation: asString(parsed.visual_style_recommendation).slice(0, 80),
    visual_must_show: asStringArray(parsed.visual_must_show).slice(0, 8),
    visual_must_avoid: asStringArray(parsed.visual_must_avoid).slice(0, 8),
    accuracy_notes: asStringArray(parsed.accuracy_notes).slice(0, 8),
    user_request_corrected: Boolean(parsed.user_request_corrected),
    correction_explanation: asString(parsed.correction_explanation).slice(0, 400),
    sources,
    caption: asString(parsed.caption).slice(0, 500) || resident_message.slice(0, 400),
  }
}

export function buildSafetyImagePrompt(opts: {
  verifiedTopic: string
  audience: string
  headline: string
  supportingLine: string
  residentMessage: string
  emergencyMessage: string
  visualConcept: string
  style: string
  mustShow: string[]
  mustAvoid: string[]
  agencyLogoPresent: boolean
}): string {
  const mustShow = opts.mustShow.length ? opts.mustShow.map((item) => `- ${item}`).join("\n") : "- the primary safety situation"
  const mustAvoid = opts.mustAvoid.length ? opts.mustAvoid.map((item) => `- ${item}`).join("\n") : "- stereotypes, gore, fake badges"
  const logoBlock = opts.agencyLogoPresent
    ? `An official agency logo is provided as an image input.

You MUST incorporate the exact supplied agency logo into the finished composition.

Place the logo in the BOTTOM-RIGHT corner.

Design the graphic around the logo from the beginning.

Reserve a clean bottom-right branding area BEFORE arranging text or important imagery.

Target visual size: approximately 10–12% of canvas width with proportional height.

Maintain approximately 3–4% padding from the right and bottom edges.

Nothing important should appear underneath or behind the logo.

DO NOT invent a new logo, badge, sheriff star, municipal seal, or recreate the supplied logo from memory.
DO NOT stretch, distort, crop, or recolor the supplied logo.`
    : `No agency logo is provided.

Do not create a logo.
Do not create a placeholder.
Do not insert SaferU branding.
Do not invent a badge, patch, seal, or department name.
Use the bottom-right area naturally as part of the composition.`

  return `Create a professional 16:9 public-safety social media graphic.

This graphic will be published by an official police department, sheriff's office, fire department, EMS agency, emergency management agency, municipality, or other public agency.

It must look credible, polished, modern, and appropriate for an official agency social media account.

VERIFIED CONTENT

Topic: ${opts.verifiedTopic}
Target Audience: ${opts.audience}
Headline: ${opts.headline}
Supporting Line: ${opts.supportingLine || "(none)"}
Primary Resident Safety Message: ${opts.residentMessage}
Emergency Message: ${opts.emergencyMessage || "(none)"}
Visual Concept: ${opts.visualConcept}
Preferred Style: ${opts.style}

The visual MUST show:
${mustShow}

The visual MUST NOT show:
${mustAvoid}

PRIMARY DESIGN OBJECTIVE
A resident scrolling social media should understand the primary safety lesson within approximately 2–3 seconds.
Teach ONE safety idea extremely well.
This is NOT an article, brochure, presentation slide, dense checklist, or wall of text.

FORMAT
16:9 landscape. High resolution. Professional social-media graphic.

LAYOUT
Use one dominant visual, one large headline, one concise safety message, strong visual hierarchy, generous whitespace, large mobile-readable typography, clean margins.
Avoid tiny text, long paragraphs, excessive cards, excessive icons, clutter, unnecessary decoration, text touching the canvas edge.

COLOR
Do NOT force SaferU colors. Choose a palette that supports the topic.
Red = danger/stop/emergency. Orange = caution/fire/road work. Yellow = warning. Green = safe/correct action. Blue = trust/informational.

VISUAL ACCURACY
Physical relationships must be logical. Vehicles, roads, distances, and equipment must look normal and support the verified advice.
Unsafe behavior should only be shown when it is unmistakably identified as unsafe.

PEOPLE
Do not associate crime, scams, unsafe behavior, or danger with protected characteristics. Avoid stereotypes. When humans are unnecessary, prefer objects and environments.

PUBLIC-SAFETY TONE
Professional. Clear. Educational. Confident. Not sensational.
No gore, graphic injuries, clickbait, or marketing copy.

TEXT
Use ONLY the approved factual messaging supplied above.
Do not invent extra tips, statistics, laws, distances, procedures, citations, or source organizations.
Do not add "Source: NFPA" or similar attribution.
All displayed text must be correctly spelled, crisp, and mobile readable.

OFFICIAL AGENCY LOGO
${logoBlock}

If the attached image is a logo, it is ONLY the official agency logo — not the background of the graphic. Create a full 16:9 original composition and place that exact logo bottom-right.

FINAL QUALITY TARGET
Prioritize: 1) Safety accuracy 2) Immediate comprehension 3) Visual accuracy 4) Readability 5) Professional design 6) Agency branding`
}

export async function draftSafetyTipGraphicCopy(opts: {
  category: string
  residentNeed: string
  audience?: string
  style?: string
  visualRequest?: string
  agencyName?: string
  agencyType?: string
  city?: string
  state?: string
}): Promise<AiResult<SafetyTipGraphicCopy>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const category = opts.category.trim()
  const residentNeed = opts.residentNeed.trim()
  const audience = isSafetyAudience(opts.audience || "") ? opts.audience! : "General Community"
  const style = isSafetyGraphicStyle(opts.style || "") ? opts.style! : "Let SaferU Decide"
  if (!residentNeed) return { ok: false, reason: "empty_input" }
  if (!isSafetyTipCategory(category)) return { ok: false, reason: "empty_input" }

  const userMessage = [
    `Category: ${category}`,
    `Audience: ${audience}`,
    `User's requested topic: ${residentNeed}`,
    `Optional visual request: ${opts.visualRequest?.trim() || "(none)"}`,
    `Preferred style: ${style}`,
    opts.agencyName ? `Agency: ${opts.agencyName}` : null,
    opts.agencyType ? `Agency type: ${opts.agencyType}` : null,
    opts.city || opts.state ? `Community: ${[opts.city, opts.state].filter(Boolean).join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    let raw = ""

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-search-preview",
        web_search_options: {
          search_context_size: "medium",
          user_location: {
            type: "approximate",
            approximate: {
              country: "US",
              ...(opts.state ? { region: opts.state } : {}),
              ...(opts.city ? { city: opts.city } : {}),
            },
          },
        },
        messages: [
          { role: "system", content: RESEARCH_SYSTEM },
          { role: "user", content: userMessage },
        ],
      })
      raw = completion.choices?.[0]?.message?.content?.trim() || ""
    } catch {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 1400,
        messages: [
          { role: "system", content: RESEARCH_SYSTEM },
          { role: "user", content: userMessage },
        ],
      })
      raw = completion.choices?.[0]?.message?.content?.trim() || ""
    }

    if (!raw) return { ok: false, reason: "empty_response" }
    const parsed = parseJsonObject(raw)
    if (!parsed) return { ok: false, reason: "invalid_json", detail: raw.slice(0, 400) }
    const research = parseResearch(parsed)
    if (!research) return { ok: false, reason: "empty_response" }

    return {
      ok: true,
      data: {
        category,
        audience,
        style,
        categoryLabel: category.toUpperCase(),
        headline: research.recommended_headline,
        supportingLine: research.supporting_line,
        body: research.resident_message,
        emergencyMessage: research.emergency_message,
        caption: research.caption,
        visualDirection: research.visual_concept,
        research,
      },
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio-ai] safety research error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

async function resolveLogoFile(logoUrl?: string | null) {
  if (!logoUrl?.trim()) return null
  try {
    if (logoUrl.startsWith("data:")) {
      const match = logoUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) return null
      const type = match[1] || "image/png"
      const buf = Buffer.from(match[2], "base64")
      const ext = type.includes("jpeg") || type.includes("jpg") ? "jpg" : type.includes("webp") ? "webp" : "png"
      return toFile(buf, `agency-logo.${ext}`, { type })
    }
    if (logoUrl.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", logoUrl.replace(/^\//, ""))
      const buf = await readFile(filePath)
      return toFile(buf, path.basename(filePath), { type: "image/png" })
    }
  } catch {
    return null
  }
  return null
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

type GeneratedImage = { dataUrl: string; model: string }

async function generateImageFromPrompt(opts: {
  prompt: string
  logoUrl?: string | null
  sourceImageDataUrl?: string | null
}): Promise<AiResult<GeneratedImage>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const logoFile = await resolveLogoFile(opts.logoUrl)
    const sourceFile = opts.sourceImageDataUrl
      ? await resolveLogoFile(opts.sourceImageDataUrl)
      : null

    const editImage = sourceFile || logoFile
    if (editImage) {
      try {
        const response = await openai.images.edit({
          model: "gpt-image-1",
          image: editImage,
          prompt: opts.prompt,
          n: 1,
          size: "1536x1024",
        })
        const b64 = response.data?.[0]?.b64_json
        if (b64) return { ok: true, data: { dataUrl: `data:image/png;base64,${b64}`, model: "gpt-image-1" } }
      } catch (editErr) {
        const detail = editErr instanceof Error ? editErr.message : String(editErr)
        console.warn("[graphic-studio-ai] images.edit failed, trying generate:", detail)
      }
    }

    try {
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: opts.prompt,
        n: 1,
        size: "1536x1024",
        quality: "medium",
      })
      const b64 = response.data?.[0]?.b64_json
      if (b64) return { ok: true, data: { dataUrl: `data:image/png;base64,${b64}`, model: "gpt-image-1" } }
    } catch (gptErr) {
      const detail = gptErr instanceof Error ? gptErr.message : String(gptErr)
      console.warn("[graphic-studio-ai] gpt-image-1 failed, trying dall-e-3:", detail)
    }

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: opts.prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
    })
    const item = response.data?.[0]
    if (item?.b64_json) {
      return { ok: true, data: { dataUrl: `data:image/png;base64,${item.b64_json}`, model: "dall-e-3" } }
    }
    if (item?.url) {
      const dataUrl = await fetchImageAsDataUrl(item.url)
      if (dataUrl) return { ok: true, data: { dataUrl, model: "dall-e-3" } }
    }
    return { ok: false, reason: "empty_response" }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio-ai] image error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

export async function validateGeneratedGraphic(opts: {
  imageDataUrl: string
  headline: string
  supportingLine: string
  body: string
  emergencyMessage: string
  agencyLogoExpected: boolean
}): Promise<{ status: "PASS" | "REGENERATE"; problems: string[]; revision_instructions: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const fallback = { status: "PASS" as const, problems: [] as string[], revision_instructions: [] as string[] }
  if (!apiKey) return fallback

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `Review this generated public-safety graphic before it is shown to the customer.

Compare it against the approved content and visual requirements.

Look carefully for spelling errors, factual contradictions, malformed objects, extra text, missing text, logo distortion, fake agency branding, logo overlap, clutter, tiny unreadable copy, text touching the edges, and visual safety mistakes.

Approved headline: ${opts.headline}
Supporting line: ${opts.supportingLine || "(none)"}
Body: ${opts.body}
Emergency: ${opts.emergencyMessage || "(none)"}
Agency logo expected: ${opts.agencyLogoExpected ? "yes, bottom-right" : "no — fail if a fake badge/seal/logo was invented"}

Return JSON:
{"status":"PASS"|"REGENERATE","problems":[],"revision_instructions":[]}

Do not fail the image for subjective minor stylistic preferences.
Fail it when something materially affects accuracy, readability, professionalism, branding, or safety comprehension.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Inspect this graphic." },
            { type: "image_url", image_url: { url: opts.imageDataUrl } },
          ],
        },
      ],
    })
    const parsed = parseJsonObject(completion.choices?.[0]?.message?.content || "")
    if (!parsed) return fallback
    const status = asString(parsed.status).toUpperCase() === "REGENERATE" ? "REGENERATE" : "PASS"
    return {
      status,
      problems: asStringArray(parsed.problems),
      revision_instructions: asStringArray(parsed.revision_instructions),
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.warn("[graphic-studio-ai] validation skipped:", detail)
    return fallback
  }
}

export async function generateSafetyTipGraphicImage(opts: {
  category: string
  headline: string
  supportingLine?: string
  body: string
  emergencyMessage?: string
  audience: string
  visualDirection: string
  style?: string
  mustShow?: string[]
  mustAvoid?: string[]
  verifiedTopic?: string
  residentNeed?: string
  agencyLogoUrl?: string | null
  sourceImageDataUrl?: string | null
  revisionRequest?: string
}): Promise<AiResult<GeneratedImage>> {
  const basePrompt = buildSafetyImagePrompt({
    verifiedTopic: opts.verifiedTopic || opts.category,
    audience: opts.audience,
    headline: opts.headline,
    supportingLine: opts.supportingLine || "",
    residentMessage: opts.body,
    emergencyMessage: opts.emergencyMessage || "",
    visualConcept: opts.visualDirection,
    style: opts.style || "Let SaferU Decide",
    mustShow: opts.mustShow || [],
    mustAvoid: opts.mustAvoid || [],
    agencyLogoPresent: Boolean(opts.agencyLogoUrl),
  })
  const prompt = opts.revisionRequest
    ? `Edit the supplied existing graphic. This is a PRECISION REVISION.

The user requested ONLY the following change:
${opts.revisionRequest}

Everything else should remain visually unchanged unless changing it is absolutely necessary.
Preserve layout, headline, wording, people, vehicles, background, icons, logo, colors, and composition unless required for this edit.

${basePrompt}`
    : basePrompt

  let image = await generateImageFromPrompt({
    prompt,
    logoUrl: opts.agencyLogoUrl,
    sourceImageDataUrl: opts.sourceImageDataUrl,
  })
  if (!image.ok) return image

  const review = await validateGeneratedGraphic({
    imageDataUrl: image.data.dataUrl,
    headline: opts.headline,
    supportingLine: opts.supportingLine || "",
    body: opts.body,
    emergencyMessage: opts.emergencyMessage || "",
    agencyLogoExpected: Boolean(opts.agencyLogoUrl),
  })

  if (review.status === "REGENERATE" && review.revision_instructions.length) {
    const retryPrompt = `${prompt}

AUTOMATIC CORRECTIONS REQUIRED:
${review.revision_instructions.map((item) => `- ${item}`).join("\n")}
`
    const retry = await generateImageFromPrompt({
      prompt: retryPrompt,
      logoUrl: opts.agencyLogoUrl,
      sourceImageDataUrl: image.data.dataUrl,
    })
    if (retry.ok) image = retry
  }

  return image
}

export async function createSafetyTipGraphicPackage(opts: {
  category: string
  residentNeed: string
  audience?: string
  style?: string
  visualRequest?: string
  headline?: string
  supportingLine?: string
  body?: string
  emergencyMessage?: string
  agencyName?: string
  agencyType?: string
  city?: string
  state?: string
  agencyLogoUrl?: string | null
}): Promise<AiResult<SafetyTipGraphicPackage>> {
  const copy = await draftSafetyTipGraphicCopy(opts)
  if (!copy.ok) return copy

  const headline = opts.headline?.trim() || copy.data.headline
  const supportingLine = opts.supportingLine?.trim() || copy.data.supportingLine
  const body = opts.body?.trim() || copy.data.body
  const emergencyMessage = opts.emergencyMessage?.trim() || copy.data.emergencyMessage

  const image = await generateSafetyTipGraphicImage({
    category: copy.data.category,
    headline,
    supportingLine,
    body,
    emergencyMessage,
    audience: copy.data.audience,
    visualDirection: copy.data.visualDirection,
    style: copy.data.style,
    mustShow: copy.data.research.visual_must_show,
    mustAvoid: copy.data.research.visual_must_avoid,
    verifiedTopic: copy.data.research.verified_topic,
    agencyLogoUrl: opts.agencyLogoUrl,
  })
  if (!image.ok) return image

  return {
    ok: true,
    data: {
      ...copy.data,
      headline,
      supportingLine,
      body,
      emergencyMessage,
      imageDataUrl: image.data.dataUrl,
      generationModel: image.data.model,
      graphicId: crypto.randomUUID(),
    },
  }
}

export function buildEventImagePrompt(opts: {
  eventType: string
  eventName: string
  date: string
  time: string
  location: string
  description: string
  cta: string
  contact: string
  style: string
  agencyLogoPresent: boolean
}): string {
  const logo = opts.agencyLogoPresent
    ? `An official agency logo is supplied as an image input. Place the exact supplied logo in the BOTTOM-RIGHT corner. Design around the logo. Keep important content away from the logo area. Do not recreate, alter, crop, recolor, distort, or replace it.`
    : `No logo is supplied. Do not generate one. Do not invent a badge, seal, or SaferU mark.`

  return `Create a professional 16:9 public-agency event graphic.

This graphic will be posted by an official police, fire, EMS, emergency management, municipal, or other public agency.

EVENT
Event Type: ${opts.eventType}
Event Name: ${opts.eventName}
Date: ${opts.date}
Time: ${opts.time}
Location: ${opts.location}
Description: ${opts.description || "(keep short; do not invent extra copy)"}
Call to Action: ${opts.cta || "(optional)"}
Contact: ${opts.contact || "(optional)"}
Style: ${opts.style}

DESIGN PRIORITY
The resident should immediately understand WHAT, WHEN, WHERE.
Event name should be dominant. Date/time highly visible. Location easy to find.
Avoid long paragraphs.
Use professional imagery appropriate to the event.
Do not fabricate uniforms, badges, seals, or agency branding.
Do not use SaferU branding.

AGENCY LOGO
${logo}`
}

export async function generateEventGraphicImage(opts: {
  eventType: string
  eventName: string
  date: string
  time: string
  location: string
  description?: string
  cta?: string
  contact?: string
  style?: string
  agencyLogoUrl?: string | null
}): Promise<AiResult<GeneratedImage>> {
  const prompt = buildEventImagePrompt({
    eventType: opts.eventType,
    eventName: opts.eventName,
    date: opts.date,
    time: opts.time,
    location: opts.location,
    description: opts.description || "",
    cta: opts.cta || "",
    contact: opts.contact || "",
    style: opts.style || "Let SaferU Decide",
    agencyLogoPresent: Boolean(opts.agencyLogoUrl),
  })
  return generateImageFromPrompt({ prompt, logoUrl: opts.agencyLogoUrl })
}
