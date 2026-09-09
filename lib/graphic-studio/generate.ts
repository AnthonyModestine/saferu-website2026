import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { MAX_GENERATION_ATTEMPTS } from "@/lib/graphic-studio/constants"
import { generateSafetyArtwork } from "@/lib/graphic-studio/generate-image"
import { loadLogoAsset, bufferToDataUrl } from "@/lib/graphic-studio/logo-assets"
import { qaSafetyGraphic } from "@/lib/graphic-studio/qa"
import { researchSafetyGraphic } from "@/lib/graphic-studio/research"
import type { SafetyResearchResult } from "@/lib/graphic-studio/schemas"

export type GeneratedSafetyGraphic = {
  imageDataUrl: string
  generationModel: string
  qaPassed: boolean
  qaIssues: string[]
}

export { researchSafetyGraphic, type SafetyResearchResult }

export async function generateSafetyGraphic(opts: {
  approvedHeadline: string
  approvedMessage: string
  messageFormat?: string
  visualConcept: string
  importantVisualDetails: string[]
  visualNotes?: string
  style: string
  agencyLogoUrl?: string | null
}): Promise<AiResult<GeneratedSafetyGraphic>> {
  const logo = await loadLogoAsset(opts.agencyLogoUrl)
  let lastIssues: string[] = []
  let lastModel = imageModelLabel()

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    const artworkResult = await generateSafetyArtwork({
      approvedHeadline: opts.approvedHeadline,
      approvedMessage: opts.approvedMessage,
      messageFormat: opts.messageFormat,
      visualConcept: opts.visualConcept,
      importantVisualDetails: opts.importantVisualDetails,
      visualNotes: opts.visualNotes,
      style: opts.style,
      logo,
    })
    if (!artworkResult.ok) return artworkResult

    lastModel = artworkResult.data.model

    const qaResult = await qaSafetyGraphic({
      artwork: artworkResult.data.buffer,
      approvedHeadline: opts.approvedHeadline,
      approvedMessage: opts.approvedMessage,
      hasLogo: Boolean(logo),
    })

    const qa = qaResult.ok ? qaResult.data : { pass: true, issues: [], accidental_logo: false }
    lastIssues = qa.issues

    // accidental_logo = empty placeholder box OR fake invented badge (not the real attached logo)
    if (!qa.pass || qa.accidental_logo) {
      console.warn(
        `[graphic-studio] QA failed attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}:`,
        qa.issues.join("; ") || "logo placeholder / fake branding"
      )
      if (attempt < MAX_GENERATION_ATTEMPTS) continue
    }

    return {
      ok: true,
      data: {
        imageDataUrl: bufferToDataUrl(artworkResult.data.buffer),
        generationModel: lastModel,
        qaPassed: qa.pass && !qa.accidental_logo,
        qaIssues: lastIssues,
      },
    }
  }

  return {
    ok: false,
    reason: "openai_error",
    detail: lastIssues.join(" ") || "Could not generate an acceptable graphic.",
  }
}

function imageModelLabel(): string {
  return process.env.OPENAI_GRAPHIC_IMAGE_MODEL?.trim() || "gpt-image-2"
}
