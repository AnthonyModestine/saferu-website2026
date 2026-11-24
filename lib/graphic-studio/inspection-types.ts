/**
 * Structured Graphic Studio quality inspection outcomes.
 * Critical safety/accuracy failures must never be treated as passes.
 */

export const INSPECTION_OUTCOMES = [
  "passed",
  "passed_with_notes",
  "correction_required",
  "critical_failure",
  "human_review_required",
  "inspection_unavailable",
] as const

export type InspectionOutcome = (typeof INSPECTION_OUTCOMES)[number]

export const DEFECT_SEVERITIES = ["critical", "major", "minor", "note"] as const
export type DefectSeverity = (typeof DEFECT_SEVERITIES)[number]

export const DEFECT_CATEGORIES = [
  "text_fidelity",
  "safety_accuracy",
  "agency_branding",
  "message_clarity",
  "readability",
  "composition",
  "typography",
  "visual_defect",
  "instruction_adherence",
  "other",
] as const

export type DefectCategory = (typeof DEFECT_CATEGORIES)[number]

export type InspectionDefect = {
  category: DefectCategory
  severity: DefectSeverity
  description: string
  location?: string
  observation?: string
  suggestedCorrection?: string
  confidence?: "high" | "medium" | "low"
}

export type GraphicInspection = {
  outcome: InspectionOutcome
  /** Backward-compatible boolean: true only for passed / passed_with_notes */
  pass: boolean
  accidentalLogo: boolean
  defects: InspectionDefect[]
  issues: string[]
  notes: string[]
  model: string
  inspectedAt: string
}

export function inspectionIsShipable(inspection: GraphicInspection): boolean {
  return inspection.outcome === "passed" || inspection.outcome === "passed_with_notes"
}

export function inspectionNeedsCorrection(inspection: GraphicInspection): boolean {
  return (
    inspection.outcome === "correction_required" ||
    inspection.outcome === "critical_failure"
  )
}

export function inspectionUnavailable(inspection: GraphicInspection): boolean {
  return inspection.outcome === "inspection_unavailable"
}

export function makeUnavailableInspection(model: string, detail?: string): GraphicInspection {
  return {
    outcome: "inspection_unavailable",
    pass: false,
    accidentalLogo: false,
    defects: [
      {
        category: "other",
        severity: "major",
        description: detail || "Quality inspector unavailable",
        confidence: "low",
      },
    ],
    issues: [detail || "Quality inspector unavailable"],
    notes: [],
    model,
    inspectedAt: new Date().toISOString(),
  }
}

export function makeCriticalInspection(
  model: string,
  defects: InspectionDefect[]
): GraphicInspection {
  const issues = defects.map((d) => d.description)
  return {
    outcome: "critical_failure",
    pass: false,
    accidentalLogo: defects.some((d) => d.category === "agency_branding"),
    defects,
    issues,
    notes: [],
    model,
    inspectedAt: new Date().toISOString(),
  }
}
