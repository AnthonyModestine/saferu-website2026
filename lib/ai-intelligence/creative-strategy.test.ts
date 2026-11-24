/**
 * Phase 3 creative strategy — AI structured strategy vs deterministic Phase 2 brief.
 * Run: npx --yes tsx --test lib/ai-intelligence/creative-strategy.test.ts
 */

import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  creativeStrategySchema,
  creativeStrategyToImageBlock,
} from "./creative-strategy"
import {
  briefFromAiCreativeStrategy,
  compileCreativeBriefFromInputs,
  isDeterministicCreativeBrief,
} from "@/lib/graphic-studio/creative-brief"
import { buildOptimizedImagePrompt, buildResearchPrompt } from "@/lib/graphic-studio/prompts"

const sampleStrategy = {
  whatResidentsMustUnderstand: "CO is odorless and detectors save lives",
  whyItMatters: "Without a working detector, families may not wake up in time",
  visualChallenge: "The hazard is invisible — literal smoke imagery misleads",
  scrollStopIdea: "Quiet bedroom with a glowing detector as the only warning",
  emotionalResponse: "Restrained urgency — calm dread, not panic",
  conceptOptions: [
    {
      name: "Invisible threat editorial",
      description: "Empty air made ominous around a detector",
      whyItCouldWork: "Communicates invisibility",
      risk: "Too abstract for some audiences",
    },
    {
      name: "Domestic prevention realism",
      description: "Family home with detector install moment",
      whyItCouldWork: "Actionable and familiar",
      risk: "Can look like stock photography",
    },
  ],
  selectedConceptName: "Invisible threat editorial",
  selectionRationale: "Best matches invisible hazard + Serious style without fearmongering",
  primaryVisualConcept: "Dim hallway, single CO detector lit, no visible smoke",
  dominantVisualElement: "The detector face and status light",
  foregroundVsBackground: "Detector sharp foreground; soft domestic background",
  visualStorytellingTechnique: "Absence as meaning — nothing burning, still dangerous",
  artisticDirection: "Muted palette, documentary quiet, high text contrast panel",
  compositionIntent: "Asymmetric left text / right detector focus",
  typographyAsDesign: "Clean sans headline left; body in quieter weight",
  genericApproachesToAvoid: ["Centered stock family smiling", "Fire truck collage"],
  imageryThatCommunicatesWrongMessage: ["Visible black smoke implying CO is smoky"],
  factualVisualDetailsRequired: ["Detector shown with clear status indication"],
  textAndBrandIntegration: "Text left safe zone; logo bottom-right clear of detector",
}

describe("phase3 creative strategy", () => {
  it("validates structured AI creative strategy", () => {
    const parsed = creativeStrategySchema.safeParse(sampleStrategy)
    assert.equal(parsed.success, true)
  })

  it("Phase 2 compile is deterministic template assembly", () => {
    const brief = compileCreativeBriefFromInputs({
      topic: "Carbon monoxide",
      style: "Serious / Urgent",
      approvedHeadline: "CO Alarms Save Lives",
      approvedMessage: "Install detectors.",
      visualConcept: "Detector on wall",
    })
    assert.equal(isDeterministicCreativeBrief(brief), true)
    assert.match(brief.communicationObjective, /^Teach residents:/)
  })

  it("AI strategy brief is not the Phase 2 deterministic template", () => {
    const brief = briefFromAiCreativeStrategy(sampleStrategy, {
      approvedMessage: "Install detectors.",
    })
    assert.equal(isDeterministicCreativeBrief(brief), false)
    assert.equal(brief.layoutArchetype, "Invisible threat editorial")
    assert.match(brief.primaryVisualConcept, /detector/i)
  })

  it("strategy image block is a concise creative direction", () => {
    const block = creativeStrategyToImageBlock(sampleStrategy)
    assert.match(block, /OBJECTIVE:/)
    assert.match(block, /CONCEPT \(Invisible threat editorial\)/)
    assert.doesNotMatch(block, /WHY THIS APPROACH/)
    assert.doesNotMatch(block, /Domestic prevention realism/)
    assert.match(block, /artistic judgment/i)
    assert.doesNotMatch(block, /Foreground\/background/)
  })

  it("research prompt includes concept exploration when strategist on", () => {
    const prompt = buildResearchPrompt({
      category: "Other / Custom",
      topic: "Carbon monoxide detectors",
      audience: "General Community",
      style: "Serious / Urgent",
      visualNotes: "",
      includeCreativeStrategist: true,
    })
    assert.match(prompt, /CREATIVE STRATEGIST/)
    assert.match(prompt, /fundamentally different|DISTINCT communication strategies/)
    assert.match(prompt, /creative_strategy/)
  })

  it("optimized image prompt is concise and keeps locked copy", () => {
    const prompt = buildOptimizedImagePrompt({
      approvedHeadline: "CO Alarms Save Lives",
      approvedMessage: "Install detectors and never ignore the alarm.",
      visualConcept: sampleStrategy.primaryVisualConcept,
      importantVisualDetails: ["Detector status light visible"],
      visualNotes: "",
      style: "Serious / Urgent",
      hasLogoReference: true,
      creativeStrategy: sampleStrategy,
    })
    assert.match(prompt, /APPROVED COPY/)
    assert.match(prompt, /CO Alarms Save Lives/)
    assert.match(prompt, /OBJECTIVE:/)
    assert.match(prompt, /CONCEPT \(Invisible threat editorial\)/)
    assert.doesNotMatch(prompt, /WHY THIS APPROACH/)
    assert.match(prompt, /artistic judgment/i)
    assert.ok(prompt.length < 4500, "optimized prompt should stay concise")
  })
})
