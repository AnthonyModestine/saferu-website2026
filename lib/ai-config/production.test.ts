/**
 * Run: npx --yes tsx --test lib/ai-config/production.test.ts
 */
import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"
import {
  aiEnvInventory,
  productionLeanImageEnabled,
  recommendedProductionAiEnv,
  validateProductionAiConfig,
} from "./production"
import { leanImagePromptEnabled } from "@/lib/graphic-studio/lean-image-prompt"
import { buildImagePrompt, buildResearchPrompt } from "@/lib/graphic-studio/prompts"

afterEach(() => {
  for (const k of Object.keys(recommendedProductionAiEnv())) {
    delete process.env[k]
  }
  delete process.env.SAFERU_AI_PROMPT_MODE
  delete process.env.SAFERU_AI_PRODUCTION_IMAGE_LEAN
  delete process.env.SAFERU_AI_LEAN_PROMPTS
  delete process.env.SAFERU_AI_IMAGE_VARIANT
  delete process.env.SAFERU_AI_CREATIVE_DIRECTION
  delete process.env.SAFERU_AI_OPTIMIZED_IMAGE_PROMPT
})

describe("production AI configuration", () => {
  it("recommended env activates lean image and not lean research", () => {
    const env = recommendedProductionAiEnv()
    for (const [k, v] of Object.entries(env)) process.env[k] = v
    assert.equal(productionLeanImageEnabled(), true)
    assert.equal(leanImagePromptEnabled(), true)
    const check = validateProductionAiConfig(process.env)
    assert.equal(check.leanImageActive, true)
    assert.equal(check.leanResearchDisabled, true)
    assert.equal(check.editorialDisabled, true)
    assert.equal(check.failOpenDisabled, true)
    assert.equal(check.ok, true)
  })

  it("lean production path cannot accidentally use phase3 optimized lectures", () => {
    for (const [k, v] of Object.entries(recommendedProductionAiEnv())) process.env[k] = v
    // Even if an operator mistakenly also sets optimized/strategist leftovers:
    process.env.SAFERU_AI_OPTIMIZED_IMAGE_PROMPT = "1"
    process.env.SAFERU_AI_CREATIVE_STRATEGIST = "1"
    const prompt = buildImagePrompt({
      approvedHeadline: "Hang Up on Gift Card Scams",
      approvedMessage: "Agencies never demand gift cards.",
      visualConcept: "Phone beside crossed-out gift cards",
      importantVisualDetails: [],
      visualNotes: "",
      style: "Modern",
      hasLogoReference: false,
    })
    assert.match(prompt, /exceptional professional public safety graphic/i)
    assert.doesNotMatch(prompt, /PRIORITY: \(1\) safety/)
    assert.doesNotMatch(prompt, /WHY THIS APPROACH/)
    assert.doesNotMatch(prompt, /TECHNICAL\n- Phone-first/)
  })

  it("research stays on original family when lean research flag is off", () => {
    for (const [k, v] of Object.entries(recommendedProductionAiEnv())) process.env[k] = v
    const research = buildResearchPrompt({
      category: "Other / Custom",
      topic: "Holiday gift card scam prevention",
      audience: "General Community",
      style: "Modern",
      visualNotes: "",
      includeCreativeStrategist: false,
    })
    assert.match(research, /public-safety content editor for SaferU Graphic Studio/)
    assert.doesNotMatch(research, /senior public safety communications strategist/)
  })

  it("inventory documents required and disabled variables", () => {
    const inv = aiEnvInventory()
    assert.ok(inv.some((x) => x.name === "SAFERU_AI_PRODUCTION_IMAGE_LEAN" && x.status === "required"))
    assert.ok(inv.some((x) => x.name === "SAFERU_AI_LEAN_PROMPTS" && x.status === "disabled"))
    assert.ok(inv.some((x) => x.name === "SAFERU_AI_OPTIMIZED_IMAGE_PROMPT" && x.status === "superseded"))
    assert.ok(inv.some((x) => x.name === "SAFERU_AI_ADAPTIVE_CREATIVE_SHADOW" && x.productionValue === "0"))
    assert.ok(inv.some((x) => x.name === "SAFERU_AI_PROFESSIONAL_WRITING" && x.productionValue === "0"))
  })
})
