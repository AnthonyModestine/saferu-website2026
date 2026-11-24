/**
 * Separate professional quality scoring from critical safety failures.
 * A high design/writing score must never override a critical failure.
 */

export type CriticalCheck = {
  id: string
  description: string
  failed: boolean
}

export type QualityScore = {
  /** 0–100 subjective professional quality — informational only */
  professionalScore: number
  criticalFailures: CriticalCheck[]
  noncriticalNotes: string[]
}

export function finalizeEvalStatus(score: QualityScore): {
  finalStatus: "passed" | "failed" | "human_review"
  shipable: boolean
} {
  const critical = score.criticalFailures.filter((c) => c.failed)
  if (critical.length > 0) {
    return { finalStatus: "failed", shipable: false }
  }
  if (score.professionalScore < 40) {
    return { finalStatus: "human_review", shipable: false }
  }
  return { finalStatus: "passed", shipable: true }
}

export function assertCriticalOverridesQuality(
  professionalScore: number,
  criticalFailed: boolean
): boolean {
  // Returns whether the asset may ship
  if (criticalFailed) return false
  return professionalScore >= 40
}
