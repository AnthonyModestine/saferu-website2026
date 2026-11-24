import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  CONCEPTUAL_STRATEGY_INSTRUCTIONS,
  formatConciseCreativeDirection,
} from "./conceptual-strategy-instructions"

describe("conceptual strategy instructions", () => {
  it("asks for fundamentally different approaches, not layout variants", () => {
    assert.match(CONCEPTUAL_STRATEGY_INSTRUCTIONS, /fundamentally different/)
    assert.match(CONCEPTUAL_STRATEGY_INSTRUCTIONS, /not merely different layouts/)
    assert.match(CONCEPTUAL_STRATEGY_INSTRUCTIONS, /simple, direct concept/)
    assert.match(CONCEPTUAL_STRATEGY_INSTRUCTIONS, /artistic judgment/)
  })

  it("formats a short image-model direction", () => {
    const d = formatConciseCreativeDirection({
      objective: "Hang up on gift-card payment demands",
      selectedConceptName: "Refuse the ask",
      primaryVisualConcept: "A hand declining a phone call beside crossed-out gift cards",
      selectionRationale: "Direct and instantly readable",
      emotionalResponse: "Alert but empowered",
      mustNotMislead: ["Do not show gift cards as legitimate government payment"],
      factualMusts: ["Clear prohibition of gift-card payment to scammers"],
    })
    assert.match(d, /^OBJECTIVE:/m)
    assert.match(d, /CONCEPT \(Refuse the ask\)/)
    assert.ok(d.length < 900)
  })
})
