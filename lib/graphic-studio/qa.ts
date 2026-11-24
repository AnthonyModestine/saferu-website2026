import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { experimentalQaModel, hardGraphicQaEnabled } from "@/lib/ai-config/phase2"
import {
  customerFacingHardQaRequired,
  professionalVisualQaEnabled,
} from "@/lib/ai-config/phase3"
import { qaModel } from "@/lib/graphic-studio/constants"
import { buildCorrectionInstruction } from "@/lib/graphic-studio/qa-correction"
import { applyLogoExpectationGuards, toInspection } from "@/lib/graphic-studio/qa-normalize"
import {
  makeUnavailableInspection,
  type GraphicInspection,
} from "@/lib/graphic-studio/inspection-types"

export { buildCorrectionInstruction, toInspection }
import { bufferToDataUrl } from "@/lib/graphic-studio/logo-assets"
import {
  graphicQaSchema,
  GRAPHIC_QA_JSON_SCHEMA,
  type GraphicQaResult,
} from "@/lib/graphic-studio/schemas"

function resolveQaModel(): string {
  return experimentalQaModel() || qaModel()
}

/** @deprecated Prefer qaSafetyGraphicInspection */
export async function qaSafetyGraphic(opts: {
  artwork: Buffer
  approvedHeadline: string
  approvedMessage: string
  hasLogo: boolean
}): Promise<AiResult<GraphicQaResult>> {
  const inspection = await qaSafetyGraphicInspection(opts)
  if (!inspection.ok) return inspection
  return {
    ok: true,
    data: {
      pass: inspection.data.pass,
      issues: inspection.data.issues,
      accidental_logo: inspection.data.accidentalLogo,
      outcome: inspection.data.outcome,
      notes: inspection.data.notes,
      defects: inspection.data.defects.map((d) => ({
        category: d.category,
        severity: d.severity,
        description: d.description,
        location: d.location,
        suggestedCorrection: d.suggestedCorrection,
        confidence: d.confidence,
      })),
    },
  }
}

function qaSystemPrompt(): string {
  const base = `You QA public-safety social graphics before publication. Return JSON only.

TWO TRACKS — keep them separate:
1) MANDATORY factual/safety validation (can block publication)
2) PROFESSIONAL creative evaluation (creative_notes[] / severity note|minor only — never alone set critical_failure)

Mandatory critical (only with specific visible evidence in defects[].evidence):
- Confirmed wrong/missing approved headline or message MEANING (not minor capitalization/punctuation)
- Unsafe practice shown as recommended
- Fabricated/distorted official logo, wrong agency identity, incorrect emergency contact
- Unreadable essential approved text

Major (correction_required, not critical):
- Clipped text, overcrowding that hurts message, missing expected logo when logo required

NEVER critical:
- Subjective composition/color taste
- Artistic urgency that is not factually wrong
- Depicting a prohibited action with a clear red X / "no" symbol (that is correct education)
- Extra decorative UI text that does not contradict approved meaning (flag as major/minor if inventing new instructions)

Text extraction protocol:
- Always fill extracted_headline and extracted_message with the best reading of on-graphic approved text areas.
- Set headline_text_status / message_text_status to match|mismatch|missing|unreadable|uncertain.
- Uncertain recognition ≠ confirmed spelling failure and ≠ confirmed correct. Prefer human_review_required when uncertain about meaning.
- Minor punctuation/case differences are NOT critical mismatches.

issues[] must list ONLY real problems or empty — do not put "headline matches…" checklist affirmations in issues[].

Set pass=true ONLY for outcome passed or passed_with_notes.
Never set pass=true when accidental_logo=true or any critical defect exists.`

  if (!professionalVisualQaEnabled()) return base

  return `${base}

PROFESSIONAL DESIGN EVALUATION → creative_notes[] only (secondary)
Assess originality, storytelling, composition, typography craft, hierarchy, audience fit, impact.
Never reject an accurate, readable graphic solely for aesthetic preference.`
}

export async function qaSafetyGraphicInspection(opts: {
  artwork: Buffer
  approvedHeadline: string
  approvedMessage: string
  hasLogo: boolean
}): Promise<AiResult<GraphicInspection>> {
  const model = resolveQaModel()
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return { ok: true, data: makeUnavailableInspection(model, "OPENAI_API_KEY missing") }
  }

  const dataUrl = bufferToDataUrl(opts.artwork)

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: professionalVisualQaEnabled() ? 900 : 700,
      messages: [
        { role: "system", content: qaSystemPrompt() },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Check this FINAL public-safety graphic.

Approved headline: ${opts.approvedHeadline}
Approved on-graphic message: ${opts.approvedMessage}
Agency logo expected on graphic: ${opts.hasLogo ? "yes — bottom-right, reasonably large" : "no"}

First extract the headline and message you see into extracted_headline / extracted_message, then set *_text_status.
Then return outcome + defects[] (critical only with defects[].evidence citing what is visible).

Mandatory factual/safety checks:
- Approved headline/message meaning present and readable (minor punctuation/case ok)
- No wording of essential approved text clipped at edges
- Visual does not recommend unsafe behavior (showing unsafe action with a clear prohibition mark is OK)
- NO empty white/blank logo placeholder box
- If logo expected: real logo bottom-right; accidental_logo=true for empty placeholder OR fake invented badge
- If no logo expected: do NOT flag missing logo; accidental_logo=true only for invented agency badge/seal (airbag icons, prohibition marks, and product labels are NOT agency logos)

Put subjective design commentary only in creative_notes[].`,
            },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "graphic_qa",
          schema: GRAPHIC_QA_JSON_SCHEMA,
          strict: true,
        },
      } as never,
    })

    const raw = completion.choices?.[0]?.message?.content?.trim()
    if (!raw) {
      return { ok: true, data: makeUnavailableInspection(model, "Empty QA response") }
    }

    let json: unknown
    try {
      json = JSON.parse(raw)
    } catch {
      return {
        ok: true,
        data: makeUnavailableInspection(model, "Malformed QA JSON (parse failed)"),
      }
    }

    const parsed = graphicQaSchema.safeParse(json)
    if (!parsed.success) {
      return {
        ok: true,
        data: makeUnavailableInspection(model, `Invalid QA JSON: ${parsed.error.message}`),
      }
    }

    return {
      ok: true,
      data: applyLogoExpectationGuards(toInspection(parsed.data, model), opts.hasLogo),
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.warn("[graphic-studio/qa] error:", detail)

    // Customer-facing paths never fail-open. Dev-only escape requires explicit dual flag.
    const allowFailOpen =
      !customerFacingHardQaRequired() && !hardGraphicQaEnabled()

    if (!allowFailOpen) {
      return { ok: true, data: makeUnavailableInspection(model, detail) }
    }

    console.warn(
      "[graphic-studio/qa] DEV fail-open active — never enable in production customer paths"
    )
    return {
      ok: true,
      data: {
        outcome: "passed",
        pass: true,
        accidentalLogo: false,
        defects: [],
        issues: [],
        notes: [`Dev fail-open enabled: ${detail}`],
        model,
        inspectedAt: new Date().toISOString(),
      },
    }
  }
}
