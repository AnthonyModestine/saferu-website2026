import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { researchModel } from "@/lib/graphic-studio/constants"
import {
  type CaptionAdjustMode,
} from "@/lib/graphic-studio/caption-adjust"

export type { CaptionAdjustMode } from "@/lib/graphic-studio/caption-adjust"
export {
  CAPTION_ADJUST_MODES,
  CAPTION_ADJUST_LABELS,
  isCaptionAdjustMode,
} from "@/lib/graphic-studio/caption-adjust"

function adjustInstruction(mode: CaptionAdjustMode): string {
  switch (mode) {
    case "shorter":
      return "Make it noticeably shorter while keeping the key safety action and agency voice. Aim for ~2 short sentences."
    case "longer":
      return "Add one short useful sentence of context or a clearer next step. Do not ramble or add unverified claims."
    case "more_urgent":
      return "Increase urgency and clarity without fearmongering, clickbait, or exaggerated claims."
    case "calmer":
      return "Soften the tone — steady, reassuring, still clear about what residents should do."
    case "more_formal":
      return "Make the tone more formal and official for a government/public-safety account."
    case "stronger_cta":
      return "Strengthen the call to action so residents know exactly what to do next. Keep it to one clear CTA."
  }
}

async function completeCaption(
  system: string,
  user: string
): Promise<AiResult<string>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: researchModel(),
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    })
    const text = completion.choices?.[0]?.message?.content?.trim()
    if (!text) return { ok: false, reason: "empty_response" }
    return { ok: true, data: text.replace(/^["']|["']$/g, "").trim() }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio/social-caption]", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}

const CAPTION_SYSTEM = `You write Facebook/Instagram captions for official U.S. public-safety agencies (police, fire, EMS, emergency management, local government).

Rules:
- Professional PIO voice. Calm, clear, credible.
- Residents must understand the hazard and what to do.
- Match the graphic's approved headline/message — do not invent laws, stats, penalties, or new tips.
- Short paragraphs for mobile (usually 2–3 sentences for a default caption).
- Zero or one emoji max. No hashtag stuffing. No "Stay safe!" filler closers.
- If an agency name is provided, attribute the post naturally to that agency. If not, write in neutral agency voice without inventing a department name.
- Return ONLY the caption text — no quotes, labels, or commentary.`

export async function generateSafetySocialCaption(opts: {
  topic: string
  headline: string
  message: string
  agencyName?: string
}): Promise<AiResult<string>> {
  if (!opts.headline.trim() || !opts.message.trim()) {
    return { ok: false, reason: "empty_input" }
  }

  const agency = opts.agencyName?.trim() || "(agency name not provided — use neutral official voice)"
  return completeCaption(
    CAPTION_SYSTEM,
    `Write a ready-to-post social caption to accompany this safety graphic.

Agency: ${agency}
Topic notes: ${opts.topic || "(none)"}
On-graphic headline: ${opts.headline}
On-graphic message: ${opts.message}

Default length: about 2–4 short sentences. Lead with the safety point, then what residents should do.`
  )
}

export async function adjustSafetySocialCaption(opts: {
  caption: string
  mode: CaptionAdjustMode
  headline: string
  message: string
  agencyName?: string
}): Promise<AiResult<string>> {
  if (!opts.caption.trim()) return { ok: false, reason: "empty_input" }

  const agency = opts.agencyName?.trim() || "(agency name not provided)"
  return completeCaption(
    CAPTION_SYSTEM,
    `Revise this social caption for the same safety graphic.

Adjust: ${adjustInstruction(opts.mode)}

Agency: ${agency}
On-graphic headline: ${opts.headline}
On-graphic message: ${opts.message}

Current caption:
${opts.caption}

Keep the same facts. Return ONLY the revised caption.`
  )
}
