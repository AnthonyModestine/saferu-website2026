/**
 * Phase 3 AI intelligence configuration.
 * Experimental flags are independently selectable — do not cascade Phase 2 into Phase 3.
 */

import { phase2ConfigSnapshot } from "@/lib/ai-config/phase2"
import { productionLeanImageEnabled } from "@/lib/ai-config/production"

function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name]?.trim().toLowerCase()
  if (!raw) return defaultValue
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on"
}

/**
 * Genuine AI creative strategist inside the existing research call.
 * Independent of SAFERU_AI_CREATIVE_DIRECTION (Phase 2 deterministic brief).
 */
export function creativeStrategistEnabled(): boolean {
  return envFlag("SAFERU_AI_CREATIVE_STRATEGIST", false)
}

/** Concise optimized image prompt — independent flag (set explicitly for Phase 3 variants). */
export function optimizedImagePromptEnabled(): boolean {
  return envFlag("SAFERU_AI_OPTIMIZED_IMAGE_PROMPT", false)
}

/** Professional PIO writing standards injected into writing prompts. */
export function professionalWritingEnabled(): boolean {
  return envFlag("SAFERU_AI_PROFESSIONAL_WRITING", false)
}

/** Editorial reviewer evaluates writing craft, not only compliance. */
export function professionalEditorialEnabled(): boolean {
  return envFlag("SAFERU_AI_PROFESSIONAL_EDITORIAL", false)
}

/** Visual QA evaluates professional design quality separately from critical safety. */
export function professionalVisualQaEnabled(): boolean {
  return envFlag("SAFERU_AI_PROFESSIONAL_VISUAL_QA", false)
}

/**
 * Fail-open is never available for customer-facing Graphic Studio paths.
 * Even SAFERU_AI_ALLOW_QA_FAIL_OPEN is ignored unless SAFERU_AI_DEV_QA_FAIL_OPEN=1
 * AND NODE_ENV is not production.
 */
export function customerFacingHardQaRequired(): boolean {
  if (process.env.NODE_ENV === "production") return true
  if (envFlag("SAFERU_AI_DEV_QA_FAIL_OPEN", false)) return false
  return true
}

/** Experimental lean research prompts — not production default (original research won final blind). */
export function leanPromptsEnabled(): boolean {
  return envFlag("SAFERU_AI_LEAN_PROMPTS", false)
}

/**
 * Shadow-mode adaptive creative recommendation from research.
 * Records Variant A vs B advice; never auto-routes production traffic.
 */
export function adaptiveCreativeShadowEnabled(): boolean {
  return envFlag("SAFERU_AI_ADAPTIVE_CREATIVE_SHADOW", false)
}

/** Image execution variant when lean prompts are active. */
export function imageVariantFlag(): "autonomy" | "creative_direction" {
  const v = process.env.SAFERU_AI_IMAGE_VARIANT?.trim().toLowerCase()
  if (v === "creative_direction" || v === "b") return "creative_direction"
  return "autonomy"
}

export function phase3ConfigSnapshot() {
  const leanImage = productionLeanImageEnabled()
  const leanResearch = leanPromptsEnabled()
  return {
    ...phase2ConfigSnapshot(),
    creativeStrategist: creativeStrategistEnabled(),
    optimizedImagePrompt: optimizedImagePromptEnabled(),
    professionalWriting: professionalWritingEnabled(),
    professionalEditorial: professionalEditorialEnabled(),
    professionalVisualQa: professionalVisualQaEnabled(),
    customerFacingHardQa: customerFacingHardQaRequired(),
    leanPrompts: leanResearch,
    productionLeanImage: leanImage,
    adaptiveCreativeShadow: adaptiveCreativeShadowEnabled(),
    imageVariant: imageVariantFlag(),
    promptMode: process.env.SAFERU_AI_PROMPT_MODE?.trim() || "default",
    promptVersion: leanImage
      ? `lean-image-v2+${imageVariantFlag()}`
      : creativeStrategistEnabled()
        ? "phase3-creative-strategist-v1"
        : optimizedImagePromptEnabled()
          ? "phase3-optimized-prompt-v1"
          : phase2ConfigSnapshot().image.promptVersion,
  }
}
