/**
 * Validate creative strategies before they reach the image model.
 * Blocks stale/misleading concepts and concepts that conflict with approved copy.
 */

import type { CreativeStrategy } from "@/lib/ai-intelligence/creative-strategy"

const MISLEADING_INVISIBLE_HAZARD_RE =
  /\b(gas cloud|ghostly cloud|visible (?:gas|vapor|fog)|semi-transparent.*(?:gas|cloud)|ominous.*cloud.*(?:co|carbon)|cloud representing carbon)\b/i

/** Only fold rationale that contains a concrete visual execution instruction. */
const EXECUTION_INSTRUCTION_RE =
  /\b(avoid showing|avoid depicting|do not show|don't show|never show|must not show|must show|without (?:showing|depicting|inventing|visible)|keep text|accurately depict|correctly (?:show|depict|place))\b/i

export type StrategyValidation =
  | { ok: true; visualDirection: string; strategy: CreativeStrategy }
  | { ok: false; reason: string }

export type StrategyValidationContext = {
  approvedHeadline?: string
  approvedMessage?: string
}

/**
 * Returns a single actionable visual direction for the image model,
 * or rejects strategies that conflict with safety rules / approved copy.
 */
export function validateCreativeStrategyForImage(
  strategy: CreativeStrategy | null | undefined,
  ctx?: StrategyValidationContext
): StrategyValidation {
  if (!strategy?.primaryVisualConcept?.trim() || !strategy.selectedConceptName?.trim()) {
    return { ok: false, reason: "missing_selected_concept" }
  }

  const blob = [
    strategy.primaryVisualConcept,
    strategy.scrollStopIdea,
    strategy.dominantVisualElement,
    strategy.selectionRationale,
    ...(strategy.factualVisualDetailsRequired || []),
  ].join("\n")

  if (MISLEADING_INVISIBLE_HAZARD_RE.test(blob)) {
    return {
      ok: false,
      reason:
        "stale_or_misleading_invisible_hazard_depiction — refuse visible gas/cloud metaphors for invisible hazards",
    }
  }

  // Reject strategies that invent safety instructions absent from approved copy.
  if (ctx?.approvedMessage) {
    const inventedStat = /\b(\d{1,3}%|\d+\s*(deaths?|injuries|fatalities))\b/i.test(blob)
    const messageHasStat = /\b(\d{1,3}%|\d+\s*(deaths?|injuries|fatalities))\b/i.test(
      ctx.approvedMessage
    )
    if (inventedStat && !messageHasStat) {
      return { ok: false, reason: "strategy_introduces_unsupported_statistics" }
    }
  }

  const executionCue = extractEssentialExecutionCue(strategy.selectionRationale)
  const visualDirection = [
    strategy.primaryVisualConcept.trim(),
    executionCue ? `(${executionCue})` : "",
  ]
    .filter(Boolean)
    .join(" ")

  return { ok: true, visualDirection, strategy }
}

function extractEssentialExecutionCue(rationale: string | undefined): string {
  if (!rationale?.trim()) return ""
  const first = rationale.trim().split(/(?<=[.!?])\s+/)[0] || ""
  if (!EXECUTION_INSTRUCTION_RE.test(first)) return ""
  return first.length > 120 ? first.slice(0, 117) + "…" : first
}
