import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"
import { compileLeanImagePrompt } from "./lean-image-prompt"
import { filterEssentialSafetyConstraints } from "./essential-safety-constraints"
import { buildImagePrompt } from "./prompts"
import { validateCreativeStrategyForImage } from "@/lib/ai-intelligence/creative-strategy-guard"

const sampleStrategy = {
  whatResidentsMustUnderstand: "Never pay with gift cards for taxes or utilities",
  whyItMatters: "Scammers demand gift cards because payments are hard to reverse",
  visualChallenge: "Show refusal without clutter",
  scrollStopIdea: "Hand rejecting gift cards next to a phone",
  emotionalResponse: "Alert but empowered",
  conceptOptions: [
    {
      name: "Refuse the ask",
      description: "Hand declining phone + crossed gift cards",
      whyItCouldWork: "Instant comprehension",
      risk: "Busy if too many icons",
      executionFeasibility: "high" as const,
      feasibilityNotes: "Straightforward still life",
    },
    {
      name: "Checklist realism",
      description: "Resident verifying a bill online",
      whyItCouldWork: "Actionable",
      risk: "Generic",
      executionFeasibility: "high" as const,
      feasibilityNotes: "Easy",
    },
  ],
  selectedConceptName: "Refuse the ask",
  selectionRationale: "This concept is the most direct and universally understood.",
  primaryVisualConcept:
    "A hand declining a phone call beside crossed-out gift cards on a clean desk",
  dominantVisualElement: "Refusal gesture",
  foregroundVsBackground: "Hand and cards sharp; soft desk",
  visualStorytellingTechnique: "Direct prohibition",
  artisticDirection: "Clean editorial still life",
  compositionIntent: "Text left, still life right",
  typographyAsDesign: "Bold sans headline",
  genericApproachesToAvoid: ["Smiling stock family"],
  imageryThatCommunicatesWrongMessage: ["Gift cards as legitimate government payment"],
  factualVisualDetailsRequired: ["Gift cards clearly marked as not for official payments"],
  textAndBrandIntegration: "Logo bottom-right",
}

const staleCoStrategy = {
  ...sampleStrategy,
  selectedConceptName: "Gas cloud metaphor",
  primaryVisualConcept: "A ghostly gas cloud drifting through a quiet bedroom",
  selectionRationale: "Make carbon monoxide visible as an ominous cloud",
}

afterEach(() => {
  delete process.env.SAFERU_AI_PROMPT_MODE
  delete process.env.SAFERU_AI_LEAN_PROMPTS
  delete process.env.SAFERU_AI_IMAGE_VARIANT
})

describe("lean image prompt", () => {
  it("filters speech bubbles and decorative details out of requirements", () => {
    const filtered = filterEssentialSafetyConstraints([
      "Phone with 'Scam' alert displayed",
      "Speech bubble showing urgent request for payment",
      "Hand holding gift cards",
      "Child in a rear-facing car seat, appropriately harnessed",
      "Car seat is located in the rear seat of the car",
      "Friendly, family-oriented style",
    ])
    assert.ok(filtered.some((x) => /rear-facing|harness/i.test(x)))
    assert.ok(filtered.every((x) => !/speech bubble|scam alert|friendly/i.test(x)))
  })

  it("A and B share objective and differ only in visual direction", () => {
    process.env.SAFERU_AI_PROMPT_MODE = "lean"
    process.env.SAFERU_AI_IMAGE_VARIANT = "autonomy"
    const a = buildImagePrompt({
      approvedHeadline: "Don’t Pay Scammers With Gift Cards",
      approvedMessage:
        "Government agencies will never ask you to pay with gift cards. Hang up right away.",
      visualConcept: "Phone next to crossed-out gift cards",
      importantVisualDetails: [
        "Speech bubble showing urgent request for payment",
        "Phone with 'Scam' alert displayed",
      ],
      visualNotes: "",
      style: "Modern",
      hasLogoReference: false,
      creativeStrategy: sampleStrategy,
    })
    process.env.SAFERU_AI_IMAGE_VARIANT = "creative_direction"
    const b = buildImagePrompt({
      approvedHeadline: "Don’t Pay Scammers With Gift Cards",
      approvedMessage:
        "Government agencies will never ask you to pay with gift cards. Hang up right away.",
      visualConcept: "Phone next to crossed-out gift cards",
      importantVisualDetails: [
        "Speech bubble showing urgent request for payment",
        "Phone with 'Scam' alert displayed",
      ],
      visualNotes: "",
      style: "Modern",
      hasLogoReference: false,
      creativeStrategy: sampleStrategy,
    })

    assert.match(a, /COMMUNICATION OBJECTIVE/)
    assert.match(b, /COMMUNICATION OBJECTIVE/)
    assert.match(a, /Never pay with gift cards/)
    assert.match(b, /Never pay with gift cards/)
    // Prohibition text may mention speech bubbles; they must not appear as required details.
    assert.doesNotMatch(a, /REQUIREMENTS:[\s\S]*Speech bubble showing/)
    assert.doesNotMatch(b, /REQUIREMENTS:[\s\S]*Speech bubble showing/)
    assert.doesNotMatch(b, /most direct and universally understood/i)
    assert.match(a, /Do not invent a fake department badge/)
    assert.match(b, /Do not invent a fake department badge/)

    const stripVisual = (p: string) =>
      p.replace(/VISUAL DIRECTION:\n[\s\S]*?\n\nSTYLE:/, "VISUAL DIRECTION:\n___\n\nSTYLE:")
    assert.equal(stripVisual(a), stripVisual(b))
    assert.match(a, /Phone next to crossed-out gift cards/)
    assert.match(b, /crossed-out gift cards on a clean desk/)
  })

  it("does not fold soft selection rationale into visual direction", () => {
    const v = validateCreativeStrategyForImage(sampleStrategy)
    assert.equal(v.ok, true)
    if (v.ok) {
      assert.equal(
        v.visualDirection,
        sampleStrategy.primaryVisualConcept
      )
    }
  })

  it("rejects stale invisible-hazard cloud strategies", () => {
    const v = validateCreativeStrategyForImage(staleCoStrategy)
    assert.equal(v.ok, false)
  })

  it("compiles without inventing logo placement when no logo supplied", () => {
    const prompt = compileLeanImagePrompt({
      approvedHeadline: "Hang Up on Gift Card Scams",
      approvedMessage: "Government agencies never demand gift cards.",
      visualIdea: "Crossed-out gift cards beside a phone",
      communicationObjective: "Hang up on gift-card payment demands",
      style: "Modern",
      hasLogoReference: false,
      importantVisualDetails: ["Speech bubble with payment demand"],
    })
    assert.match(prompt, /Do not invent a fake department badge/)
    assert.doesNotMatch(prompt, /Preserve the supplied official agency logo/)
    assert.doesNotMatch(prompt, /Speech bubble/)
  })
})
