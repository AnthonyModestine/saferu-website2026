/**
 * Deterministic mocked workflow smoke — no paid API calls.
 * Validates prompt/config paths for staging readiness.
 *
 *   npx --yes tsx scripts/ai-eval/mock-workflow-smoke.ts
 */
import assert from "node:assert/strict"
import { recommendedProductionAiEnv, validateProductionAiConfig } from "../../lib/ai-config/production"
import { buildImagePrompt, buildResearchPrompt } from "../../lib/graphic-studio/prompts"
import { leanImagePromptEnabled } from "../../lib/graphic-studio/lean-image-prompt"
import { adaptiveCreativeShadowEnabled, leanPromptsEnabled } from "../../lib/ai-config/phase3"
import { recordGraphicQualityEvent } from "../../lib/graphic-studio/quality-metrics"
import { adviseCopyPlacement } from "../../lib/graphic-studio/copy-placement-advisory"
import { applyLogoExpectationGuards, toInspection } from "../../lib/graphic-studio/qa-normalize"

for (const [k, v] of Object.entries(recommendedProductionAiEnv())) {
  process.env[k] = v
}

const check = validateProductionAiConfig(process.env)
assert.equal(check.ok, true, check.issues.join("; "))
assert.equal(leanImagePromptEnabled(), true)
assert.equal(leanPromptsEnabled(), false)
assert.equal(adaptiveCreativeShadowEnabled(), false)

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

const image = buildImagePrompt({
  approvedHeadline: "Don’t Pay Scammers With Gift Cards",
  approvedMessage: "Government agencies will never ask you to pay with gift cards.",
  visualConcept: "Phone beside crossed-out gift cards",
  importantVisualDetails: ["Speech bubble showing urgent request"],
  visualNotes: "",
  style: "Modern",
  hasLogoReference: false,
})
assert.match(image, /exceptional professional public safety graphic/i)
assert.doesNotMatch(image, /Speech bubble showing/)
assert.doesNotMatch(image, /PRIORITY: \(1\) safety/)
assert.match(image, /Do not invent a fake department badge/)

const placement = adviseCopyPlacement({
  headline: "Don’t Pay Scammers With Gift Cards",
  message: "Government agencies will never ask you to pay with gift cards. Hang up.",
})
assert.equal(placement.retainedFullApproved.headline, "Don’t Pay Scammers With Gift Cards")

const qa = applyLogoExpectationGuards(
  toInspection(
    {
      pass: false,
      issues: ["Missing expected logo on graphic"],
      accidental_logo: false,
      outcome: "correction_required",
      notes: [],
      defects: [
        {
          category: "agency_branding",
          severity: "major",
          description: "Missing expected logo on graphic",
        },
      ],
    },
    "mock"
  ),
  false
)
assert.equal(qa.pass, true)

assert.doesNotThrow(() =>
  recordGraphicQualityEvent({
    at: new Date().toISOString(),
    result: "success",
    latencyMs: 10,
    promptVersion: "lean-image-v2+autonomy",
    imageVariant: "autonomy",
  })
)

console.log(
  JSON.stringify(
    {
      ok: true,
      leanImage: true,
      leanResearch: false,
      adaptiveShadow: false,
      professionalWriting: process.env.SAFERU_AI_PROFESSIONAL_WRITING,
      imagePromptChars: image.length,
      researchPromptFamily: "original",
    },
    null,
    2
  )
)
