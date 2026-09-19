/** Extract billed token counts from OpenAI chat/completions (and similar) usage objects. */

export type OpenAIUsageLike = {
  prompt_tokens?: number | null
  completion_tokens?: number | null
  total_tokens?: number | null
  input_tokens?: number | null
  output_tokens?: number | null
} | null | undefined

export function tokensFromOpenAIUsage(usage: OpenAIUsageLike): number {
  if (!usage) return 0
  if (typeof usage.total_tokens === "number" && usage.total_tokens > 0) {
    return Math.floor(usage.total_tokens)
  }
  const prompt = usage.prompt_tokens ?? usage.input_tokens ?? 0
  const completion = usage.completion_tokens ?? usage.output_tokens ?? 0
  const sum = (typeof prompt === "number" ? prompt : 0) + (typeof completion === "number" ? completion : 0)
  return Math.max(0, Math.floor(sum))
}

/** Fallback estimates when a provider response omits usage (e.g. some image paths). */
export const TOKEN_ESTIMATES = {
  pressReleasePackage: 12_000,
  communityRequest: 8_000,
  eventPosts: 15_000,
  eventCancellation: 4_000,
  generateAll: 20_000,
  graphicStudioPrepare: 6_000,
  graphicStudioImage: 8_000,
  graphicStudioCaption: 2_000,
  graphicStudioRevise: 8_000,
} as const

export function tokensOrEstimate(actual: number | undefined | null, estimate: number): number {
  if (typeof actual === "number" && actual > 0) return Math.floor(actual)
  return Math.max(1, Math.floor(estimate))
}
