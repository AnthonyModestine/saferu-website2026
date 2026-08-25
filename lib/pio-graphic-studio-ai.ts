import "server-only"

import { readFile } from "fs/promises"
import path from "path"
import { toFile } from "openai"
import {
  buildFallbackSafetyResearchBrief,
  normalizeSafetyResearchBrief,
  SAFETY_RESEARCH_RESPONSE_FORMAT,
  safetyResearchBriefSchema,
} from "@/lib/graphic-studio-schemas"
import { graphicOnImageCopy } from "@/lib/graphic-studio-display-copy"
import {
  buildSafetyImagePrompt,
  GRAPHIC_MARGIN_RULES,
  researchSourceGuidance,
  SAFETY_RESEARCH_SYSTEM,
} from "@/lib/graphic-studio-prompts"
import { runPioStructuredCall } from "@/lib/pio-structured-call"
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

export { buildSafetyImagePrompt } from "@/lib/graphic-studio-prompts"

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

  const payload = {
    category,
    category_source_guidance: researchSourceGuidance(category),
    audience,
    resident_need: residentNeed,
    visual_request: opts.visualRequest?.trim() || "",
    style,
    agency_name: opts.agencyName?.trim() || "",
    agency_type: opts.agencyType?.trim() || "",
    city: opts.city?.trim() || "",
    state: opts.state?.trim() || "",
    instruction:
      "Research the user's requested topic exactly. Do not substitute a different popular safety topic from the category.",
  }

  const buildCopy = (research: SafetyResearchBrief): SafetyTipGraphicCopy => ({
    category: category as SafetyTipCategory,
    audience: audience as SafetyAudience,
    style: style as SafetyGraphicStyle,
    categoryLabel: category.toUpperCase(),
    headline: research.recommended_headline,
    supportingLine: research.supporting_line,
    body: research.resident_message,
    emergencyMessage: research.emergency_message,
    caption: research.caption,
    visualDirection: research.visual_concept,
    research,
  })

  const fallbackBrief = () =>
    buildFallbackSafetyResearchBrief({
      category,
      residentNeed,
      audience,
      style,
      visualRequest: opts.visualRequest,
    })

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const result = await runPioStructuredCall(
      openai,
      SAFETY_RESEARCH_SYSTEM,
      payload,
      SAFETY_RESEARCH_RESPONSE_FORMAT,
      safetyResearchBriefSchema,
      2200,
      0.3
    )

    if (result.ok) {
      return { ok: true, data: buildCopy(normalizeSafetyResearchBrief(result.data)) }
    }

    console.warn(
      "[graphic-studio-ai] structured brief failed, using fallback:",
      result.reason,
      result.detail
    )
    return { ok: true, data: buildCopy(fallbackBrief()) }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio-ai] safety research error:", detail)
    return { ok: true, data: buildCopy(fallbackBrief()) }
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
    if (logoUrl.startsWith("http://") || logoUrl.startsWith("https://")) {
      const res = await fetch(logoUrl)
      if (!res.ok) return null
      const buf = Buffer.from(await res.arrayBuffer())
      const contentType = res.headers.get("content-type") || "image/png"
      const ext = contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : contentType.includes("webp")
          ? "webp"
          : "png"
      return toFile(buf, `agency-logo.${ext}`, { type: contentType })
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

function truncateImagePrompt(prompt: string, max = 3900): string {
  if (prompt.length <= max) return prompt
  return `${prompt.slice(0, max - 24).trimEnd()}\n\n[Prompt truncated]`
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

  const prompt = truncateImagePrompt(opts.prompt)
  const sourceFile = opts.sourceImageDataUrl
    ? await resolveLogoFile(opts.sourceImageDataUrl)
    : null

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    if (sourceFile) {
      try {
        const response = await openai.images.edit({
          model: "gpt-image-1",
          image: sourceFile,
          prompt,
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

    const logoFile = sourceFile ? null : await resolveLogoFile(opts.logoUrl)
    if (logoFile) {
      try {
        const response = await openai.images.edit({
          model: "gpt-image-1",
          image: logoFile,
          prompt,
          n: 1,
          size: "1536x1024",
        })
        const b64 = response.data?.[0]?.b64_json
        if (b64) return { ok: true, data: { dataUrl: `data:image/png;base64,${b64}`, model: "gpt-image-1" } }
      } catch (editErr) {
        const detail = editErr instanceof Error ? editErr.message : String(editErr)
        console.warn("[graphic-studio-ai] logo edit failed, trying generate:", detail)
      }
    }

    try {
      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
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
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      response_format: "b64_json",
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
  category: string
  verifiedTopic: string
  headline: string
  supportingLine: string
  body: string
  emergencyMessage: string
  agencyLogoExpected: boolean
}): Promise<{ status: "PASS" | "REGENERATE"; problems: string[]; revision_instructions: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const fallback = { status: "PASS" as const, problems: [] as string[], revision_instructions: [] as string[] }
  if (!apiKey) return fallback

  const onImage = graphicOnImageCopy({
    headline: opts.headline,
    supportingLine: opts.supportingLine,
    body: opts.body,
    emergencyMessage: opts.emergencyMessage,
  })

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

Look carefully for spelling errors, factual contradictions, malformed objects, extra text, missing text, fake agency branding, clutter, tiny unreadable copy, text touching the edges, full-width bottom text bars, and visual safety mistakes.

Approved category: ${opts.category}
Approved verified topic: ${opts.verifiedTopic}
Expected on-image headline: ${onImage.headline}
Expected on-image supporting line: ${onImage.supportingLine || "(none)"}
Expected on-image main message (short): ${onImage.mainMessage}
Expected on-image emergency: ${onImage.emergencyMessage || "(none)"}
Agency logo expected: ${opts.agencyLogoExpected ? "yes — exact supplied logo once, bottom-right. FAIL if duplicated, missing, distorted, or if a fake second badge was invented." : "no — fail if a fake badge/seal/logo was invented"}

REGENERATE if the graphic shows a different safety topic than the verified topic.
REGENERATE if the headline is missing or replaced with unrelated messaging.
REGENERATE if text runs edge-to-edge or fills a full-width footer bar across the bottom.
REGENERATE if any text, logo, icon, or important visual sits too close to the canvas edge (less than roughly 8–10% inset from top, left, right, or bottom).
REGENERATE if there is too much text to read quickly (wall of text).
REGENERATE if the agency logo appears more than once or is stacked/overlapping.

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
  const verifiedTopic = opts.verifiedTopic?.trim() || opts.category
  const agencyLogoExpected = Boolean(opts.agencyLogoUrl)
  const basePrompt = buildSafetyImagePrompt({
    category: opts.category,
    verifiedTopic,
    originalRequest: opts.residentNeed?.trim() || verifiedTopic,
    audience: opts.audience,
    headline: opts.headline,
    supportingLine: opts.supportingLine || "",
    residentMessage: opts.body,
    emergencyMessage: opts.emergencyMessage || "",
    visualConcept: opts.visualDirection,
    style: opts.style || "Let SaferU Decide",
    mustShow: opts.mustShow || [],
    mustAvoid: opts.mustAvoid || [],
    agencyLogoPresent: agencyLogoExpected,
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
    logoUrl: opts.sourceImageDataUrl ? null : opts.agencyLogoUrl,
    sourceImageDataUrl: opts.sourceImageDataUrl,
  })
  if (!image.ok) return image

  const review = await validateGeneratedGraphic({
    imageDataUrl: image.data.dataUrl,
    category: opts.category,
    verifiedTopic,
    headline: opts.headline,
    supportingLine: opts.supportingLine || "",
    body: opts.body,
    emergencyMessage: opts.emergencyMessage || "",
    agencyLogoExpected,
  })

  if (review.status === "REGENERATE" && review.revision_instructions.length) {
    const retryPrompt = `${prompt}

AUTOMATIC CORRECTIONS REQUIRED:
${review.revision_instructions.map((item) => `- ${item}`).join("\n")}
`
    const retry = await generateImageFromPrompt({
      prompt: retryPrompt,
      logoUrl: null,
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
    ? `An official agency logo is supplied as an image input. Place the exact supplied logo once in the BOTTOM-RIGHT corner. Design around the logo. Keep important content away from the logo area. Do not duplicate it. Do not recreate, alter, crop, recolor, distort, or replace it.`
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
Avoid long paragraphs and full-width bottom text bars.
Use professional imagery appropriate to the event.
Do not fabricate uniforms, badges, seals, or agency branding.
Do not use SaferU branding.

${GRAPHIC_MARGIN_RULES}

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
