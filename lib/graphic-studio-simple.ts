import "server-only"

import { readFile } from "fs/promises"
import path from "path"
import { toFile } from "openai"
import type { AiResult } from "@/lib/ai-result"

export type SimpleSafetyGraphicOpts = {
  topic: string
  category?: string
  audience?: string
  style?: string
  visualNotes?: string
  headline?: string
  supportingLine?: string
  body?: string
  emergencyMessage?: string
  agencyName?: string
  agencyLogoUrl?: string | null
  revisionRequest?: string
  sourceImageDataUrl?: string | null
}

type GeneratedImage = { dataUrl: string; model: string }

function responseModel(): string {
  return process.env.OPENAI_GRAPHIC_RESPONSE_MODEL?.trim() || "gpt-4.1"
}

export function buildSimpleSafetyGraphicPrompt(opts: {
  topic: string
  category?: string
  audience?: string
  style?: string
  visualNotes?: string
  headline?: string
  supportingLine?: string
  body?: string
  emergencyMessage?: string
  agencyName?: string
  hasLogo: boolean
}): string {
  const topic = opts.topic.trim()
  const category = opts.category?.trim()
  const audience = opts.audience?.trim()
  const style = opts.style?.trim()
  const agency = opts.agencyName?.trim()
  const visual = opts.visualNotes?.trim()
  const headline = opts.headline?.trim()
  const supportingLine = opts.supportingLine?.trim()
  const body = opts.body?.trim()
  const emergency = opts.emergencyMessage?.trim()

  const hasApprovedCopy = Boolean(headline || body)

  const logoLines = opts.hasLogo
    ? `I attached our department logo image. Place that EXACT logo once in the bottom-right corner with a little padding. Do NOT redraw, recolor, restyle, distort, crop, or alter the logo in any way. Do NOT duplicate it. Do NOT invent a different badge or seal.`
    : `Do not invent a fake department badge, seal, or logo.`

  const copyBlock = hasApprovedCopy
    ? `Use this EXACT text on the graphic (word-for-word — do not rewrite or shorten):
Headline: ${headline || "(none)"}
${supportingLine ? `Supporting line: ${supportingLine}` : ""}
Main message: ${body || topic}
${emergency ? `Emergency note: ${emergency}` : ""}`
    : `Educate the community about: ${topic}`

  return `Create a professional 16:9 landscape social media safety graphic${agency ? ` for ${agency}` : " for a public safety agency"}.

${copyBlock}
${category ? `Category: ${category}` : ""}
${audience ? `Audience: ${audience}` : ""}
${style ? `Visual style: ${style}` : ""}
${visual ? `Visual notes: ${visual}` : ""}

Requirements:
- 16:9 landscape, high quality, polished PIO / public-safety style
- Display the approved text large and readable with comfortable margins — nothing cut off at the edges
- ${logoLines}
- No SaferU branding
- Calm, accurate, professional tone`
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
      return toFile(buf, "agency-logo", { type: contentType })
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

async function resolveLogoDataUrl(logoUrl?: string | null): Promise<string | null> {
  if (!logoUrl?.trim()) return null
  if (logoUrl.startsWith("data:")) return logoUrl
  const file = await resolveLogoFile(logoUrl)
  if (!file) return null
  const arrayBuffer = await file.arrayBuffer()
  return `data:${file.type || "image/png"};base64,${Buffer.from(arrayBuffer).toString("base64")}`
}

function extractImageFromResponse(response: {
  output?: ReadonlyArray<{ type?: string; result?: string | null }>
}): string | null {
  for (const item of response.output || []) {
    if (item.type === "image_generation_call" && item.result) return item.result
  }
  return null
}

async function generateViaResponsesApi(opts: {
  prompt: string
  logoDataUrl?: string | null
  openai: InstanceType<(typeof import("openai"))["default"]>
}): Promise<GeneratedImage | null> {
  try {
    const content: Array<
      | { type: "input_text"; text: string }
      | { type: "input_image"; image_url: string; detail: "high" | "auto" | "low" }
    > = [{ type: "input_text", text: opts.prompt }]
    if (opts.logoDataUrl) {
      content.push({ type: "input_image", image_url: opts.logoDataUrl, detail: "high" })
    }

    const response = await opts.openai.responses.create({
      model: responseModel(),
      input: [{ role: "user", content }],
      tools: [{ type: "image_generation", size: "1536x1024", quality: "high" }],
    })

    const b64 = extractImageFromResponse(response)
    if (b64) {
      return {
        dataUrl: `data:image/png;base64,${b64}`,
        model: `${responseModel()}+image_generation`,
      }
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.warn("[graphic-studio-simple] responses image_generation failed:", detail)
  }
  return null
}

async function generateViaImagesApi(opts: {
  prompt: string
  openai: InstanceType<(typeof import("openai"))["default"]>
}): Promise<GeneratedImage | null> {
  try {
    const response = await opts.openai.images.generate({
      model: "gpt-image-1",
      prompt: opts.prompt,
      n: 1,
      size: "1536x1024",
      quality: "high",
    })
    const b64 = response.data?.[0]?.b64_json
    if (b64) return { dataUrl: `data:image/png;base64,${b64}`, model: "gpt-image-1" }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.warn("[graphic-studio-simple] images.generate failed:", detail)
  }
  return null
}

async function editGraphic(opts: {
  sourceImageDataUrl: string
  prompt: string
  openai: InstanceType<(typeof import("openai"))["default"]>
}): Promise<GeneratedImage | null> {
  const sourceFile = await resolveLogoFile(opts.sourceImageDataUrl)
  if (!sourceFile) return null
  try {
    const response = await opts.openai.images.edit({
      model: "gpt-image-1",
      image: sourceFile,
      prompt: opts.prompt,
      n: 1,
      size: "1536x1024",
    })
    const b64 = response.data?.[0]?.b64_json
    if (b64) return { dataUrl: `data:image/png;base64,${b64}`, model: "gpt-image-1+edit" }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.warn("[graphic-studio-simple] images.edit failed:", detail)
  }
  return null
}

/** ChatGPT-style: one prompt, optional logo attachment, one image — no multi-step pipeline. */
export async function generateSimpleSafetyGraphic(
  opts: SimpleSafetyGraphicOpts
): Promise<AiResult<GeneratedImage>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const topic = opts.topic.trim()
  if (!topic) return { ok: false, reason: "empty_input" }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    if (opts.sourceImageDataUrl && opts.revisionRequest) {
      const prompt = `This is a 16:9 public safety graphic. Make only this change: ${opts.revisionRequest.trim()}

Keep the department logo once in the bottom-right if it is already there. Do not duplicate the logo. Keep text readable with comfortable margins — nothing cut off at the edges.`
      const edited = await editGraphic({
        sourceImageDataUrl: opts.sourceImageDataUrl,
        prompt,
        openai,
      })
      if (edited) return { ok: true, data: edited }
      return { ok: false, reason: "openai_error", detail: "Could not revise this graphic." }
    }

    const hasLogo = Boolean(opts.agencyLogoUrl)
    const prompt = buildSimpleSafetyGraphicPrompt({
      topic,
      category: opts.category,
      audience: opts.audience,
      style: opts.style,
      visualNotes: opts.visualNotes,
      headline: opts.headline,
      supportingLine: opts.supportingLine,
      body: opts.body,
      emergencyMessage: opts.emergencyMessage,
      agencyName: opts.agencyName,
      hasLogo,
    })

    const logoDataUrl = hasLogo ? await resolveLogoDataUrl(opts.agencyLogoUrl) : null

    const viaResponses = await generateViaResponsesApi({ prompt, logoDataUrl, openai })
    if (viaResponses) return { ok: true, data: viaResponses }

    const viaGenerate = await generateViaImagesApi({ prompt, openai })
    if (viaGenerate) return { ok: true, data: viaGenerate }

    return { ok: false, reason: "openai_error", detail: "Image generation failed. Please try again." }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio-simple] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

export async function suggestSafetyGraphicCaption(opts: {
  topic: string
  agencyName?: string
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return ""

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 180,
      messages: [
        {
          role: "system",
          content:
            "Write a short Facebook post caption (1-3 sentences) in agency voice (we/you) for a public safety department. No hashtags. Return only the caption text.",
        },
        {
          role: "user",
          content: `Agency: ${opts.agencyName || "Public safety agency"}\nTopic: ${opts.topic}`,
        },
      ],
    })
    return completion.choices?.[0]?.message?.content?.trim() || ""
  } catch {
    return ""
  }
}
