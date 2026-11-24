import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { compileConciseImagePrompt } from "./concise-image-prompt"

describe("concise-image-prompt", () => {
  it("locks exact copy and stays short", () => {
    const prompt = compileConciseImagePrompt({
      approvedHeadline: "Carbon Monoxide: Invisible Threat",
      approvedMessage: "Install working CO detectors and leave if the alarm sounds.",
      style: "Serious / Urgent",
      hasLogoReference: false,
      communicationObjective: "CO is invisible — detectors and evacuation save lives",
      visualConcept: "Family evacuating toward an open door as a CO detector alarms",
      essentialVisualDetails: [
        "CO detector clearly visible",
        "No visible smoke or gas cloud",
        "Family evacuating",
      ],
    })
    assert.match(prompt, /HEADLINE: Carbon Monoxide: Invisible Threat/)
    assert.match(prompt, /Install working CO detectors/)
    assert.match(prompt, /Invisible hazards stay invisible/)
    assert.ok(prompt.length < 2200)
    assert.doesNotMatch(prompt, /layoutArchetype|negative space amplifies/i)
  })

  it("supports text-free hybrid artwork mode", () => {
    const prompt = compileConciseImagePrompt({
      approvedHeadline: "X",
      approvedMessage: "Y",
      style: "Modern",
      hasLogoReference: true,
      textFreeArtwork: true,
      visualConcept: "Gift cards with red X and phone",
    })
    assert.match(prompt, /NO text/i)
    assert.doesNotMatch(prompt, /HEADLINE:/)
  })
})
