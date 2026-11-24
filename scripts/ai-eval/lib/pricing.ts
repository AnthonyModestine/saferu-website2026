/**
 * Conservative cost estimators for Phase 4.
 * ESTIMATED vs MEASURED are always labeled separately in reports.
 *
 * gpt-image-2.5-sunburst (docs): text in $5/M, image in $8/M, image out $30/M.
 * Exact 2048×1152 token counts vary — use conservative ceilings for budgeting.
 */

export const CONSERVATIVE_USD = {
  researchCopy: 0.12,
  creativeStrategy: 0.1,
  imageGenerateHigh: 0.55,
  qaMini: 0.03,
  qaStrong: 0.08,
  writingGeneric: 0.04,
  writingSaferuPackage: 0.07,
} as const

/** Approximate measured image cost from usage when present. */
export function measureImageCostUsd(usage: {
  input_tokens?: number
  output_tokens?: number
  input_tokens_details?: { image_tokens?: number; text_tokens?: number }
} | null | undefined): number | undefined {
  if (!usage) return undefined
  const textIn = usage.input_tokens_details?.text_tokens ?? 0
  const imageIn = usage.input_tokens_details?.image_tokens ?? 0
  const out = usage.output_tokens ?? 0
  if (!textIn && !imageIn && !out) return undefined
  const usd = (textIn / 1e6) * 5 + (imageIn / 1e6) * 8 + (out / 1e6) * 30
  return Number(usd.toFixed(4))
}

export function measureChatCostUsd(usage: {
  prompt_tokens?: number
  completion_tokens?: number
} | null | undefined, model: "mini" | "strong" = "mini"): number | undefined {
  if (!usage) return undefined
  const pin = usage.prompt_tokens || 0
  const cout = usage.completion_tokens || 0
  if (!pin && !cout) return undefined
  // Approximate: gpt-4o-mini ~$0.15/$0.60 per M; gpt-4.1 higher
  const rates =
    model === "strong"
      ? { in: 2.0, out: 8.0 }
      : { in: 0.15, out: 0.6 }
  return Number(((pin / 1e6) * rates.in + (cout / 1e6) * rates.out).toFixed(4))
}
