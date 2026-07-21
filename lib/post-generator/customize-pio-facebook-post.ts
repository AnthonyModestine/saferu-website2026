import type { AiResult } from "@/lib/ai-result"
import { z } from "zod"
import { PIO_FACEBOOK_VOICE_CONTRACT } from "@/lib/post-generator/pio-facebook-voice-contract"
import type { CustomizeMessageMode } from "@/lib/post-generator/types"
import type { PioCustomizeResult, WriterFact } from "@/lib/post-generator/pio-writer-types"

const MODE_MAP: Record<
  CustomizeMessageMode,
  { mode: string; instruction: string }
> = {
  shorten: {
    mode: "SHORTEN",
    instruction:
      "Reduce the post to approximately 55 to 70 percent of its original length. Remove repetition, background, and lower-priority wording before removing operational facts or public instructions.",
  },
  conversational: {
    mode: "MAKE_MORE_ENGAGING",
    instruction:
      "Improve the opening, local relevance, and readability. Do not use hype, fear, jokes, extra emojis, generic questions, or unsupported local claims.",
  },
  formal: {
    mode: "CHANGE_TONE",
    instruction:
      "Make the tone more formal and official, as a department spokesperson would, while preserving seriousness and accuracy.",
  },
  facebook: {
    mode: "FACEBOOK_VERSION",
    instruction:
      "Make the copy easier to read on Facebook using short paragraphs and a direct opening. Do not add social-media clichés.",
  },
  instagram: {
    mode: "FACEBOOK_VERSION",
    instruction:
      "Optimize for Instagram: strong opening line, short line breaks, still sound like a PIO. Do not add social-media clichés.",
  },
  twitter: {
    mode: "SHORTEN",
    instruction:
      "Reduce to under 280 characters while keeping the essential facts and public instruction.",
  },
  add_emojis: {
    mode: "CHANGE_TONE",
    instruction:
      "Add one or two relevant emojis sparingly where appropriate. Do not add decorative emoji strings.",
  },
  remove_emojis: {
    mode: "CHANGE_TONE",
    instruction: "Remove all emojis and keep plain professional text.",
  },
}

export const CUSTOMIZE_PIO_POST_SYSTEM_PROMPT = `${PIO_FACEBOOK_VOICE_CONTRACT}

TASK
Edit an existing agency Facebook post according to the requested mode.

You are editing, not selecting a new topic and not adding new information.

PRESERVE
- all essential verified facts;
- official status and urgency;
- dates, times, locations, names, boundaries, and instructions;
- legal meaning and attribution;
- the agency's perspective;
- the original communication goal.

DO NOT
- add facts, advice, links, phone numbers, statistics, emojis, hashtags, claims, or agency actions;
- replace specific local details with generic language;
- turn the post into a news article or press release;
- add a generic greeting, slogan, safety sign-off, or engagement bait;
- change a watch into a warning, an advisory into an order, an allegation into guilt, or a possibility into certainty.

OUTPUT
Return valid JSON only:
{
  "status": "ready" | "needs_human_review",
  "postText": "",
  "humanReviewReason": ""
}

Use an empty string when humanReviewReason does not apply.`

const customizeResponseFormat = {
  type: "json_schema" as const,
  json_schema: {
    name: "saferu_pio_customize",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "postText", "humanReviewReason"],
      properties: {
        status: { type: "string", enum: ["ready", "needs_human_review"] },
        postText: { type: "string" },
        humanReviewReason: { type: "string" },
      },
    },
  },
}

const customizeSchema = z
  .object({
    status: z.enum(["ready", "needs_human_review"]),
    postText: z.string(),
    humanReviewReason: z.string(),
  })
  .strict()

function cleanPostText(text: string): string {
  let result = text.trim()
  if (result.startsWith("```")) {
    result = result.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim()
  }
  return result
}

export async function customizePioFacebookPost(opts: {
  originalMessage: string
  mode: CustomizeMessageMode
  agencyName: string
  agencyType: string
  serviceArea: string
  voiceProfile?: string
  verifiedFacts: WriterFact[]
}): Promise<AiResult<PioCustomizeResult>> {
  const trimmed = opts.originalMessage.trim()
  if (!trimmed) return { ok: false, reason: "empty_input" }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const mapped = MODE_MAP[opts.mode]
  const prompt = `Edit this agency Facebook post.

MODE
${mapped.mode}

MODE INSTRUCTION
${mapped.instruction}

AGENCY
${JSON.stringify(
  {
    name: opts.agencyName,
    type: opts.agencyType,
    serviceArea: opts.serviceArea,
    voiceProfile: opts.voiceProfile || "",
  },
  null,
  2
)}

VERIFIED FACTS THE EDIT MUST PRESERVE
${JSON.stringify(opts.verifiedFacts, null, 2)}

ORIGINAL POST
${trimmed}

Return the required JSON only.`

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: CUSTOMIZE_PIO_POST_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: customizeResponseFormat,
      max_tokens: 800,
      temperature: 0.35,
    })
    const raw = completion.choices[0]?.message?.content
    if (!raw) return { ok: false, reason: "empty_response" }
    const parsed = customizeSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      return { ok: false, reason: "invalid_json", detail: parsed.error.message }
    }
    const postText = cleanPostText(parsed.data.postText)
    if (!postText) return { ok: false, reason: "empty_response" }
    return {
      ok: true,
      data: {
        status: parsed.data.status,
        postText,
        humanReviewReason: parsed.data.humanReviewReason.trim() || null,
      },
    }
  } catch (error) {
    return {
      ok: false,
      reason: "openai_error",
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}
