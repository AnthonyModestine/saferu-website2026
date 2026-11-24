/**
 * Lightweight selector: Native AI design vs Hybrid text overlay vs Accuracy-first.
 * Does not replace the production design system — advisory routing for experiments.
 */

export type GraphicExecutionMode = "native_ai" | "hybrid" | "accuracy_first"

export type ExecutionStrategyInput = {
  challenge?: string
  topic?: string
  headline: string
  message: string
  requiresExactContacts?: boolean
  requiresExactLogo?: boolean
  technicalEquipmentCritical?: boolean
  priorNativeTextFailure?: boolean
  /** When true, prefer native if copy is short even when logo required. */
  preferNativeWhenExcellent?: boolean
}

export type ExecutionStrategyDecision = {
  mode: GraphicExecutionMode
  rationale: string
  onGraphicText: { headline: string; message: string | null }
  captionSuggested: string | null
}

const SHORT_HEADLINE_WORDS = 8
const SHORT_MESSAGE_WORDS = 22

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Split locked customer copy into on-graphic essentials vs caption support.
 * Never silently changes wording — only recommends placement.
 */
export function partitionApprovedCopy(headline: string, message: string): {
  onGraphicHeadline: string
  onGraphicMessage: string | null
  captionRemainder: string | null
  reason: string
} {
  const hw = wordCount(headline)
  const mw = wordCount(message)
  if (mw <= SHORT_MESSAGE_WORDS && hw <= SHORT_HEADLINE_WORDS) {
    return {
      onGraphicHeadline: headline,
      onGraphicMessage: message,
      captionRemainder: null,
      reason: "Headline + message short enough for native/hybrid on-graphic placement",
    }
  }
  // Prefer keeping the first instructional sentence on-graphic when long.
  const sentences = message.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length >= 2 && wordCount(sentences[0]) <= SHORT_MESSAGE_WORDS) {
    return {
      onGraphicHeadline: headline,
      onGraphicMessage: sentences[0],
      captionRemainder: sentences.slice(1).join(" "),
      reason:
        "Message exceeds comfortable on-graphic length; keep lead instruction on graphic, remainder in caption (owner must approve split)",
    }
  }
  return {
    onGraphicHeadline: headline,
    onGraphicMessage: message,
    captionRemainder: null,
    reason:
      "Message is long but cannot be split cleanly without owner approval — keep full text; prefer hybrid rendering",
  }
}

export function selectGraphicExecutionStrategy(
  input: ExecutionStrategyInput
): ExecutionStrategyDecision {
  const partition = partitionApprovedCopy(input.headline, input.message)
  const mw = wordCount(input.message)
  const challenge = (input.challenge || "").toLowerCase()

  if (
    input.technicalEquipmentCritical ||
    challenge.includes("accuracy_critical") ||
    challenge.includes("equipment")
  ) {
    // Accuracy-first is only "ready" when validated assets exist — callers should check
    // accuracyFirstReady(). We still recommend the mode so the product can prompt for assets.
    return {
      mode: "accuracy_first",
      rationale:
        "Technically complex safety equipment/practices — use genuinely validated visual assets when available; do not assume constrained generation is correct",
      onGraphicText: {
        headline: partition.onGraphicHeadline,
        message: partition.onGraphicMessage,
      },
      captionSuggested: partition.captionRemainder,
    }
  }

  if (
    input.priorNativeTextFailure ||
    input.requiresExactContacts ||
    mw > SHORT_MESSAGE_WORDS ||
    (input.requiresExactLogo && mw > 16 && !input.preferNativeWhenExcellent)
  ) {
    return {
      mode: "hybrid",
      rationale:
        "Text-heavy, exact contacts, or prior native typography failures — generate distinctive artwork (not a stock template), then composite exact approved text and official logo",
      onGraphicText: {
        headline: partition.onGraphicHeadline,
        message: partition.onGraphicMessage,
      },
      captionSuggested: partition.captionRemainder,
    }
  }

  return {
    mode: "native_ai",
    rationale:
      "Short headline/message and conceptual topic — native AI design remains available when it can produce excellent integrated results",
    onGraphicText: {
      headline: partition.onGraphicHeadline,
      message: partition.onGraphicMessage,
    },
    captionSuggested: partition.captionRemainder,
  }
}
