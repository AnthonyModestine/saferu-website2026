/**
 * Final production AI configuration after blind-reviewed experiments.
 *
 * Demonstrated via actual output reviews (directional, small-n):
 * - Lean image briefs (lean-image-v2)
 * - Autonomy default; creative_direction optional when concepts differ
 * - Original research prompt (outperformed lean research)
 * - Professional writing instructions
 * - Tip-line / claim grounding
 * - Fail-closed QA + logo-expectation guards
 *
 * Still experimental / shadow-only:
 * - Adaptive creative auto-routing
 * - Lean research prompts
 * - Editorial rewriting
 * - Hybrid text-free typography
 * - Phase 2 deterministic creative briefs / optimized image lectures
 *
 * Nothing here deploys itself — operators must set Vercel env vars.
 */

function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name]?.trim().toLowerCase()
  if (!raw) return defaultValue
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on"
}

/** Production candidate: lean image compiler (final blind winners used this structure). */
export function productionLeanImageEnabled(): boolean {
  const mode = process.env.SAFERU_AI_PROMPT_MODE?.trim().toLowerCase() || ""
  if (mode === "lean") return true
  return envFlag("SAFERU_AI_PRODUCTION_IMAGE_LEAN", false)
}

/**
 * Exact recommended Vercel production values.
 * Does not mutate process.env.
 */
export function recommendedProductionAiEnv(): Record<string, string> {
  return {
    // --- required for lean image production path ---
    SAFERU_AI_PRODUCTION_IMAGE_LEAN: "1",
    SAFERU_AI_PROMPT_MODE: "lean",
    SAFERU_AI_IMAGE_VARIANT: "autonomy",

    // --- writing: preserve existing production writing; professional writing available separately ---
    SAFERU_AI_PROFESSIONAL_WRITING: "0",
    SAFERU_AI_PROFESSIONAL_EDITORIAL: "0",

    // --- keep complex / superseded image architectures off ---
    SAFERU_AI_CREATIVE_DIRECTION: "0",
    SAFERU_AI_STYLE_GUIDANCE: "0",
    SAFERU_AI_OPTIMIZED_IMAGE_PROMPT: "0",
    SAFERU_AI_TEXT_FREE_ARTWORK: "0",
    SAFERU_AI_IMAGE_EXPERIMENT: "baseline",

    // --- research: original family (do not enable lean research) ---
    SAFERU_AI_LEAN_PROMPTS: "0",

    // --- strategist available in code; off by default (opt-in rollout) ---
    SAFERU_AI_CREATIVE_STRATEGIST: "0",

    // --- adaptive shadow OFF when lean research + strategist are off (no recommendation source) ---
    SAFERU_AI_ADAPTIVE_CREATIVE_SHADOW: "0",

    // --- QA: never fail-open in production ---
    SAFERU_AI_ALLOW_QA_FAIL_OPEN: "0",
    SAFERU_AI_DEV_QA_FAIL_OPEN: "0",
    SAFERU_AI_QA_STRONG: "0",
    SAFERU_AI_PROFESSIONAL_VISUAL_QA: "0",

    // --- press experiment knobs stay baseline ---
    SAFERU_AI_PRESS_EXPERIMENT: "baseline",
    SAFERU_AI_PRESS_PLAN: "0",
    SAFERU_AI_PRESS_GATE_STRONG: "0",
    SAFERU_AI_PRESS_DRAFT_STRONG: "0",
    SAFERU_AI_SPANISH_REVIEW: "0",
  }
}

/** Variables that must stay disabled / unset in production. */
export function productionDisabledAiEnv(): string[] {
  return [
    "SAFERU_AI_LEAN_PROMPTS",
    "SAFERU_AI_CREATIVE_DIRECTION",
    "SAFERU_AI_STYLE_GUIDANCE",
    "SAFERU_AI_OPTIMIZED_IMAGE_PROMPT",
    "SAFERU_AI_TEXT_FREE_ARTWORK",
    "SAFERU_AI_PROFESSIONAL_EDITORIAL",
    "SAFERU_AI_ALLOW_QA_FAIL_OPEN",
    "SAFERU_AI_DEV_QA_FAIL_OPEN",
    "SAFERU_AI_CREATIVE_STRATEGIST", // keep code; enable only for controlled creative_direction rollout
  ]
}

/**
 * Full inventory for operators.
 * status: required | recommended | disabled | experimental | superseded | infrastructure
 */
