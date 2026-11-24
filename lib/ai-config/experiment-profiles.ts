/**
 * Independently selectable experiment profiles for Phase 4 A/B testing.
 * applyExperimentProfile() clears cascading flags so only the intended knobs are on.
 */

export type ExperimentProfileId =
  | "generic"
  | "original_saferu"
  | "phase2_deterministic"
  | "phase3_strategist"
  | "concise_prompt"
  | "hybrid_text_free"
  | "lean_autonomy"
  | "lean_creative_direction"
  | "lean_research_only"
  | "writing_baseline"
  | "writing_professional"
  | "writing_professional_editorial"
  | "qa_mini"
  | "qa_strong"

const FLAG_KEYS = [
  "SAFERU_AI_CREATIVE_DIRECTION",
  "SAFERU_AI_STYLE_GUIDANCE",
  "SAFERU_AI_CREATIVE_STRATEGIST",
  "SAFERU_AI_OPTIMIZED_IMAGE_PROMPT",
  "SAFERU_AI_PROFESSIONAL_WRITING",
  "SAFERU_AI_PROFESSIONAL_EDITORIAL",
  "SAFERU_AI_PROFESSIONAL_VISUAL_QA",
  "SAFERU_AI_QA_STRONG",
  "SAFERU_AI_PRESS_GATE_STRONG",
  "SAFERU_AI_PRESS_DRAFT_STRONG",
  "SAFERU_AI_PRESS_PLAN",
  "SAFERU_AI_PRESS_EXPERIMENT",
  "SAFERU_AI_IMAGE_EXPERIMENT",
  "SAFERU_AI_PROMPT_MODE",
  "SAFERU_AI_TEXT_FREE_ARTWORK",
  "SAFERU_AI_SPANISH_REVIEW",
  "SAFERU_AI_LEAN_PROMPTS",
  "SAFERU_AI_IMAGE_VARIANT",
  "SAFERU_AI_ADAPTIVE_CREATIVE_SHADOW",
  "SAFERU_AI_PRODUCTION_IMAGE_LEAN",
] as const

export type AppliedProfile = {
  id: ExperimentProfileId
  description: string
  env: Record<string, string>
}

function clearExperimentEnv(): void {
  for (const key of FLAG_KEYS) {
    delete process.env[key]
  }
  // Keep hard QA on; never enable fail-open during eval
  delete process.env.SAFERU_AI_ALLOW_QA_FAIL_OPEN
  delete process.env.SAFERU_AI_DEV_QA_FAIL_OPEN
  process.env.SAFERU_AI_IMAGE_EXPERIMENT = "baseline"
}

function setEnv(map: Record<string, string>): void {
  for (const [k, v] of Object.entries(map)) {
    process.env[k] = v
  }
}

