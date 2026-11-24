export type EvalRecord = {
  caseId: string
  suite: string
  variant: string
  modelIdentifier: string
  promptVersion: string
  modelConfiguration: Record<string, unknown>
  durationMs: number
  tokenUsage?: {
    prompt?: number
    completion?: number
    total?: number
    cached?: number
    source: "provider" | "estimated"
  }
  costUsd?: {
    amount: number
    source: "measured" | "estimated"
  }
  qualityReview?: Record<string, unknown>
  criticalDefects: string[]
  correctionsAttempted: number
  finalStatus: "passed" | "failed" | "human_review" | "skipped" | "inspection_unavailable"
  notes?: string[]
}

export type EvalRunSummary = {
  runId: string
  startedAt: string
  finishedAt: string
  mode: "mock" | "paid"
  baselineVariant: string
  candidateVariant?: string
  records: EvalRecord[]
}
