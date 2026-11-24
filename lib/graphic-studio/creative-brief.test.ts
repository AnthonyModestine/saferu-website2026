/**
 * Creative brief + style guidance — Phase 2B.
 * Run: npx --yes tsx --test lib/graphic-studio/creative-brief.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { compileCreativeBriefFromInputs, creativeBriefToPromptBlock } from "./creative-brief"
import { styleGuidanceFor, topicCreativeHints } from "./style-guidance"
import { buildImagePrompt } from "./prompts"

describe("creative direction", () => {
  it("compiles a structured brief with safety must-nots", () => {
    const brief = compileCreativeBriefFromInputs({
      topic: "Carbon monoxide awareness",
      style: "Serious / Urgent",
      approvedHeadline: "CO Alarms Save Lives",
      approvedMessage: "Install detectors and never ignore the alarm — CO is odorless.",
      visualConcept: "Quiet home interior with detector",
    })
    assert.ok(brief.safetyDepictionRequirements.length >= 2)
    assert.ok(brief.mustNotAppear.some((x) => /fake|badge/i.test(x)))
    assert.match(brief.emotionalTone, /Serious|urgent|Credible/i)
  })

  it("provides distinct style guidance strings", () => {
    const realistic = styleGuidanceFor("Realistic")
    const bold = styleGuidanceFor("Bold Public Safety")
    assert.notEqual(realistic, bold)
    assert.match(realistic, /Photoreal|documentary/i)
  })

  it("adapts topic hints for CO vs scam", () => {
    const co = topicCreativeHints("carbon monoxide detector", "Let SaferU Decide")
    const scam = topicCreativeHints("romance scam prevention", "Let SaferU Decide")
    assert.match(co, /atmospheric|restrained/i)
    assert.match(scam, /conceptual|editorial/i)
  })

  it("includes priority hierarchy in image prompt", () => {
    const prompt = buildImagePrompt({
      approvedHeadline: "Lock Your Car",
      approvedMessage: "Remove valuables and lock doors overnight.",
      visualConcept: "Parked car at night with locked door",
      importantVisualDetails: [],
      visualNotes: "",
      style: "Modern",
      hasLogoReference: true,
      topic: "Crime prevention",
    })
    assert.match(prompt, /PRIORITY HIERARCHY/)
    assert.match(prompt, /Lock Your Car/)
  })

  it("creative brief block respects feature flag off by default", () => {
    const prevCreative = process.env.SAFERU_AI_CREATIVE_DIRECTION
    const prevStyle = process.env.SAFERU_AI_STYLE_GUIDANCE
    delete process.env.SAFERU_AI_CREATIVE_DIRECTION
    delete process.env.SAFERU_AI_STYLE_GUIDANCE

    const brief = compileCreativeBriefFromInputs({
      topic: "Water safety",
      style: "Clean Infographic",
      approvedHeadline: "Life Jackets",
      approvedMessage: "Wear a life jacket on open water.",
      visualConcept: "Boat with life jackets",
    })
    // Module functions read env at call time for flags in creativeBriefToPromptBlock
    const block = creativeBriefToPromptBlock(brief)
    // With flags off, block is empty
    assert.equal(block, "")

    process.env.SAFERU_AI_CREATIVE_DIRECTION = "1"
    const blockOn = creativeBriefToPromptBlock(brief)
    assert.match(blockOn, /CREATIVE BRIEF/)

    if (prevCreative === undefined) delete process.env.SAFERU_AI_CREATIVE_DIRECTION
    else process.env.SAFERU_AI_CREATIVE_DIRECTION = prevCreative
    if (prevStyle === undefined) delete process.env.SAFERU_AI_STYLE_GUIDANCE
    else process.env.SAFERU_AI_STYLE_GUIDANCE = prevStyle
  })
})
