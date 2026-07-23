import type { AiResult } from "@/lib/ai-result"
import { z } from "zod"
import type { PioWriterResult } from "@/lib/post-generator/pio-writer-types"
import { classifyPostMessage } from "./classify"
import {
  extractPostMessagePlaceholders,
  shouldUseShortWatchScript,
} from "./extract-placeholders"
import { getMessageScript } from "./scripts"
import { POST_MESSAGE_SYSTEM_PROMPT } from "./system-prompt"
import type {
  PostMessageClassification,
  PostMessageInput,
  PostMessagePlaceholders,
} from "./types"

const writerResultSchema = z
  .object({
    status: z.enum(["ready", "needs_human_review"]),
    postText: z.string(),
    usedFactIds: z.array(z.string()),
    sourceAttribution: z.string(),
    humanReviewReason: z.string(),
  })
  .strict()

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "saferu_post_message",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["status", "postText", "usedFactIds", "sourceAttribution", "humanReviewReason"],
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

function joinList(items?: string[] | null): string | null {
  if (!items?.length) return null
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`
}

function bracketMap(placeholders: PostMessagePlaceholders): Record<string, string | null> {
  return {
    "[Agency Name]": placeholders.agencyName || null,
    "[Alert Type]": placeholders.alertType || null,
    "[Issuing Authority]": placeholders.issuingAuthority || null,
    "[Affected Area]": placeholders.affectedArea || null,
    "[Issued Time]": placeholders.issuedTime || null,
    "[Expiration Time]": placeholders.expirationTime || null,
    "[Primary Threats]": joinList(placeholders.primaryThreats),
    "[Local Impacts]": joinList(placeholders.localImpacts),
    "[Public Actions]": joinList(placeholders.publicActions),
    "[Agency Local Action]": placeholders.agencyLocalAction || null,
    "[Updated Storm Detail]": placeholders.updatedStormDetail || null,
    "[Post-Expiration Impacts]": joinList(placeholders.postExpirationImpacts),
    "[Reporting Method]": placeholders.reportingMethod || null,
    "[Reason]": placeholders.reason || null,
    "[Boil Duration]": placeholders.boilDuration || null,
    "[Unaffected Area Note]": placeholders.unaffectedAreaNote || null,
    "[Road Name]": placeholders.roadName || null,
    "[Closure Boundaries]": placeholders.closureBoundaries || null,
    "[Closure Cause]": placeholders.closureCause || null,
    "[Alternate Route]": placeholders.alternateRoute || null,
    "[Reopen Condition]": placeholders.reopenCondition || null,
    "[Partner Agencies]": joinList(placeholders.partnerAgencies),
    "[Subject Description]": placeholders.subjectDescription || placeholders.caseDetails || null,
    "[Last Known Location]": placeholders.lastKnownLocation || placeholders.affectedArea || null,
    "[Restoration Estimate]": placeholders.restorationEstimate
      ? `Restoration is estimated by ${placeholders.restorationEstimate}.`
      : null,
    "[Case Details]": placeholders.caseDetails || null,
  }
}

/** Deterministic script fill — drops lines that still contain unfilled brackets. */
export function fillScriptDeterministic(
  scriptTemplate: string,
  placeholders: PostMessagePlaceholders
): string {
  const map = bracketMap(placeholders)
  const paragraphs = scriptTemplate.split(/\n\n+/)
  const filled: string[] = []

  for (const paragraph of paragraphs) {
    let line = paragraph
    for (const [bracket, value] of Object.entries(map)) {
      if (value) line = line.replaceAll(bracket, value)
    }
    if (/\[[^\]]+\]/.test(line)) continue
    const trimmed = line.trim()
    if (trimmed) filled.push(trimmed)
  }

  return filled.join("\n\n")
}

function normalizeResult(
  parsed: z.infer<typeof writerResultSchema>,
  input: PostMessageInput
): PioWriterResult {
  return {
    status: parsed.status,
    postText: parsed.postText.trim(),
    usedFactIds: parsed.usedFactIds,
    sourceAttribution: parsed.sourceAttribution.trim() || input.issuingAuthority || null,
    humanReviewReason: parsed.humanReviewReason.trim() || null,
  }
}

export async function generatePostMessageFromInput(opts: {
  input: PostMessageInput
  classification: PostMessageClassification
  placeholders: PostMessagePlaceholders
}): Promise<AiResult<PioWriterResult>> {
  const { input, classification, placeholders } = opts
  const script = getMessageScript(classification.scriptId)

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    const fallback = fillScriptDeterministic(script.template, placeholders)
    if (!fallback.trim()) return { ok: false, reason: "missing_api_key" }
    return {
      ok: true,
      data: {
        status: "ready",
        postText: fallback,
        usedFactIds: input.verifiedFacts.map((f) => f.id),
        sourceAttribution: placeholders.issuingAuthority || null,
        humanReviewReason: null,
      },
    }
  }

  const prompt = `Write the Facebook post using the approved script and verified placeholders.

CLASSIFICATION
${JSON.stringify(classification, null, 2)}

VERIFIED PLACEHOLDERS
${JSON.stringify(placeholders, null, 2)}

VERIFIED FACTS
${JSON.stringify(input.verifiedFacts, null, 2)}

APPROVED SCRIPT (${script.label})
${script.template}

Return the required JSON only.`

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: POST_MESSAGE_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: RESPONSE_FORMAT,
      max_tokens: 900,
      temperature: 0.25,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) return deterministicFallback(input, script.template, placeholders)

    const parsed = writerResultSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return deterministicFallback(input, script.template, placeholders)

    const validIds = new Set(input.verifiedFacts.map((f) => f.id))
    if (parsed.data.usedFactIds.some((id) => !validIds.has(id))) {
      return deterministicFallback(input, script.template, placeholders)
    }
    if (parsed.data.status === "ready" && !parsed.data.postText.trim()) {
      return deterministicFallback(input, script.template, placeholders)
    }
    if (/\[[^\]]+\]/.test(parsed.data.postText)) {
      return deterministicFallback(input, script.template, placeholders)
    }

    return { ok: true, data: normalizeResult(parsed.data, input) }
  } catch (error) {
    return {
      ok: false,
      reason: "openai_error",
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}

function deterministicFallback(
  input: PostMessageInput,
  template: string,
  placeholders: PostMessagePlaceholders
): AiResult<PioWriterResult> {
  const postText = fillScriptDeterministic(template, placeholders)
  if (!postText.trim()) {
    return { ok: false, reason: "empty_response", detail: "Insufficient verified placeholders for script." }
  }
  return {
    ok: true,
    data: {
      status: "ready",
      postText,
      usedFactIds: input.verifiedFacts.map((f) => f.id),
      sourceAttribution: placeholders.issuingAuthority || null,
      humanReviewReason: null,
    },
  }
}

/** Re-classify and extract from raw input — convenience wrapper. */
export async function generatePostMessageFromInputRaw(
  input: PostMessageInput,
  serviceArea?: { city?: string; county?: string; state?: string }
): Promise<AiResult<PioWriterResult>> {
  const placeholders = extractPostMessagePlaceholders(input, serviceArea)
  const classification = classifyPostMessage(input, {
    useShortWatch: shouldUseShortWatchScript(placeholders),
  })
  return generatePostMessageFromInput({ input, classification, placeholders })
}
