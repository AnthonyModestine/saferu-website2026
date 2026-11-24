import "server-only"

import { toFile } from "openai"
import type { AiResult } from "@/lib/ai-result"
import { resolveImageModelAndQuality } from "@/lib/ai-config/phase2"
import { GRAPHIC_SIZE } from "@/lib/graphic-studio/constants"
import {
  inspectionIsShipable,
  inspectionUnavailable,
  type GraphicInspection,
} from "@/lib/graphic-studio/inspection-types"
import {
  loadLogoAsset,
  dataUrlToBuffer,
  bufferToDataUrl,
  type LogoAsset,
} from "@/lib/graphic-studio/logo-assets"
import { buildReviseImagePrompt } from "@/lib/graphic-studio/prompts"
import { qaSafetyGraphicInspection } from "@/lib/graphic-studio/qa"

/** gpt-image-2.5-sunburst supports 2048x1152; OpenAI SDK types may lag behind. */
const IMAGE_SIZE = GRAPHIC_SIZE as "1536x1024"

export type RevisedSafetyGraphic = {
  imageDataUrl: string
  generationModel: string
  qaPassed: boolean
  qaIssues: string[]
  inspectionOutcome?: GraphicInspection["outcome"]
}

export async function reviseSafetyGraphicBuffer(opts: {
  currentBuffer: Buffer
  editRequest: string
  approvedHeadline: string
  approvedMessage: string
  logo?: LogoAsset | null
  skipQa?: boolean
}): Promise<AiResult<{ buffer: Buffer; model: string }>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const editRequest = opts.editRequest.trim()
  if (editRequest.length < 4) return { ok: false, reason: "empty_input" }

  const { model, quality } = resolveImageModelAndQuality()
  const prompt = buildReviseImagePrompt({
    editRequest,
    approvedHeadline: opts.approvedHeadline,
    approvedMessage: opts.approvedMessage,
    hasLogo: Boolean(opts.logo),
  })

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    // Prefer PNG bytes — avoid re-encoding JPEG when the buffer is already PNG.
    const graphicFile = await toFile(opts.currentBuffer, "current-graphic.png", {
      type: "image/png",
    })
    const images = [graphicFile]

    if (opts.logo) {
      const ext =
        opts.logo.mimeType.includes("jpeg") || opts.logo.mimeType.includes("jpg")
          ? "jpg"
          : "png"
      images.push(
        await toFile(opts.logo.buffer, `agency-logo.${ext}`, { type: opts.logo.mimeType })
      )
    }

    const response = await openai.images.edit({
      model,
      image: images,
      prompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: quality as "high",
    })

    const b64 = response.data?.[0]?.b64_json
    if (!b64) return { ok: false, reason: "empty_response" }

    return {
      ok: true,
      data: {
        buffer: Buffer.from(b64, "base64"),
        model: `${model}+revise`,
      },
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio/revise]", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

export async function reviseSafetyGraphic(opts: {
  currentImageDataUrl: string
  editRequest: string
  approvedHeadline: string
  approvedMessage: string
  agencyLogoUrl?: string | null
}): Promise<AiResult<RevisedSafetyGraphic>> {
  const editRequest = opts.editRequest.trim()
  if (editRequest.length < 4) return { ok: false, reason: "empty_input" }

  const currentBuffer = dataUrlToBuffer(opts.currentImageDataUrl)
  if (!currentBuffer) {
    return { ok: false, reason: "empty_input", detail: "Current graphic image is missing." }
  }

  const logo = await loadLogoAsset(opts.agencyLogoUrl)
  const revised = await reviseSafetyGraphicBuffer({
    currentBuffer,
    editRequest,
    approvedHeadline: opts.approvedHeadline,
    approvedMessage: opts.approvedMessage,
    logo,
  })
  if (!revised.ok) return revised

  const inspectionResult = await qaSafetyGraphicInspection({
    artwork: revised.data.buffer,
    approvedHeadline: opts.approvedHeadline,
    approvedMessage: opts.approvedMessage,
    hasLogo: Boolean(logo),
  })
  if (!inspectionResult.ok) {
    return {
      ok: false,
      reason: "qa_failed",
      detail: inspectionResult.detail || "Revised graphic could not be inspected.",
    }
  }

  const inspection = inspectionResult.data

  if (inspectionUnavailable(inspection)) {
    return {
      ok: false,
      reason: "qa_failed",
      detail:
        inspection.issues.join(" ") ||
        "Quality inspection was unavailable after revision. Graphic was not released as verified.",
    }
  }

  if (!inspectionIsShipable(inspection)) {
    return {
      ok: false,
      reason: "qa_failed",
      detail:
        inspection.issues.join(" ") ||
        "Revised graphic failed safety/quality inspection.",
    }
  }

  return {
    ok: true,
    data: {
      imageDataUrl: bufferToDataUrl(revised.data.buffer),
      generationModel: revised.data.model,
      qaPassed: true,
      qaIssues: inspection.notes.length ? inspection.notes : [],
      inspectionOutcome: inspection.outcome,
    },
  }
}
