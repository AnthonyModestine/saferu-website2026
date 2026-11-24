/**
 * Run: npx --yes tsx --test lib/ai-config/experiment-profiles.test.ts
 */
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { applyExperimentProfile, assertProfileIsolation } from "./experiment-profiles"
import { creativeDirectionEnabled, styleGuidanceEnabled } from "./phase2"
import {
  creativeStrategistEnabled,
  optimizedImagePromptEnabled,
} from "./phase3"

describe("experiment profile isolation", () => {
  it("phase2 does not enable strategist or optimized prompt", () => {
    assertProfileIsolation("phase2_deterministic")
    assert.equal(creativeDirectionEnabled(), true)
    assert.equal(styleGuidanceEnabled(), true)
    assert.equal(creativeStrategistEnabled(), false)
    assert.equal(optimizedImagePromptEnabled(), false)
  })

  it("phase3 does not enable phase2 creative direction", () => {
    assertProfileIsolation("phase3_strategist")
    assert.equal(creativeStrategistEnabled(), true)
    assert.equal(optimizedImagePromptEnabled(), true)
    assert.equal(creativeDirectionEnabled(), false)
  })

  it("generic and original keep creative flags off", () => {
    applyExperimentProfile("generic")
    assert.equal(creativeStrategistEnabled(), false)
    assert.equal(creativeDirectionEnabled(), false)
    applyExperimentProfile("original_saferu")
    assert.equal(optimizedImagePromptEnabled(), false)
  })

  it("concise prompt is experimental and keeps phase2 creative direction off", () => {
    applyExperimentProfile("concise_prompt")
    assert.equal(process.env.SAFERU_AI_PROMPT_MODE, "concise")
    assert.equal(creativeStrategistEnabled(), true)
    assert.equal(creativeDirectionEnabled(), false)
    assert.equal(process.env.SAFERU_AI_TEXT_FREE_ARTWORK, undefined)
  })

  it("lean autonomy and creative_direction are independently selectable", () => {
    applyExperimentProfile("lean_autonomy")
    assert.equal(process.env.SAFERU_AI_PROMPT_MODE, "lean")
    assert.equal(process.env.SAFERU_AI_IMAGE_VARIANT, "autonomy")
    assert.equal(creativeStrategistEnabled(), false)

    applyExperimentProfile("lean_creative_direction")
    assert.equal(process.env.SAFERU_AI_IMAGE_VARIANT, "creative_direction")
    assert.equal(creativeStrategistEnabled(), true)
    assert.equal(creativeDirectionEnabled(), false)
  })

  it("lean research only keeps image mode generic", () => {
    applyExperimentProfile("lean_research_only")
    assert.equal(process.env.SAFERU_AI_LEAN_PROMPTS, "1")
    assert.equal(process.env.SAFERU_AI_PROMPT_MODE, "generic")
  })
})
