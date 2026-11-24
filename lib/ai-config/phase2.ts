/**
 * Phase 2 AI intelligence configuration.
 * Production defaults preserve baseline behavior except for hard QA safety fixes
 * (fail-open removal is always on — critical reliability).
 *
 * Experimental creative/model settings are OFF unless env flags enable them.
 */

export type ImageQualityTier = "high" | "xhigh" | "max" | "medium" | "low" | "auto"

export type ImageExperimentVariant =
  | "baseline"
  | "sunburst25_xhigh"
  | "sunburst26_high"
  | "sunburst26_xhigh"

function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name]?.trim().toLowerCase()
  if (!raw) return defaultValue
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on"
}

function envString(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback
}

/** Always-on reliability: never treat QA API failure as pass. */
export function hardGraphicQaEnabled(): boolean {
  return !envFlag("SAFERU_AI_ALLOW_QA_FAIL_OPEN", false)
}

/** Structured creative brief compiled into image prompts. */
export function creativeDirectionEnabled(): boolean {
  return envFlag("SAFERU_AI_CREATIVE_DIRECTION", false)
}

/** Style-specific guidance packs (experimental — off by default for baseline rollback). */
export function styleGuidanceEnabled(): boolean {
  return envFlag("SAFERU_AI_STYLE_GUIDANCE", false) || creativeDirectionEnabled()
}

/** Experimental image model/quality variant (never silently becomes default). */
export function imageExperimentVariant(): ImageExperimentVariant {
  const raw = envString("SAFERU_AI_IMAGE_EXPERIMENT", "baseline")
  if (
    raw === "sunburst25_xhigh" ||
    raw === "sunburst26_high" ||
    raw === "sunburst26_xhigh"
  ) {
    return raw
  }
  return "baseline"
}

export function resolveImageModelAndQuality(): {
  model: string
  quality: ImageQualityTier
  variant: ImageExperimentVariant
  promptVersion: string
} {
  const variant = imageExperimentVariant()
  const baselineModel =
    process.env.OPENAI_GRAPHIC_IMAGE_MODEL?.trim() || "gpt-image-2.5-sunburst"

  switch (variant) {
    case "sunburst25_xhigh":
      return {
        model: envString("OPENAI_GRAPHIC_IMAGE_MODEL", "gpt-image-2.5-sunburst"),
        quality: "xhigh",
        variant,
        promptVersion: "phase2-image-v1",
      }
    case "sunburst26_high":
      return {
        model: "gpt-image-2.6-sunburst",
        quality: "high",
        variant,
        promptVersion: "phase2-image-v1",
      }
    case "sunburst26_xhigh":
      return {
        model: "gpt-image-2.6-sunburst",
        quality: "xhigh",
        variant,
        promptVersion: "phase2-image-v1",
      }
    default:
      return {
        model: baselineModel,
        quality: "high",
        variant: "baseline",
        promptVersion: "baseline-image-v0",
      }
  }
}

/** Stronger multimodal QA model behind flag (default remains gpt-4o-mini via qaModel()). */
export function experimentalQaModel(): string | null {
  if (!envFlag("SAFERU_AI_QA_STRONG", false)) return null
  return envString("OPENAI_GRAPHIC_QA_STRONG_MODEL", "gpt-4.1")
}

/** Press Center editorial gate model upgrade behind flag. */
export function experimentalPressGateModel(): string | null {
  if (!envFlag("SAFERU_AI_PRESS_GATE_STRONG", false)) return null
  return envString("OPENAI_PRESS_GATE_MODEL", "gpt-4.1")
}

/** Spanish bilingual review behind flag. */
export function spanishReviewEnabled(): boolean {
  return envFlag("SAFERU_AI_SPANISH_REVIEW", false)
}

/**
 * Press Center experiment variant (draft/gate routing).
 * baseline = current gpt-4o-mini draft + gate
 * gate_strong = same draft, stronger editorial gate (SAFERU_AI_PRESS_GATE_STRONG)
 * draft_strong = stronger primary writer (requires OPENAI_PRESS_DRAFT_MODEL)
 * plan_then_write = structured intent plan then write (SAFERU_AI_PRESS_PLAN=1)
 */
export type PressExperimentVariant = "baseline" | "gate_strong" | "draft_strong" | "plan_then_write"

export function pressExperimentVariant(): PressExperimentVariant {
  const raw = envString("SAFERU_AI_PRESS_EXPERIMENT", "baseline")
  if (raw === "gate_strong" || raw === "draft_strong" || raw === "plan_then_write") {
    return raw
  }
  return "baseline"
}

export function experimentalPressDraftModel(): string | null {
  if (pressExperimentVariant() !== "draft_strong" && !envFlag("SAFERU_AI_PRESS_DRAFT_STRONG", false)) {
    return null
  }
  return envString("OPENAI_PRESS_DRAFT_MODEL", "gpt-4.1")
}

export function pressCommunicationPlanEnabled(): boolean {
  return (
    pressExperimentVariant() === "plan_then_write" || envFlag("SAFERU_AI_PRESS_PLAN", false)
  )
}

export function phase2ConfigSnapshot() {
  return {
    hardGraphicQa: hardGraphicQaEnabled(),
    creativeDirection: creativeDirectionEnabled(),
    styleGuidance: styleGuidanceEnabled(),
    image: resolveImageModelAndQuality(),
    experimentalQaModel: experimentalQaModel(),
    experimentalPressGateModel: experimentalPressGateModel(),
    experimentalPressDraftModel: experimentalPressDraftModel(),
    pressExperiment: pressExperimentVariant(),
    pressCommunicationPlan: pressCommunicationPlanEnabled(),
    spanishReview: spanishReviewEnabled(),
  }
}
