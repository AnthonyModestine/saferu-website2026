import "server-only"

import { toFile } from "openai"
import type { AiResult } from "@/lib/ai-result"
import { GRAPHIC_SIZE, imageModel } from "@/lib/graphic-studio/constants"
import { buildImagePrompt } from "@/lib/graphic-studio/prompts"
import { createBlankCanvasBuffer, type LogoAsset } from "@/lib/graphic-studio/logo-assets"

/** gpt-image-2.5-sunburst supports 2048x1152; OpenAI SDK types may lag behind. */
const IMAGE_SIZE = GRAPHIC_SIZE as "1536x1024"

type GeneratedArtwork = { buffer: Buffer; model: string }

async function generateArtworkTextOnly(
  prompt: string,
  openai: InstanceType<(typeof import("openai"))["default"]>
): Promise<GeneratedArtwork | null> {
  try {
    const response = await openai.images.generate({
      model: imageModel(),
      prompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: "high",
    })
    const b64 = response.data?.[0]?.b64_json
    if (!b64) return null
    return { buffer: Buffer.from(b64, "base64"), model: `${imageModel()}+generate` }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.warn("[graphic-studio/generate-image] images.generate failed:", detail)
    return null
  }
}

async function generateArtworkWithLogo(
  prompt: string,
  logo: LogoAsset,
  openai: InstanceType<(typeof import("openai"))["default"]>
): Promise<GeneratedArtwork | null> {
  try {
    // Blank 16:9 canvas + real agency logo. OpenAI must place the logo ON the graphic
    // (scale only) — we no longer paste a logo afterward.
    const canvas = await createBlankCanvasBuffer()
    const canvasFile = await toFile(canvas, "canvas.png", { type: "image/png" })
    const ext = logo.mimeType.includes("jpeg") || logo.mimeType.includes("jpg") ? "jpg" : "png"
    const logoFile = await toFile(logo.buffer, `agency-logo.${ext}`, { type: logo.mimeType })

    const response = await openai.images.edit({
      model: imageModel(),
      image: [canvasFile, logoFile],
      prompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: "high",
    })
    const b64 = response.data?.[0]?.b64_json
    if (!b64) return null
    return { buffer: Buffer.from(b64, "base64"), model: `${imageModel()}+edit+logo` }
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
}): Promise<AiResult<GeneratedArtwork>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

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
  })

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    if (opts.logo) {
      const withLogo = await generateArtworkWithLogo(prompt, opts.logo, openai)
      if (withLogo) return { ok: true, data: withLogo }
      // Do not silently fall back to text-only — that recreates the empty logo-box problem.
      return {
        ok: false,
        reason: "openai_error",
        detail: "OpenAI could not generate the graphic with your agency logo.",
      }
    }

    const artwork = await generateArtworkTextOnly(prompt, openai)
    if (!artwork) {
      return { ok: false, reason: "openai_error", detail: "Image generation failed." }
    }
    return { ok: true, data: artwork }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio/generate-image] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