export function aiEnvInventory(): Array<{
  name: string
  status: "required" | "recommended" | "disabled" | "experimental" | "superseded" | "infrastructure"
  productionValue: string
  notes: string
}> {
  return [
    {
      name: "OPENAI_API_KEY",
      status: "infrastructure",
      productionValue: "(secret)",
      notes: "Required for all AI features",
    },
    {
      name: "OPENAI_GRAPHIC_IMAGE_MODEL",
      status: "recommended",
      productionValue: "gpt-image-2.5-sunburst",
      notes: "Default if unset",
    },
    {
      name: "OPENAI_GRAPHIC_RESEARCH_MODEL",
      status: "recommended",
      productionValue: "gpt-4.1",
      notes: "Default if unset",
    },
    {
      name: "OPENAI_GRAPHIC_QA_MODEL",
      status: "recommended",
      productionValue: "gpt-4o-mini",
      notes: "Default if unset",
    },
    {
      name: "SAFERU_AI_PRODUCTION_IMAGE_LEAN",
      status: "required",
      productionValue: "1",
      notes: "Enables lean-image-v2 production path",
    },
    {
      name: "SAFERU_AI_PROMPT_MODE",
      status: "required",
      productionValue: "lean",
      notes: "Must be lean — not phase2/phase3/concise/original/generic",
    },
    {
      name: "SAFERU_AI_IMAGE_VARIANT",
      status: "required",
      productionValue: "autonomy",
      notes: "Default autonomy; creative_direction is optional controlled rollout",
    },
    {
      name: "SAFERU_AI_PROFESSIONAL_WRITING",
      status: "experimental",
      productionValue: "0",
      notes: "Available for separate evaluation; staging keeps existing writing config",
    },
    {
      name: "SAFERU_AI_ADAPTIVE_CREATIVE_SHADOW",
      status: "disabled",
      productionValue: "0",
      notes: "No-op when lean research and creative strategist are both off",
    },
    {
      name: "SAFERU_AI_IMAGE_EXPERIMENT",
      status: "recommended",
      productionValue: "baseline",
      notes: "Do not use sunburst26_* experiments in production yet",
    },
    {
      name: "SAFERU_AI_LEAN_PROMPTS",
      status: "disabled",
      productionValue: "0",
      notes: "Lean research lost blind comparison",
    },
    {
      name: "SAFERU_AI_CREATIVE_STRATEGIST",
      status: "experimental",
      productionValue: "0",
      notes: "Code retained; enable only with IMAGE_VARIANT=creative_direction for controlled tests",
    },
    {
      name: "SAFERU_AI_CREATIVE_DIRECTION",
      status: "superseded",
      productionValue: "0",
      notes: "Phase 2 deterministic brief — lean path ignores; keep off",
    },
    {
      name: "SAFERU_AI_STYLE_GUIDANCE",
      status: "superseded",
      productionValue: "0",
      notes: "Phase 2 style packs — keep off",
    },
    {
      name: "SAFERU_AI_OPTIMIZED_IMAGE_PROMPT",
      status: "superseded",
      productionValue: "0",
      notes: "Long optimized compiler — superseded by lean-image-v2",
    },
    {
      name: "SAFERU_AI_TEXT_FREE_ARTWORK",
      status: "experimental",
      productionValue: "0",
      notes: "Hybrid typography — keep experimental",
    },
    {
      name: "SAFERU_AI_PROFESSIONAL_EDITORIAL",
      status: "disabled",
      productionValue: "0",
      notes: "Editorial rewriter not proven factually reliable",
    },
    {
      name: "SAFERU_AI_ALLOW_QA_FAIL_OPEN",
      status: "disabled",
      productionValue: "0",
      notes: "Never enable in production",
    },
    {
      name: "SAFERU_AI_DEV_QA_FAIL_OPEN",
      status: "disabled",
      productionValue: "0",
      notes: "Dev-only escape; ignored in NODE_ENV=production",
    },
    {
      name: "SAFERU_AI_QA_STRONG",
      status: "experimental",
      productionValue: "0",
      notes: "Larger QA model not proven more accurate",
    },
    {
      name: "SAFERU_AI_PROFESSIONAL_VISUAL_QA",
      status: "experimental",
      productionValue: "0",
      notes: "Subjective design notes; keep off until calibrated",
    },
    {
      name: "SAFERU_AI_PRESS_EXPERIMENT",
      status: "recommended",
      productionValue: "baseline",
      notes: "Press pipeline baseline",
    },
    {
      name: "SAFERU_AI_PRESS_PLAN",
      status: "experimental",
      productionValue: "0",
      notes: "Optional press planning agent",
    },
    {
      name: "SAFERU_AI_PRESS_GATE_STRONG",
      status: "experimental",
      productionValue: "0",
      notes: "Stronger press gate model",
    },
    {
      name: "SAFERU_AI_PRESS_DRAFT_STRONG",
      status: "experimental",
      productionValue: "0",
      notes: "Stronger press draft model",
    },
    {
      name: "SAFERU_AI_SPANISH_REVIEW",
      status: "experimental",
      productionValue: "0",
      notes: "Optional Spanish review pass",
    },
  ]
}

