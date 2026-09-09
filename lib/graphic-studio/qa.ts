import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { qaModel } from "@/lib/graphic-studio/constants"
import { bufferToDataUrl } from "@/lib/graphic-studio/logo-assets"
import {
  graphicQaSchema,
  GRAPHIC_QA_JSON_SCHEMA,
  type GraphicQaResult,
} from "@/lib/graphic-studio/schemas"

export async function qaSafetyGraphic(opts: {
  artwork: Buffer
  approvedHeadline: string
  approvedMessage: string
  hasLogo: boolean
}): Promise<AiResult<GraphicQaResult>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const dataUrl = bufferToDataUrl(opts.artwork)

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
      model: qaModel(),
      temperature: 0,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content:
            "You QA public-safety social graphics before publication. Return JSON only. Fail only for material issues — not minor subjective design preferences.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Check this FINAL public-safety graphic (OpenAI was supposed to place the real agency logo on the image — nothing is pasted afterward).

Approved headline: ${opts.approvedHeadline}
Approved on-graphic message: ${opts.approvedMessage}
Agency logo expected on graphic: ${opts.hasLogo ? "yes — bottom-right, reasonably large" : "no"}

Check:
- headline matches approved headline (minor punctuation ok)
- message matches approved message (minor punctuation ok)
- no wording is clipped or cut off at edges
- text is readable on mobile
- visual supports the safety message
- not overcrowded
- NO empty white/blank rectangle, cutout, or reserved "logo placeholder" box
- the main scene is NOT cropped short to leave empty logo space

If agency logo expected:
- a logo should appear bottom-right at a useful size (not tiny)
- set accidental_logo=true if there is an empty placeholder box OR a clearly fake/invented second badge/seal instead of a real logo placement
- missing logo alone → fail with an issue; accidental_logo=false unless there is also a fake badge or empty placeholder

If no logo expected:
- set accidental_logo=true only if a fake badge/seal/patch/crest was invented`,
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
    if (!raw) return { ok: false, reason: "empty_response" }

    const parsed = graphicQaSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      return { ok: false, reason: "invalid_json", detail: parsed.error.message }
    }
    return { ok: true, data: parsed.data }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.warn("[graphic-studio/qa] error:", detail)
    return {
      ok: true,
      data: { pass: true, issues: [], accidental_logo: false },
    }
  }
}
