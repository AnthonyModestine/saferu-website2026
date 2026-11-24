import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { creativeStrategistEnabled } from "@/lib/ai-config/phase3"
import { parseModelJson } from "@/lib/parse-model-json"
import { researchModel } from "@/lib/graphic-studio/constants"
import { buildResearchPrompt } from "@/lib/graphic-studio/prompts"
import { leanResearchPromptEnabled } from "@/lib/graphic-studio/lean-research-prompt"
import { validateCreativeStrategyForImage } from "@/lib/ai-intelligence/creative-strategy-guard"
import {
  SAFETY_RESEARCH_JSON_SCHEMA,
  SAFETY_RESEARCH_LEAN_JSON_SCHEMA,
  SAFETY_RESEARCH_LEAN_WITH_STRATEGY_JSON_SCHEMA,
  SAFETY_RESEARCH_WITH_STRATEGY_JSON_SCHEMA,
  safetyResearchSchema,
  type SafetyResearchResult,
} from "@/lib/graphic-studio/schemas"

type OpenAIClient = InstanceType<(typeof import("openai"))["default"]>

function extractResponsesText(response: {
  output?: ReadonlyArray<{
    type?: string
    content?: ReadonlyArray<{ type?: string; text?: string }>
  }>
}): string | null {
  for (const item of response.output || []) {
    if (item.type !== "message") continue
    for (const part of item.content || []) {
      if (part.type === "output_text" && part.text) return part.text
    }
  }
  return null
}

function researchJsonSchema(includeStrategist: boolean) {
  if (leanResearchPromptEnabled()) {
    return includeStrategist
      ? SAFETY_RESEARCH_LEAN_WITH_STRATEGY_JSON_SCHEMA
      : SAFETY_RESEARCH_LEAN_JSON_SCHEMA
  }
  return includeStrategist
    ? SAFETY_RESEARCH_WITH_STRATEGY_JSON_SCHEMA
    : SAFETY_RESEARCH_JSON_SCHEMA
}

function parseResearchJson(raw: string): AiResult<SafetyResearchResult> {
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    const parsed = parseModelJson<Record<string, unknown>>(raw)
    if (!parsed) return { ok: false, reason: "invalid_json", detail: "Research response was not JSON." }
    json = parsed
  }

  const result = safetyResearchSchema.safeParse(json)
  if (!result.success) {
    return { ok: false, reason: "invalid_json", detail: result.error.message }
  }

  const data = result.data

  // Drop stale/misleading creative strategies before they reach generation.
  if (data.creative_strategy) {
    const validated = validateCreativeStrategyForImage(data.creative_strategy)
    if (!validated.ok) {
      data.creative_strategy = undefined
      if (data.creative_direction_needed) {
        data.creative_direction_needed = false
        data.creative_direction_reason = `Strategy rejected (${validated.reason}); using straightforward visual idea.`
      }
    } else {
      // Selected concept replaces the original visual idea when valid.
      data.visual_concept = validated.strategy.primaryVisualConcept
    }
  }

  return { ok: true, data }
}

async function researchViaResponsesApi(
  prompt: string,
  openai: OpenAIClient,
  model: string,
  useWebSearch: boolean,
  includeStrategist: boolean
): Promise<AiResult<SafetyResearchResult>> {
  const response = await openai.responses.create({
    model,
    ...(useWebSearch ? { tools: [{ type: "web_search_preview" as const }] } : {}),
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: includeStrategist
          ? "safety_graphic_research_with_strategy"
          : "safety_graphic_research",
        schema: researchJsonSchema(includeStrategist),
        strict: true,
      },
    },
  })

  const raw = extractResponsesText(response)
  if (!raw) return { ok: false, reason: "empty_response" }
  return parseResearchJson(raw)
}

