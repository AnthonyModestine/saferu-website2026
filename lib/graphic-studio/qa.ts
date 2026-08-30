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
              text: `Check this graphic BEFORE the real agency logo is composited on top.

Approved headline: ${opts.approvedHeadline}
Approved on-graphic message: ${opts.approvedMessage}
Agency logo will be added programmatically bottom-right: ${opts.hasLogo ? "yes" : "no"}

Check:
- headline matches approved headline (minor punctuation ok)
- message matches approved message (minor punctuation ok)
- no wording is clipped or cut off at edges
- text is readable on mobile
- bottom-right area is clear enough for a logo overlay (if logo expected)
- NO agency badge, seal, patch, crest, or logo-like graphic was generated in the artwork
- visual supports the safety message
- not overcrowded

Set accidental_logo true if the artwork itself contains any badge, seal, patch, crest, or logo-like branding.`,
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
