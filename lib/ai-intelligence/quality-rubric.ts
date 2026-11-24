/**
 * SaferU professional quality rubric — separates critical failures from subjective quality.
 */

export type GraphicRubricDimension =
  | "immediate_comprehension"
  | "professional_visual_quality"
  | "creative_concept"
  | "originality"
  | "visual_appeal"
  | "typography"
  | "mobile_readability"
  | "safety_accuracy"
  | "brand_integrity"
  | "publication_readiness"

export type WritingRubricDimension =
  | "communication_effectiveness"
  | "professional_judgment"
  | "natural_writing"
  | "factual_accuracy"
  | "clarity"
  | "agency_voice"
  | "appropriate_sensitivity"
  | "platform_suitability"
  | "editing_effort"
  | "publication_readiness"

export const GRAPHIC_CRITICAL_FAILURES = [
  "Incorrect or missing approved headline/message meaning",
  "Unsafe behavior depicted as recommended",
  "Incorrect agency name or fabricated/distorted official logo",
  "Incorrect emergency contact information",
  "Misleading incident imagery",
  "Unreadable essential text",
  "Missing required safety depiction when the concept depends on it",
] as const

export const WRITING_CRITICAL_FAILURES = [
  "Fabricated or unsupported facts",
  "Protected-person identification risk",
  "Material contradiction with publicationFacts",
  "Incorrect emergency instructions",
  "Implied guilt/outcome beyond supplied facts",
] as const

export type RubricScore = {
  dimension: string
  score: 1 | 2 | 3 | 4 | 5
  notes?: string
}

export function shipableDespiteQuality(
  criticalFailuresPresent: boolean,
  averageQualityScore: number
): boolean {
  if (criticalFailuresPresent) return false
  return averageQualityScore >= 3
}

export const BLIND_REVIEW_INSTRUCTIONS = `
Blind human review protocol:
1. Hide variant labels (baseline vs candidate).
2. Present side-by-side outputs with identical facts/copy constraints.
3. Score rubric dimensions 1–5 independently.
4. Mark critical failures yes/no before assigning quality scores.
5. Prefer publication-readiness and editing effort over aesthetic preference alone.
`
