/**
 * Estimated (not measured) OpenAI costs for planning.
 * Verify against current platform.openai.com/docs/pricing before paid runs.
 *
 * gpt-image-2.5-sunburst: text in $5/M, image in $8/M, image out $30/M (standard).
 * Exact tokens for 2048×1152 vary — treat image costs as ESTIMATED until usage is measured.
 */

export const COST_ESTIMATES_USD = {
  /** Conservative estimate per high-quality ~16:9 sunburst generation (incl. prompt tokens). */
  imageHigh: 0.28,
  /** xhigh often costs more; treat as ~1.6× until measured. */
  imageXhigh: 0.45,
  /** Vision QA gpt-4o-mini */
  qaMini: 0.02,
  /** Vision QA gpt-4.1 */
  qaStrong: 0.06,
  /** Research / creative strategist call with web search */
  researchStrategist: 0.08,
  /** Press package draft + gate (mini) */
  pressPackageMini: 0.05,
  /** Press package with strong gate */
  pressPackageStrongGate: 0.1,
  /** Spanish translation */
  translate: 0.01,
  /** Spanish + review */
  translateReview: 0.03,
} as const

export function estimateImageGen(quality: "high" | "xhigh"): number {
  return quality === "xhigh" ? COST_ESTIMATES_USD.imageXhigh : COST_ESTIMATES_USD.imageHigh
}
