/**
 * Pure correction-instruction helper (no OpenAI / server-only).
 * Kept separate so unit tests can import without loading qa.ts server-only.
 */

import type { GraphicInspection } from "@/lib/graphic-studio/inspection-types"

export function buildCorrectionInstruction(inspection: GraphicInspection): string {
  const parts = inspection.defects
    .filter((d) => d.severity === "critical" || d.severity === "major")
    .map((d) => {
      const fix = d.suggestedCorrection ? ` Fix: ${d.suggestedCorrection}` : ""
      return `- ${d.description}${fix}`
    })
  if (!parts.length && inspection.issues.length) {
    return `Fix these QA issues while preserving the rest of the graphic:\n${inspection.issues
      .map((i) => `- ${i}`)
      .join("\n")}`
  }
  return `Fix these QA issues while preserving the rest of the graphic:\n${parts.join("\n")}`
}
