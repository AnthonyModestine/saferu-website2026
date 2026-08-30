import "server-only"

import type { AiResult } from "@/lib/ai-result"
import { parseModelJson } from "@/lib/parse-model-json"
import { researchModel } from "@/lib/graphic-studio/constants"
import { buildResearchPrompt } from "@/lib/graphic-studio/prompts"
import {
  SAFETY_RESEARCH_JSON_SCHEMA,
  safetyResearchSchema,
  type SafetyResearchResult,
} from "@/lib/graphic-studio/schemas"

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

async function researchViaResponsesApi(
  prompt: string,
  openai: InstanceType<(typeof import("openai"))["default"]>
): Promise<AiResult<SafetyResearchResult>> {
  const response = await openai.responses.create({
    model: researchModel(),
    tools: [{ type: "web_search_preview" }],
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "safety_graphic_research",
        schema: SAFETY_RESEARCH_JSON_SCHEMA,
        strict: true,
      },
    },
  })

  const raw = extractResponsesText(response)
  if (!raw) return { ok: false, reason: "empty_response" }

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, reason: "invalid_json", detail: "Research response was not JSON." }
  }

  const parsed = safetyResearchSchema.safeParse(json)
  if (!parsed.success) {
    return { ok: false, reason: "invalid_json", detail: parsed.error.message }
  }
  return { ok: true, data: parsed.data }
}

async function researchViaSearchChat(
  prompt: string,
  openai: InstanceType<(typeof import("openai"))["default"]>
): Promise<AiResult<SafetyResearchResult>> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini-search-preview",
    web_search_options: { search_context_size: "high" },
    messages: [
      {
        role: "system",
        content:
          "You are a public-safety content editor. Research the topic with web search, then return ONLY valid JSON matching the requested schema. No prose outside JSON.",
      },
      { role: "user", content: prompt },
    ],
  })

  const raw = completion.choices?.[0]?.message?.content?.trim()
  if (!raw) return { ok: false, reason: "empty_response" }

  const json = parseModelJson<Record<string, unknown>>(raw)
  if (!json) return { ok: false, reason: "invalid_json" }

  const parsed = safetyResearchSchema.safeParse(json)
  if (!parsed.success) {
    return { ok: false, reason: "invalid_json", detail: parsed.error.message }
  }
  return { ok: true, data: parsed.data }
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

  const prompt = buildResearchPrompt({
    category: opts.category,
    topic: opts.topic,
    audience: opts.audience,
    style: opts.style,
    visualNotes: opts.visualNotes?.trim() || "",
  })

  try {
    const { default: OpenAI } = await import("openai")
    const openai = new OpenAI({ apiKey })

    try {
      return await researchViaResponsesApi(prompt, openai)
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      console.warn("[graphic-studio/research] responses API failed, falling back:", detail)
      return await researchViaSearchChat(prompt, openai)
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error("[graphic-studio/research] error:", detail)
    return { ok: false, reason: "openai_error", detail }
  }
}
