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
      temperature: 0.55,
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

const CAPTION_SYSTEM = `You are a social media guru who helps public safety agencies (police, fire, EMS, emergency management, and local government) educate their communities on a wide variety of safety topics.

Your job is to write the Facebook/Instagram caption that accompanies a safety graphic — the post text residents will read in their feed.

Write captions that are:
- Strong and eye-catching — stop the scroll without clickbait or fearmongering
- Clear about WHAT the issue/hazard is
- Clear about HOW to resolve it / what residents should do
- Personal when it fits — like the agency wrote it themselves for their own community (warm, human, credible), not generic corporate PSA copy

Rules:
- Stay faithful to the graphic's approved headline and on-graphic message. Do not invent laws, stats, penalties, or new tips.
- If an agency name is provided, write in that agency's voice and name them naturally when it helps. If not, use a neutral official agency voice — never invent a department name.
- Mobile-friendly short paragraphs (usually 2–4 sentences for a default caption).
- Zero or one emoji max. No hashtag stuffing. No empty closers like "Stay safe!" or "Safety starts with you."
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

  const agency = opts.agencyName?.trim() || "(agency name not provided — write in a natural local public-safety voice)"
  return completeCaption(
    CAPTION_SYSTEM,
    `Create a ready-to-post social media caption for this safety graphic.

Agency: ${agency}
Topic notes: ${opts.topic || "(none)"}
On-graphic headline: ${opts.headline}
On-graphic message: ${opts.message}

Make it strong and eye-catching. Make sure a resident instantly understands the issue and how to handle it. When it fits, make it feel personal — like this agency wrote it for their own community.`
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
    `Revise this social caption for the same safety graphic. Keep the social-media-guru voice: strong, eye-catching, clear on the issue and the fix, and personal when it fits.

Adjust: ${adjustInstruction(opts.mode)}

Agency: ${agency}
On-graphic headline: ${opts.headline}
On-graphic message: ${opts.message}

Current caption:
${opts.caption}

Keep the same facts. Return ONLY the revised caption.`
  )
}