export type ProductionConfigCheck = {
  ok: boolean
  leanImageActive: boolean
  complexImageArchitectureBlocked: boolean
  leanResearchDisabled: boolean
  editorialDisabled: boolean
  failOpenDisabled: boolean
  issues: string[]
}

/** Validate current process.env against production safety rules (for staging checks). */
export function validateProductionAiConfig(
  env: NodeJS.ProcessEnv = process.env
): ProductionConfigCheck {
  const issues: string[] = []
  const mode = (env.SAFERU_AI_PROMPT_MODE || "").trim().toLowerCase()
  const leanFlag = ["1", "true", "yes", "on"].includes(
    (env.SAFERU_AI_PRODUCTION_IMAGE_LEAN || "").trim().toLowerCase()
  )
  const leanImageActive = mode === "lean" || leanFlag

  if (!leanImageActive) {
    issues.push("Lean image path is not active (set SAFERU_AI_PRODUCTION_IMAGE_LEAN=1 and SAFERU_AI_PROMPT_MODE=lean)")
  }
  if (mode && mode !== "lean" && leanFlag) {
    // leanImagePromptEnabled still wins via production flag, but mode should match for clarity
    issues.push(`PROMPT_MODE=${mode} conflicts with production lean — set SAFERU_AI_PROMPT_MODE=lean`)
  }
  for (const [key, bad] of [
    ["SAFERU_AI_CREATIVE_DIRECTION", "1"],
    ["SAFERU_AI_OPTIMIZED_IMAGE_PROMPT", "1"],
    ["SAFERU_AI_LEAN_PROMPTS", "1"],
    ["SAFERU_AI_PROFESSIONAL_EDITORIAL", "1"],
    ["SAFERU_AI_TEXT_FREE_ARTWORK", "1"],
    ["SAFERU_AI_ALLOW_QA_FAIL_OPEN", "1"],
    ["SAFERU_AI_DEV_QA_FAIL_OPEN", "1"],
  ] as const) {
    const v = (env[key] || "").trim().toLowerCase()
    if (v === bad || v === "true" || v === "yes" || v === "on") {
      issues.push(`${key} must be disabled in production (currently enabled)`)
    }
  }
  if ((env.SAFERU_AI_IMAGE_VARIANT || "autonomy").trim().toLowerCase() === "creative_direction") {
    // Allowed only as controlled rollout — warn, not hard fail
    issues.push(
      "SAFERU_AI_IMAGE_VARIANT=creative_direction is a controlled rollout setting, not the default autonomy path"
    )
  }

  const complexBlocked =
    !["1", "true", "yes", "on"].includes((env.SAFERU_AI_CREATIVE_DIRECTION || "").toLowerCase()) &&
    !["1", "true", "yes", "on"].includes((env.SAFERU_AI_OPTIMIZED_IMAGE_PROMPT || "").toLowerCase()) &&
    mode !== "phase2" &&
    mode !== "phase3" &&
    mode !== "concise"

  return {
    ok: issues.filter((i) => !i.includes("controlled rollout")).length === 0 && leanImageActive,
    leanImageActive,
    complexImageArchitectureBlocked: complexBlocked,
    leanResearchDisabled: !["1", "true", "yes", "on"].includes(
      (env.SAFERU_AI_LEAN_PROMPTS || "").toLowerCase()
    ),
    editorialDisabled: !["1", "true", "yes", "on"].includes(
      (env.SAFERU_AI_PROFESSIONAL_EDITORIAL || "").toLowerCase()
    ),
    failOpenDisabled:
      !["1", "true", "yes", "on"].includes((env.SAFERU_AI_ALLOW_QA_FAIL_OPEN || "").toLowerCase()) &&
      !["1", "true", "yes", "on"].includes((env.SAFERU_AI_DEV_QA_FAIL_OPEN || "").toLowerCase()),
    issues,
  }
}

