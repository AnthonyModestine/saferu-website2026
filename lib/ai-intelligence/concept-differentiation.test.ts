import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { conceptsMeaningfullyDiffer } from "./concept-differentiation"

describe("concept differentiation", () => {
  it("treats holiday phone+gift+red-X variants as the same approach", () => {
    const a =
      "A scammer’s urgent payment demand over the phone with a large red ‘X’ over gift cards."
    const b =
      "A hand holding a phone with a suspicious payment demand, several gift cards in the foreground, all crossed out by a large red 'X'."
    assert.equal(conceptsMeaningfullyDiffer(a, b), false)
  })

  it("detects clearly different communication approaches", () => {
    const a =
      "Illustration of a child in a rear-facing car seat correctly positioned in the back seat, with a visible airbag symbol on the front seat."
    assert.equal(conceptsMeaningfullyDiffer(a, a), false)
    assert.equal(
      conceptsMeaningfullyDiffer(
        a,
        "A quiet living-room conversation between two caregivers reviewing a printed car-seat fitting checklist"
      ),
      true
    )
  })
})