async function researchViaStructuredChat(
  prompt: string,
  openai: OpenAIClient,
  model: string,
  includeStrategist: boolean
): Promise<AiResult<SafetyResearchResult>> {
  const completion = await openai.chat.completions.create({
    model,
    temperature: includeStrategist ? 0.45 : 0.3,
    messages: [
      {
        role: "system",
        content: includeStrategist
          ? "You are a public-safety content editor AND creative strategist. Produce short official-ready headline + message (what/why/what-to-do), then a genuine creative_strategy with 2–4 distinct concept options and one selected concept. Do not invent safety facts. Return only JSON."
          : "You are a public-safety content editor. Turn the user's topic note into a short headline + on-graphic message (~25–45 words). Default message_format to paragraph — use bullets only when 2–3 distinct steps are truly needed. Every message MUST include what to do AND why it matters (consequence). Return only JSON.",
      },
      { role: "user", content: prompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: includeStrategist
          ? "safety_graphic_research_with_strategy"
          : "safety_graphic_research",
        schema: researchJsonSchema(includeStrategist),
        strict: true,
      },
    } as never,
  })

  const raw = completion.choices?.[0]?.message?.content?.trim()
  if (!raw) return { ok: false, reason: "empty_response" }
  return parseResearchJson(raw)
}

function isRetryableOpenAiError(err: unknown): boolean {
  const detail = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return (
    detail.includes("deprecated") ||
    detail.includes("404") ||
    detail.includes("not found") ||
    detail.includes("model") ||
    detail.includes("429") ||
    detail.includes("rate") ||
    detail.includes("credit")
  )
}

export async function researchSafetyGraphic(opts: {
  category: string
  topic: string
  audience: string
  style: string
  visualNotes?: string
}): Promise<AiResult<SafetyResearchResult>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { ok: false, reason: "missing_api_key" }

  const includeStrategist = creativeStrategistEnabled()
  const prompt = buildResearchPrompt({
    category: opts.category,
    topic: opts.topic,
    audience: opts.audience,
    style: opts.style,
    visualNotes: opts.visualNotes?.trim() || "",
    includeCreativeStrategist: includeStrategist,
  })

  const primary = researchModel()
  const attempts: Array<{
    label: string
    run: (openai: OpenAIClient) => Promise<AiResult<SafetyResearchResult>>
  }> = [
    {
      label: `${primary}+web_search`,
      run: (openai) =>
        researchViaResponsesApi(prompt, openai, primary, true, includeStrategist),
    },
    {
      label: "gpt-4.1+web_search",
      run: (openai) =>
        researchViaResponsesApi(prompt, openai, "gpt-4.1", true, includeStrategist),
    },
    {
      label: "gpt-4o-mini+web_search",
      run: (openai) =>
        researchViaResponsesApi(prompt, openai, "gpt-4o-mini", true, includeStrategist),
    },
    {
      label: "gpt-4o-mini",
      run: (openai) =>
        researchViaStructuredChat(prompt, openai, "gpt-4o-mini", includeStrategist),
    },
    {
      label: "gpt-4.1",
      run: (openai) => researchViaStructuredChat(prompt, openai, "gpt-4.1", includeStrategist),
    },
  ]

  let lastDetail = ""

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    for (const attempt of attempts) {
      try {
        const result = await attempt.run(openai)
        if (result.ok) return result
        lastDetail = result.detail || result.reason
        console.warn(`[graphic-studio/research] ${attempt.label} failed:`, lastDetail)
      } catch (err) {
        lastDetail = err instanceof Error ? err.message : String(err)
        if (!isRetryableOpenAiError(err)) {
          console.error(`[graphic-studio/research] ${attempt.label} error:`, lastDetail)
          return { ok: false, reason: "openai_error", detail: lastDetail }
        }
        console.warn(`[graphic-studio/research] ${attempt.label} retrying after:`, lastDetail)
      }
    }

    return { ok: false, reason: "openai_error", detail: lastDetail || "All research models failed." }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio/research] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
