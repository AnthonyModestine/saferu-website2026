import type { AiResult } from "@/lib/ai-result"
import { z } from "zod"
import type { PioReviewResult, PioWriterResult, WriterBrief } from "@/lib/post-generator/pio-writer-types"

const STAGE_3_SYSTEM_PROMPT = `You are the final PIO copy desk for a local public-safety agency.

You are reviewing an already written Facebook post. You are not creating a new post from scratch.

PRIMARY RULE
If the draft is accurate, natural, clear, correctly attributed, and suitable for the agency, return it exactly as written.

Do not rewrite a passing draft merely to use different wording.

REVIEW FOR ONLY THESE ISSUES
1. A factual statement is unsupported by the supplied verified facts.
2. The draft changes the official status, urgency, location, timing, legal meaning, or attribution.
3. The agency claims an action not supported by the facts.
4. A critical public instruction is missing, unclear, or buried.
5. The draft sounds like a reporter, marketer, generic safety bot, or press-release template instead of the agency speaking to residents.
6. The draft contains canned language, unnecessary filler, excessive headings, decorative emojis, or an inappropriate tone.
7. The draft creates a tactical, legal, privacy, medical, or public-safety risk.

EDITING LIMITS
- Make only the minimum edits required to correct a failed check.
- Do not add facts, tips, links, phone numbers, statistics, labels, emojis, hashtags, reassurance, or update promises.
- Do not make the post longer unless clarity or safety requires it.
- Preserve the writer's natural opening and paragraph structure when they work.
- Do not replace specific local wording with generic language.
- Do not turn a routine post into an alert.
- Do not turn a Facebook post into a formal news release.

OUTPUT
Return valid JSON only:
{
  "status": "approved" | "edited" | "needs_human_review",
  "finalPostText": "",
  "changed": false,
  "changeReasons": [],
  "checks": {
    "factsSupported": true,
    "statusAndUrgencyPreserved": true,
    "agencyPerspectiveCorrect": true,
    "publicActionClear": true,
    "naturalPioVoice": true,
    "safeToPublish": true
  },
  "humanReviewReason": ""
}

If all checks pass:
- status must be "approved";
- changed must be false;
- finalPostText must exactly equal the submitted draft.

If a correctable check fails:
- status must be "edited";
- changed must be true;
- changeReasons must identify only the concrete corrections made.

If the issue cannot be fixed without inventing or confirming facts:
- status must be "needs_human_review".

Use an empty string when humanReviewReason does not apply.`

export const PIO_REVIEW_RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "saferu_pio_review",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "status",
        "finalPostText",
        "changed",
        "changeReasons",
        "checks",
        "humanReviewReason",
      ],
      properties: {
        status: { type: "string", enum: ["approved", "edited", "needs_human_review"] },
        finalPostText: { type: "string" },
        changed: { type: "boolean" },
        changeReasons: { type: "array", items: { type: "string" } },
        checks: {
          type: "object",
          additionalProperties: false,
          required: [
            "factsSupported",
            "statusAndUrgencyPreserved",
            "agencyPerspectiveCorrect",
            "publicActionClear",
            "naturalPioVoice",
            "safeToPublish",
          ],
          properties: {
            factsSupported: { type: "boolean" },
            statusAndUrgencyPreserved: { type: "boolean" },
            agencyPerspectiveCorrect: { type: "boolean" },
            publicActionClear: { type: "boolean" },
            naturalPioVoice: { type: "boolean" },
            safeToPublish: { type: "boolean" },
          },
        },
        humanReviewReason: { type: "string" },
      },
    },
  },
}

const reviewResultSchema = z
  .object({
    status: z.enum(["approved", "edited", "needs_human_review"]),
    finalPostText: z.string(),
    changed: z.boolean(),
    changeReasons: z.array(z.string()),
    checks: z.object({
      factsSupported: z.boolean(),
      statusAndUrgencyPreserved: z.boolean(),
      agencyPerspectiveCorrect: z.boolean(),
      publicActionClear: z.boolean(),
      naturalPioVoice: z.boolean(),
      safeToPublish: z.boolean(),
    }),
    humanReviewReason: z.string(),
  })
  .strict()

export async function reviewPioFacebookPost(
  writerBrief: WriterBrief,
  draft: PioWriterResult
): Promise<AiResult<PioReviewResult>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const prompt = `Review this Facebook post using the supplied WriterBrief.

WRITER BRIEF
${JSON.stringify(writerBrief, null, 2)}

DRAFT
${draft.postText}

USED FACT IDS
${JSON.stringify(draft.usedFactIds)}

Return the required JSON only.`

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: STAGE_3_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: PIO_REVIEW_RESPONSE_FORMAT,
      max_tokens: 1200,
      temperature: 0.15,
    })
    const raw = completion.choices[0]?.message?.content
    if (!raw) return { ok: false, reason: "empty_response" }
    const parsed = reviewResultSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      return { ok: false, reason: "invalid_json", detail: parsed.error.message }
    }

    const data = parsed.data
    if (
      data.status === "approved" &&
      data.changed === false &&
      data.finalPostText !== draft.postText
    ) {
      data.finalPostText = draft.postText
    }

    return {
      ok: true,
      data: {
        status: data.status,
        finalPostText: data.finalPostText.trim(),
        changed: data.changed,
        changeReasons: data.changeReasons,
        checks: data.checks,
        humanReviewReason: data.humanReviewReason.trim() || null,
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
