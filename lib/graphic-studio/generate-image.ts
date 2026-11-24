import "server-only"

import { toFile } from "openai"
import type { AiResult } from "@/lib/ai-result"
import { resolveImageModelAndQuality } from "@/lib/ai-config/phase2"
import { GRAPHIC_SIZE } from "@/lib/graphic-studio/constants"
import type { CreativeStrategy } from "@/lib/ai-intelligence/creative-strategy"
import { buildImagePrompt } from "@/lib/graphic-studio/prompts"
import { createBlankCanvasBuffer, type LogoAsset } from "@/lib/graphic-studio/logo-assets"

/** gpt-image-2.5-sunburst supports 2048x1152; OpenAI SDK types may lag behind. */
const IMAGE_SIZE = GRAPHIC_SIZE as "1536x1024"

type ImageUsage = {
  input_tokens?: number
  output_tokens?: number
  input_tokens_details?: { image_tokens?: number; text_tokens?: number }
}

type GeneratedArtwork = { buffer: Buffer; model: string; usage?: ImageUsage }

async function generateArtworkTextOnly(
  prompt: string,
  openai: InstanceType<(typeof import("openai"))["default"]>,
  model: string,
  quality: string
): Promise<GeneratedArtwork | null> {
  try {
    const response = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: quality as "high",
    })
    const b64 = response.data?.[0]?.b64_json
    if (!b64) return null
    const usage = (response as { usage?: ImageUsage }).usage
    return { buffer: Buffer.from(b64, "base64"), model: `${model}+generate`, usage }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.warn("[graphic-studio/generate-image] images.generate failed:", detail)
    return null
  }
}

async function generateArtworkWithLogo(
  prompt: string,
  logo: LogoAsset,
  openai: InstanceType<(typeof import("openai"))["default"]>,
  model: string,
  quality: string
): Promise<GeneratedArtwork | null> {
  try {
    // Blank 16:9 canvas + real agency logo. OpenAI must place the logo ON the graphic
    // (scale only) — we no longer paste a logo afterward.
    const canvas = await createBlankCanvasBuffer()
    const canvasFile = await toFile(canvas, "canvas.png", { type: "image/png" })
    const ext = logo.mimeType.includes("jpeg") || logo.mimeType.includes("jpg") ? "jpg" : "png"
    const logoFile = await toFile(logo.buffer, `agency-logo.${ext}`, { type: logo.mimeType })

    const response = await openai.images.edit({
      model,
      image: [canvasFile, logoFile],
      prompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: quality as "high",
    })
    const b64 = response.data?.[0]?.b64_json
    if (!b64) return null
    const usage = (response as { usage?: ImageUsage }).usage
    return { buffer: Buffer.from(b64, "base64"), model: `${model}+edit+logo`, usage }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.warn("[graphic-studio/generate-image] images.edit with logo failed:", detail)
    return null
  }
}

export async function generateSafetyArtwork(opts: {
  approvedHeadline: string
  approvedMessage: string
  messageFormat?: string
  visualConcept: string
  importantVisualDetails: string[]
  visualNotes?: string
  style: string
  logo?: LogoAsset | null
  topic?: string
  audience?: string
  creativeStrategy?: CreativeStrategy | null
}): Promise<AiResult<GeneratedArtwork & { promptUsed: string }>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const { model, quality } = resolveImageModelAndQuality()

  const prompt = buildImagePrompt({
    approvedHeadline: opts.approvedHeadline,
    approvedMessage: opts.approvedMessage,
    messageFormat: opts.messageFormat,
    visualConcept: opts.visualConcept,
    importantVisualDetails: opts.importantVisualDetails,
    visualNotes: opts.visualNotes || "",
    style: opts.style,
    hasLogoReference: Boolean(opts.logo),
    logoWidth: opts.logo?.width,
    logoHeight: opts.logo?.height,
    topic: opts.topic,
    audience: opts.audience,
    creativeStrategy: opts.creativeStrategy,
  })

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    if (opts.logo) {
      const withLogo = await generateArtworkWithLogo(prompt, opts.logo, openai, model, quality)
      if (withLogo) return { ok: true, data: { ...withLogo, promptUsed: prompt } }
      // Do not silently fall back to text-only — that recreates the empty logo-box problem.
      return {
        ok: false,
        reason: "openai_error",
        detail: "OpenAI could not generate the graphic with your agency logo.",
      }
    }

    const artwork = await generateArtworkTextOnly(prompt, openai, model, quality)
    if (!artwork) {
      return { ok: false, reason: "openai_error", detail: "Image generation failed." }
    }
    return { ok: true, data: { ...artwork, promptUsed: prompt } }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio/generate-image] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
