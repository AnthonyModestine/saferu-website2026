import type { AiResult } from "@/lib/ai-result"
import { z } from "zod"
import { PIO_FACEBOOK_VOICE_CONTRACT } from "@/lib/post-generator/pio-facebook-voice-contract"
import type { PioWriterResult, WriterBrief } from "@/lib/post-generator/pio-writer-types"

export const STAGE_2_SYSTEM_PROMPT = `${PIO_FACEBOOK_VOICE_CONTRACT}

TASK
Write one ready-to-publish Facebook post from the approved WriterBrief.

The topic has already been selected. Do not question the recommendation, introduce a different topic, add unrelated tips, or discuss your reasoning.

FACT IDS
Every factual statement in postText must be supported by one or more supplied verified fact IDs. Return the IDs actually used.

HUMAN REVIEW
Return status "needs_human_review" only when a missing or conflicting fact makes the post unsafe, inaccurate, legally problematic, or impossible to publish responsibly. Do not request review merely because optional context is unavailable.

OUTPUT
Return valid JSON only:
{
  "status": "ready" | "needs_human_review",
  "postText": "",
  "usedFactIds": [],
  "sourceAttribution": "",
  "humanReviewReason": ""
}

When status is "ready", postText must be complete and publishable.
When status is "needs_human_review", postText may contain the safest usable draft, but it must not contain invented placeholders or assumptions.
Use an empty string when sourceAttribution or humanReviewReason does not apply.`

export const PIO_WRITER_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "saferu_pio_writer",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "status",
        "postText",
        "usedFactIds",
        "sourceAttribution",
        "humanReviewReason",
      ],
      properties: {
        status: { type: "string", enum: ["ready", "needs_human_review"] },
        postText: { type: "string" },
        usedFactIds: { type: "array", items: { type: "string" } },
        sourceAttribution: { type: "string" },
        humanReviewReason: { type: "string" },
      },
    },
  },
}

const writerResultSchema = z
  .object({
    status: z.enum(["ready", "needs_human_review"]),
    postText: z.string(),
    usedFactIds: z.array(z.string()),
    sourceAttribution: z.string(),
    humanReviewReason: z.string(),
  })
  .strict()

function normalizeWriterResult(parsed: z.infer<typeof writerResultSchema>): PioWriterResult {
  return {
    status: parsed.status,
    postText: parsed.postText.trim(),
    usedFactIds: parsed.usedFactIds,
    sourceAttribution: parsed.sourceAttribution.trim() || null,
    humanReviewReason: parsed.humanReviewReason.trim() || null,
  }
}

/** Single shared writer for Stage 2, pipeline fallback, and Generate Post. */
export async function writePioFacebookPost(
  writerBrief: WriterBrief
): Promise<AiResult<PioWriterResult>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  if (!writerBrief.verifiedFacts.length) {
    return { ok: false, reason: "empty_input", detail: "WriterBrief has no verified facts." }
  }

  const prompt = `Write the Facebook post from this approved PIO WriterBrief.

WRITER BRIEF
${JSON.stringify(writerBrief, null, 2)}

Return the required JSON only.`

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: STAGE_2_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: PIO_WRITER_RESPONSE_FORMAT,
      max_tokens: 900,
      temperature: 0.4,
    })
    const raw = completion.choices[0]?.message?.content
    if (!raw) return { ok: false, reason: "empty_response" }
    const parsed = writerResultSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      return { ok: false, reason: "invalid_json", detail: parsed.error.message }
    }

    const validFactIds = new Set(writerBrief.verifiedFacts.map((f) => f.id))
    if (parsed.data.usedFactIds.some((id) => !validFactIds.has(id))) {
      return { ok: false, reason: "invalid_json", detail: "Writer referenced an unknown fact ID." }
    }
    if (parsed.data.status === "ready" && parsed.data.usedFactIds.length === 0) {
      return { ok: false, reason: "invalid_json", detail: "Ready draft cited no verified fact IDs." }
    }
    if (parsed.data.status === "ready" && !parsed.data.postText.trim()) {
      return { ok: false, reason: "empty_response" }
    }

    return { ok: true, data: normalizeWriterResult(parsed.data) }
  } catch (error) {
    return {
      ok: false,
      reason: "openai_error",
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}
