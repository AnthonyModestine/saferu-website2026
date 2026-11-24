import "server-only"

import type { AiResult } from "@/lib/ai-result"
import {
  MAX_CORRECTION_ATTEMPTS,
  MAX_GENERATION_ATTEMPTS,
} from "@/lib/graphic-studio/constants"
import { generateSafetyArtwork } from "@/lib/graphic-studio/generate-image"
import {
  inspectionIsShipable,
  inspectionNeedsCorrection,
  inspectionUnavailable,
  type GraphicInspection,
} from "@/lib/graphic-studio/inspection-types"
import { loadLogoAsset, bufferToDataUrl } from "@/lib/graphic-studio/logo-assets"
import {
  buildCorrectionInstruction,
  qaSafetyGraphicInspection,
} from "@/lib/graphic-studio/qa"
import { researchSafetyGraphic } from "@/lib/graphic-studio/research"
import { reviseSafetyGraphicBuffer } from "@/lib/graphic-studio/revise-image"
import type { SafetyResearchResult } from "@/lib/graphic-studio/schemas"
import type { CreativeStrategy } from "@/lib/ai-intelligence/creative-strategy"
import { resolveImageModelAndQuality } from "@/lib/ai-config/phase2"

/** Combined end-to-end wall clock for generate + corrections (ms). */
export const GENERATION_DEADLINE_MS = 240_000

export type GeneratedSafetyGraphic = {
  imageDataUrl: string
  generationModel: string
  qaPassed: boolean
  qaIssues: string[]
  inspectionOutcome?: GraphicInspection["outcome"]
  promptUsed?: string
  correctionsAttempted?: number
  /** Internal asset retained when inspection unavailable — never ship as verified. */
  unverifiedAssetPreserved?: boolean
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
  topic?: string
  audience?: string
  creativeStrategy?: CreativeStrategy | null
  deadlineMs?: number
}): Promise<AiResult<GeneratedSafetyGraphic>> {
  const logo = await loadLogoAsset(opts.agencyLogoUrl)
  let lastIssues: string[] = []
  let lastOutcome: GraphicInspection["outcome"] | undefined
  let lastBuffer: Buffer | null = null
  let lastModel = resolveImageModelAndQuality().model
  let lastPrompt = ""
  let correctionsUsed = 0
  const started = Date.now()
  const deadlineMs = opts.deadlineMs ?? GENERATION_DEADLINE_MS

  const timeLeft = () => deadlineMs - (Date.now() - started)

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    if (timeLeft() < 15_000) break

    const artworkResult = await generateSafetyArtwork({
      approvedHeadline: opts.approvedHeadline,
      approvedMessage: opts.approvedMessage,
      messageFormat: opts.messageFormat,
      visualConcept: opts.visualConcept,
      importantVisualDetails: opts.importantVisualDetails,
      visualNotes: opts.visualNotes,
      style: opts.style,
      logo,
      topic: opts.topic,
      audience: opts.audience,
      creativeStrategy: opts.creativeStrategy,
    })
    if (!artworkResult.ok) return artworkResult

    let buffer = artworkResult.data.buffer
    lastModel = artworkResult.data.model
    lastBuffer = buffer
    lastPrompt = artworkResult.data.promptUsed

    let inspectionResult = await qaSafetyGraphicInspection({
      artwork: buffer,
      approvedHeadline: opts.approvedHeadline,
      approvedMessage: opts.approvedMessage,
      hasLogo: Boolean(logo),
    })
    if (!inspectionResult.ok) {
      return {
        ok: false,
        reason: "qa_failed",
        detail: inspectionResult.detail || "Quality inspection failed.",
      }
    }

    let inspection = inspectionResult.data
    lastIssues = inspection.issues
    lastOutcome = inspection.outcome

    while (
      inspectionNeedsCorrection(inspection) &&
      correctionsUsed < MAX_CORRECTION_ATTEMPTS &&
      timeLeft() > 20_000
    ) {
      correctionsUsed += 1
      const correction = buildCorrectionInstruction(inspection)
      console.warn(
        `[graphic-studio] Targeted correction ${correctionsUsed}/${MAX_CORRECTION_ATTEMPTS}:`,
        correction.slice(0, 240)
      )

      const revised = await reviseSafetyGraphicBuffer({
        currentBuffer: buffer,
        editRequest: correction,
        approvedHeadline: opts.approvedHeadline,
        approvedMessage: opts.approvedMessage,
        logo,
        skipQa: true,
      })
      if (!revised.ok) break

      buffer = revised.data.buffer
      lastBuffer = buffer
      lastModel = revised.data.model

      inspectionResult = await qaSafetyGraphicInspection({
        artwork: buffer,
        approvedHeadline: opts.approvedHeadline,
        approvedMessage: opts.approvedMessage,
        hasLogo: Boolean(logo),
      })
      if (!inspectionResult.ok) break
      inspection = inspectionResult.data
      lastIssues = inspection.issues
      lastOutcome = inspection.outcome
    }

    if (inspectionIsShipable(inspection)) {
      return {
        ok: true,
        data: {
          imageDataUrl: bufferToDataUrl(buffer),
          generationModel: lastModel,
          qaPassed: true,
          qaIssues: inspection.notes.length ? inspection.notes : [],
          inspectionOutcome: inspection.outcome,
          promptUsed: lastPrompt,
          correctionsAttempted: correctionsUsed,
        },
      }
    }

    if (inspectionUnavailable(inspection)) {
      console.warn(
        `[graphic-studio] QA unavailable attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}:`,
        inspection.issues.join("; ")
      )
      if (attempt < MAX_GENERATION_ATTEMPTS && timeLeft() > 30_000) continue
      break
    }

    console.warn(
      `[graphic-studio] QA failed attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}:`,
      inspection.issues.join("; ") || inspection.outcome
    )
    if (attempt < MAX_GENERATION_ATTEMPTS && timeLeft() > 30_000) continue
  }

  void lastBuffer

  if (lastOutcome === "inspection_unavailable") {
    return {
      ok: false,
      reason: "qa_failed",
      detail:
        lastIssues.join(" ") ||
        "Quality inspection was unavailable. The graphic was not released as verified.",
    }
  }

  return {
    ok: false,
    reason: "qa_failed",
    detail:
      lastIssues.join(" ") ||
      "Could not generate a graphic that passed safety and quality inspection.",
  }
}