export function applyExperimentProfile(id: ExperimentProfileId): AppliedProfile {
  clearExperimentEnv()

  const profiles: Record<ExperimentProfileId, { description: string; env: Record<string, string> }> =
    {
      generic: {
        description: "Generic AI — reasonable straightforward image prompt",
        env: { SAFERU_AI_PROMPT_MODE: "generic", SAFERU_AI_IMAGE_EXPERIMENT: "baseline" },
      },
      original_saferu: {
        description: "Original SaferU image prompt (pre Phase 2/3 creative enhancements)",
        env: { SAFERU_AI_PROMPT_MODE: "original", SAFERU_AI_IMAGE_EXPERIMENT: "baseline" },
      },
      phase2_deterministic: {
        description: "Phase 2 deterministic creative brief + style guidance (no AI strategist)",
        env: {
          SAFERU_AI_PROMPT_MODE: "phase2",
          SAFERU_AI_CREATIVE_DIRECTION: "1",
          SAFERU_AI_STYLE_GUIDANCE: "1",
          SAFERU_AI_IMAGE_EXPERIMENT: "baseline",
        },
      },
      phase3_strategist: {
        description: "Phase 3 AI creative strategist + optimized prompt compilation",
        env: {
          SAFERU_AI_PROMPT_MODE: "phase3",
          SAFERU_AI_CREATIVE_STRATEGIST: "1",
          SAFERU_AI_OPTIMIZED_IMAGE_PROMPT: "1",
          SAFERU_AI_IMAGE_EXPERIMENT: "baseline",
        },
      },
      concise_prompt: {
        description: "Experimental concise image prompt (Phase 6) — not production default",
        env: {
          SAFERU_AI_PROMPT_MODE: "concise",
          SAFERU_AI_CREATIVE_STRATEGIST: "1",
          SAFERU_AI_IMAGE_EXPERIMENT: "baseline",
        },
      },
      hybrid_text_free: {
        description: "Experimental hybrid: text-free artwork + deterministic typography later",
        env: {
          SAFERU_AI_PROMPT_MODE: "concise",
          SAFERU_AI_TEXT_FREE_ARTWORK: "1",
          SAFERU_AI_CREATIVE_STRATEGIST: "1",
          SAFERU_AI_IMAGE_EXPERIMENT: "baseline",
        },
      },
      lean_autonomy: {
        description: "Lean image Variant A — maximum model autonomy (no strategist concept)",
        env: {
          SAFERU_AI_PROMPT_MODE: "lean",
          SAFERU_AI_LEAN_PROMPTS: "1",
          SAFERU_AI_IMAGE_VARIANT: "autonomy",
          SAFERU_AI_ADAPTIVE_CREATIVE_SHADOW: "1",
          SAFERU_AI_IMAGE_EXPERIMENT: "baseline",
        },
      },
      lean_creative_direction: {
        description: "Lean image Variant B — concise creative strategist concept",
        env: {
          SAFERU_AI_PROMPT_MODE: "lean",
          SAFERU_AI_LEAN_PROMPTS: "1",
          SAFERU_AI_CREATIVE_STRATEGIST: "1",
          SAFERU_AI_IMAGE_VARIANT: "creative_direction",
          SAFERU_AI_ADAPTIVE_CREATIVE_SHADOW: "1",
          SAFERU_AI_IMAGE_EXPERIMENT: "baseline",
        },
      },
      lean_research_only: {
        description: "Lean research/copy prompt only — isolate writing from image A/B",
        env: {
          SAFERU_AI_LEAN_PROMPTS: "1",
          SAFERU_AI_CREATIVE_STRATEGIST: "1",
          SAFERU_AI_ADAPTIVE_CREATIVE_SHADOW: "1",
          SAFERU_AI_PROMPT_MODE: "generic",
          SAFERU_AI_IMAGE_EXPERIMENT: "baseline",
        },
      },
      writing_baseline: {
        description: "SaferU writing pipeline baseline (facts + gate, no craft addenda)",
        env: {
          SAFERU_AI_PRESS_EXPERIMENT: "baseline",
          SAFERU_AI_IMAGE_EXPERIMENT: "baseline",
        },
      },
      writing_professional: {
        description: "Professional writing instructions only",
        env: {
          SAFERU_AI_PROFESSIONAL_WRITING: "1",
          SAFERU_AI_PRESS_EXPERIMENT: "baseline",
        },
      },
      writing_professional_editorial: {
        description: "Professional writing + editorial craft review",
        env: {
          SAFERU_AI_PROFESSIONAL_WRITING: "1",
          SAFERU_AI_PROFESSIONAL_EDITORIAL: "1",
          SAFERU_AI_PRESS_EXPERIMENT: "baseline",
        },
      },
      qa_mini: {
        description: "Default visual QA model (gpt-4o-mini)",
        env: { SAFERU_AI_IMAGE_EXPERIMENT: "baseline" },
      },
      qa_strong: {
        description: "Stronger multimodal visual QA",
        env: { SAFERU_AI_QA_STRONG: "1", SAFERU_AI_PROFESSIONAL_VISUAL_QA: "1" },
      },
    }

  const profile = profiles[id]
  setEnv(profile.env)
  return { id, description: profile.description, env: { ...profile.env } }
}

export function assertProfileIsolation(id: ExperimentProfileId): void {
  applyExperimentProfile(id)
  const { creativeStrategistEnabled, optimizedImagePromptEnabled } =
    require("@/lib/ai-config/phase3") as typeof import("@/lib/ai-config/phase3")
  const { creativeDirectionEnabled } =
    require("@/lib/ai-config/phase2") as typeof import("@/lib/ai-config/phase2")

  if (id === "phase2_deterministic") {
    if (!creativeDirectionEnabled()) throw new Error("phase2 profile missing creative direction")
    if (creativeStrategistEnabled()) throw new Error("phase2 profile contaminated by strategist")
    if (optimizedImagePromptEnabled()) throw new Error("phase2 profile contaminated by optimized prompt")
  }
  if (id === "phase3_strategist") {
    if (!creativeStrategistEnabled()) throw new Error("phase3 profile missing strategist")
    if (creativeDirectionEnabled()) throw new Error("phase3 profile contaminated by phase2 direction")
  }
  if (id === "original_saferu" || id === "generic") {
    if (creativeStrategistEnabled() || creativeDirectionEnabled() || optimizedImagePromptEnabled()) {
      throw new Error(`${id} profile has unexpected creative flags`)
    }
  }
}