export function productionReadinessNotes(): string[] {
  return [
    "Image: lean-image-v2 is the production candidate (demonstrated in blind review).",
    "Default image variant: autonomy. Creative strategist remains optional/controlled.",
    "Adaptive shadow disabled while lean research + strategist are off (no recommendation source).",
    "Research: original prompt family (lean research disabled).",
    "Writing: preserve existing production writing; professional writing stays opt-in for separate eval.",
    "Captions: existing /caption + generate caption workflow — not research social_caption pipeline.",
    "Preserve fail-closed QA, approved text fidelity, logo integrity, tip-line grounding, customer approval.",
    "Corrections stay internal to one reservation — no extra customer credits per correction attempt.",
    "Quality metrics: structured logs + optional Postgres; never block generations.",
  ]
}

/** Customer-facing AI feature → primary modules (regression map). */
export const PRODUCTION_AI_FEATURE_MAP = [
  {
    feature: "Graphic Studio — research / prepare message",
    routes: ["POST /api/pio/graphic-studio/prepare-message"],
    modules: ["lib/graphic-studio/research.ts", "lib/graphic-studio/prompts.ts"],
    productionNotes: "Original research prompt (LEAN_PROMPTS=0)",
  },
  {
    feature: "Graphic Studio — image generation",
    routes: ["POST /api/pio/graphic-studio/generate"],
    modules: ["lib/graphic-studio/generate.ts", "lib/graphic-studio/lean-image-prompt.ts"],
    productionNotes: "lean-image-v2 + autonomy; credits via reserve/settle/abandon",
  },
  {
    feature: "Graphic Studio — revisions",
    routes: ["POST /api/pio/graphic-studio/revise"],
    modules: ["lib/graphic-studio/revise-image.ts"],
    productionNotes: "Unaffected by lean research; uses edit path",
  },
  {
    feature: "Graphic Studio — social captions",
    routes: ["POST /api/pio/graphic-studio/caption", "POST /api/pio/graphic-studio/generate"],
    modules: ["lib/graphic-studio/social-caption.ts"],
    productionNotes: "Existing caption workflow retained; research social_caption not customer-facing",
  },
  {
    feature: "Press releases / Press Center package",
    routes: ["POST /api/pio/generate-press-release", "POST /api/pio/generate-all", "POST /api/pio/generate-post-package"],
    modules: ["lib/press-release-ai.ts", "lib/multi-output-ai.ts", "lib/ai-intelligence/pio-writing.ts"],
    productionNotes: "Professional writing flag; editorial off; voice memory preserved",
  },
  {
    feature: "Facebook / X / talking points",
    routes: ["POST /api/pio/generate-all", "POST /api/pio/generate-post-package"],
    modules: ["lib/multi-output-ai.ts", "lib/post-generator-ai.ts"],
    productionNotes: "Claim grounding + tip-line normalization apply",
  },
  {
    feature: "Spanish communications",
    routes: ["POST /api/pio/translate"],
    modules: ["lib/pio-translate-ai.ts"],
    productionNotes: "SAFERU_AI_SPANISH_REVIEW optional; default off",
  },
  {
    feature: "Event communications",
    routes: ["POST /api/pio/generate-event-posts", "POST /api/pio/generate-event-cancellation"],
    modules: ["lib/multi-output-ai.ts"],
    productionNotes: "Unrelated to graphic lean image path",
  },
  {
    feature: "Community Request",
    routes: ["POST /api/pio/generate-community-request"],
    modules: ["lib/community-request-ai.ts"],
    productionNotes: "Unrelated to graphic lean image path",
  },
  {
    feature: "Customize message / local ideas / holidays",
    routes: ["POST /api/pio/customize-message", "POST /api/pio/local-ideas", "POST /api/pio/holiday-content"],
    modules: ["lib/local-ideas-ai.ts", "lib/pio-holiday-image-ai.ts"],
    productionNotes: "Token gate + auth preserved",
  },
  {
    feature: "Agency voice memory",
    routes: ["POST /api/pio/voice-memory"],
    modules: ["lib/agency-voice-memory.ts", "lib/post-generator/post-message/voice-memory"],
    productionNotes: "Subordinate to factual accuracy / claim grounding",
  },
] as const
