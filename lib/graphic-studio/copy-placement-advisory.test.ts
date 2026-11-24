import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { adviseCopyPlacement } from "./copy-placement-advisory"

describe("copy-placement-advisory", () => {
  it("never drops full approved wording from the advisory record", () => {
    const headline = "Carbon Monoxide: Invisible Threat"
    const message =
      "Carbon monoxide is an odorless gas that can kill you in your sleep. Install working CO detectors on every level of your home, and never ignore the alarm—leave immediately if it sounds."
    const a = adviseCopyPlacement({ headline, message })
    assert.equal(a.retainedFullApproved.headline, headline)
    assert.equal(a.retainedFullApproved.message, message)
    assert.equal(a.status, "advisory_only")
    if (a.captionSuggested) {
      assert.equal(a.requiresOwnerApprovalToSplit, true)
    }
  })

  it("prefers research social_caption without mutating graphic copy", () => {
    const a = adviseCopyPlacement({
      headline: "Hang Up on Gift Card Scams",
      message: "Agencies never demand gift cards. Hang up and verify.",
      researchSocialCaption:
        "Learn more from the FTC: scammers pressure victims for untraceable payments. Share this with family.",
    })
    assert.equal(a.onGraphic.message, "Agencies never demand gift cards. Hang up and verify.")
    assert.match(a.captionSuggested || "", /FTC/)
    assert.equal(a.requiresOwnerApprovalToSplit, false)
  })
})
