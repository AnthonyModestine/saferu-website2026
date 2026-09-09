import "server-only"

import { toFile } from "openai"
import type { AiResult } from "@/lib/ai-result"
import { GRAPHIC_SIZE, imageModel } from "@/lib/graphic-studio/constants"
import { loadLogoAsset, dataUrlToBuffer, bufferToDataUrl } from "@/lib/graphic-studio/logo-assets"
import { buildReviseImagePrompt } from "@/lib/graphic-studio/prompts"

const IMAGE_SIZE = GRAPHIC_SIZE as "1536x1024"

export async function reviseSafetyGraphic(opts: {
  currentImageDataUrl: string
  editRequest: string
  approvedHeadline: string
  approvedMessage: string
  agencyLogoUrl?: string | null
}): Promise<AiResult<{ imageDataUrl: string; generationModel: string }>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const editRequest = opts.editRequest.trim()
  if (editRequest.length < 4) return { ok: false, reason: "empty_input" }

  const currentBuffer = dataUrlToBuffer(opts.currentImageDataUrl)
  if (!currentBuffer) {
    return { ok: false, reason: "empty_input", detail: "Current graphic image is missing." }
  }

  const logo = await loadLogoAsset(opts.agencyLogoUrl)
  const prompt = buildReviseImagePrompt({
    editRequest,
    approvedHeadline: opts.approvedHeadline,
    approvedMessage: opts.approvedMessage,
    hasLogo: Boolean(logo),
  })

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const graphicFile = await toFile(currentBuffer, "current-graphic.png", { type: "image/png" })
    const images = [graphicFile]

    if (logo) {
      const ext = logo.mimeType.includes("jpeg") || logo.mimeType.includes("jpg") ? "jpg" : "png"
      images.push(await toFile(logo.buffer, `agency-logo.${ext}`, { type: logo.mimeType }))
    }

    const response = await openai.images.edit({
      model: imageModel(),
      image: images,
      prompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: "high",
    })

    const b64 = response.data?.[0]?.b64_json
    if (!b64) return { ok: false, reason: "empty_response" }

    return {
      ok: true,
      data: {
        imageDataUrl: bufferToDataUrl(Buffer.from(b64, "base64")),
        generationModel: `${imageModel()}+revise`,
      },
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio/revise]", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
