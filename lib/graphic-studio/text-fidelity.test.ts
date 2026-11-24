import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  compareExtractedText,
  meaningEqual,
  textFidelityBlocksPublish,
  textFidelityNeedsHumanReview,
} from "./text-fidelity"

describe("text-fidelity", () => {
  it("treats minor punctuation as meaning-equal", () => {
    assert.equal(
      meaningEqual(
        "Don’t Pay Scammers With Gift Cards",
        "Don't Pay Scammers With Gift Cards"
      ),
      true
    )
  })

  it("detects meaning-changing negation loss", () => {
    assert.equal(meaningEqual("Don't Pay Scammers", "Pay Scammers"), false)
    assert.equal(meaningEqual("Never ignore the alarm", "Ignore the alarm"), false)
  })

  it("confirms mismatch vs uncertain", () => {
    const mismatch = compareExtractedText({
      expectedHeadline: "Car Seat Safety for Children",
      expectedMessage: "Always use the right car seat.",
      extractedHeadline: "Wrong Title",
      extractedMessage: "Always use the right car seat.",
      headlineConfidence: "high",
      messageConfidence: "high",
    })
    assert.equal(mismatch.headlineStatus, "mismatch")
    assert.equal(textFidelityBlocksPublish(mismatch), true)

    const uncertain = compareExtractedText({
      expectedHeadline: "Car Seat Safety for Children",
      expectedMessage: "Always use the right car seat.",
      extractedHeadline: "Car Seat Safety for Children?",
      extractedMessage: "Always use the right car seat.",
      headlineConfidence: "low",
      messageConfidence: "high",
    })
    assert.equal(uncertain.headlineStatus, "uncertain")
    assert.equal(textFidelityBlocksPublish(uncertain), false)
    assert.equal(textFidelityNeedsHumanReview(uncertain), true)
  })
})
