/**
 * Lean image prompt — modeled on Phase 4 / final-benchmark winning briefs.
 * Production candidate via SAFERU_AI_PRODUCTION_IMAGE_LEAN=1 or SAFERU_AI_PROMPT_MODE=lean.
 */

import type { CreativeStrategy } from "@/lib/ai-intelligence/creative-strategy"
import { validateCreativeStrategyForImage } from "@/lib/ai-intelligence/creative-strategy-guard"
import { filterEssentialSafetyConstraints } from "@/lib/graphic-studio/essential-safety-constraints"
import { productionLeanImageEnabled } from "@/lib/ai-config/production"

export const LEAN_IMAGE_PROMPT_VERSION = "lean-image-v2"

export type LeanImagePromptInput = {
  approvedHeadline: string
  approvedMessage: string
  style?: string
  visualNotes?: string
  /** Straightforward visual idea (Variant A). */
  visualIdea?: string
  /** Shared across Variant A and B for fair comparison. */
  communicationObjective?: string
  /** When present and valid, replaces visualIdea (Variant B). */
  creativeStrategy?: CreativeStrategy | null
  hasLogoReference: boolean
  canvasLabel?: string
  /** Raw research details — filtered to essential safety only. */
  importantVisualDetails?: string[]
  /** Pre-filtered constraints (used as-is when provided). */
  essentialSafetyConstraints?: string[]
}

function logoRequirement(hasLogo: boolean): string {
  return hasLogo
    ? "Preserve the supplied official agency logo without inventing or altering seals or badges. Do not add other commercial brand logos."
    : "Do not invent a fake department badge, seal, or logo. Do not add commercial brand logos or fabricated agency branding."
}

/**
 * Build a short assignment-style prompt. Omit empty optional sections.
 * Variant A vs B should differ only in VISUAL DIRECTION.
 */
export function compileLeanImagePrompt(input: LeanImagePromptInput): string {
  const validated = input.creativeStrategy
    ? validateCreativeStrategyForImage(input.creativeStrategy, {
        approvedHeadline: input.approvedHeadline,
        approvedMessage: input.approvedMessage,
      })
    : { ok: false as const, reason: "none" }

  const visualDirection = validated.ok
    ? validated.visualDirection
    : (input.visualIdea || "").trim()

  const objective = (input.communicationObjective || "").trim()
  const style = (input.style || "").trim()
  const canvas = input.canvasLabel || "2048×1152 (16:9) finished social graphic"

  const extras =
    input.essentialSafetyConstraints && input.essentialSafetyConstraints.length > 0
      ? input.essentialSafetyConstraints.filter(Boolean)
      : filterEssentialSafetyConstraints(input.importantVisualDetails, {
          customerVisualNotes: input.visualNotes,
          max: 3,
        })

  const lines: string[] = [
    "Create an exceptional professional public safety graphic suitable for publication by an official public safety agency.",
    "",
  ]

  if (objective) {
    lines.push("COMMUNICATION OBJECTIVE:", objective, "")
  }

  lines.push(
    "HEADLINE — EXACT TEXT:",
    input.approvedHeadline,
    "",
    "MESSAGE — EXACT TEXT:",
    input.approvedMessage,
    ""
  )

  if (visualDirection) {
    lines.push("VISUAL DIRECTION:", visualDirection, "")
  }

  if (style) {
    lines.push("STYLE:", style, "")
  }

  lines.push("REQUIREMENTS:")
  lines.push(
    "- Make the message immediately understandable and readable on mobile devices."
  )
  lines.push("- Preserve the exact approved wording.")
  lines.push("- Ensure safety practices and visual representations are accurate.")
  lines.push(
    "- Do not introduce unsupported information or unapproved text (including speech bubbles, phone-screen messages, slogans, URLs, or hashtags)."
  )
  lines.push(`- ${logoRequirement(input.hasLogoReference)}`)
  for (const c of extras) {
    lines.push(`- ${c}`)
  }
  lines.push("")
  lines.push("OUTPUT:", canvas)
  lines.push("")
  lines.push(
    "Exercise professional artistic judgment to create a distinctive, cohesive and visually compelling design."
  )

  return lines.join("\n")
}

/** Lean image path — prompt mode lean or production-candidate flag (research stays separately gated). */
export function leanImagePromptEnabled(): boolean {
  return productionLeanImageEnabled()
}

/** Variant A = autonomy (no strategist concept). Variant B = attach validated strategy concept. */
export function imageExecutionVariant(): "autonomy" | "creative_direction" {
  const v = process.env.SAFERU_AI_IMAGE_VARIANT?.trim().toLowerCase()
  if (v === "creative_direction" || v === "b") return "creative_direction"
  return "autonomy"
}

/** Shared communication objective for fair A/B comparison. */
export function sharedCommunicationObjective(opts: {
  strategyObjective?: string
  headline: string
  message: string
}): string {
  const fromStrategy = (opts.strategyObjective || "").trim()
  if (fromStrategy) return fromStrategy
  const first = opts.message.trim().split(/(?<=[.!?])\s+/)[0] || opts.headline
  return first.slice(0, 220)
}
